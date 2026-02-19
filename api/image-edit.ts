import { readFileSync, existsSync } from "fs";
import * as path from "path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

const requestSchema = z.object({
  imageBase64: z.string().min(1).max(14_000_000),
  prompt: z.string().min(1).max(1000),
  captchaToken: z.string().min(1),
});

/**
 * Serverless API route for image editing with Gemini
 * Keeps API key secure on the server side
 *
 * Local dev: when GEMINI_API_KEY is not in process.env, load .env.local
 * (avoids dotenv dependency; Vercel prod uses env vars from project settings).
 */

// 2K image ≈1120 tokens; leave room for thinking + text. 512 was truncating (finishReason: MAX_TOKENS, numParts: 0).
const MAX_OUTPUT_TOKENS = 8192;

function loadEnvLocal(): void {
  if (process.env.GEMINI_API_KEY) return;
  try {
    const p = path.resolve(process.cwd(), ".env.local");
    if (existsSync(p)) {
      const content = readFileSync(p, "utf8");
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([^#=]+)=(.*)$/);
        if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch (_) {}
}
loadEnvLocal();

// --- Rate limiter (Upstash Redis, sliding window) ---
// Created at module level so the instance is reused across warm invocations.
// If env vars are missing, ratelimit is null and requests pass through.
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(10, "600 s"), // 10 requests per 10 minutes
    prefix: "@upstash/ratelimit:image-edit",
  });
} else {
  console.warn("[image-edit] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set — rate limiting disabled");
}

/** Verify reCAPTCHA token with Google's siteverify API. Returns true if valid. */
async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error("[image-edit] RECAPTCHA_SECRET_KEY is not configured");
    return false;
  }
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    });
    const data = (await response.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[image-edit] reCAPTCHA verification request failed:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { imageBase64, prompt, captchaToken } = parsed.data;

    // Verify reCAPTCHA token before proceeding
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return new Response(JSON.stringify({ error: "CAPTCHA verification failed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limit by IP (sliding window: 10 req / 10 min)
    if (ratelimit) {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
      const { success, reset } = await ratelimit.limit(ip);
      if (!success) {
        const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API key is not configured on the server" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Parse image data and validate mimeType
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const extractedMime = mimeMatch ? mimeMatch[1] : null;

    if (!extractedMime || !(ALLOWED_MIME_TYPES as readonly string[]).includes(extractedMime)) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mimeType = extractedMime;
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Build enforcement prompt
    const enforcementPrompt = `TASK: Edit the provided image based on the USER INSTRUCTION below.
STRICT RULES:
1. Identity Preservation: You MUST maintain the core identity, facial features, and key characteristics of the main subject. The person must remain recognizable.
2. Composition: Preserve the original image's angle, pose, and composition unless explicitly told to change it.
3. Creativity: If a style is requested, apply it vividly and artistically.
4. Output: Generate a high-quality, visually striking image.
USER INSTRUCTION: ${prompt}`;

    const contents = [
      { text: enforcementPrompt },
      { inlineData: { mimeType, data: cleanBase64 } },
    ];
    const config = {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '4:3', imageSize: '2K' },
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents,
      config,
    });

    let generatedImage: string | undefined;
    let generatedText: string | undefined;

    function toBase64(raw: unknown): string | undefined {
      if (typeof raw === 'string') return raw;
      if (typeof Uint8Array !== 'undefined' && raw instanceof Uint8Array) return Buffer.from(raw).toString('base64');
      if (typeof ArrayBuffer !== 'undefined' && raw instanceof ArrayBuffer) return Buffer.from(raw).toString('base64');
      return undefined;
    }

    function parseParts(parts: unknown[]): void {
      if (!parts || !Array.isArray(parts)) return;
      for (const part of parts) {
        const p = part as Record<string, unknown>;
        const blob = (p.inlineData ?? p.inline_data) as { data?: unknown; mimeType?: string; mime_type?: string } | undefined;
        if (blob) {
          const b64 = toBase64(blob.data);
          if (b64) {
            const mime = blob.mimeType || blob.mime_type || 'image/png';
            generatedImage = `data:${mime};base64,${b64}`;
          }
        } else if (p.text && typeof p.text === 'string') {
          generatedText = p.text;
        }
      }
    }

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      parseParts(candidate.content.parts);
    }

    // Fallbacks: SDK getters that exclude or merge parts (e.g. thought vs final)
    const resp = response as { text?: string; data?: string };
    if (!generatedText && typeof resp.text === 'string' && resp.text.trim()) generatedText = resp.text;
    if (!generatedImage && typeof resp.data === 'string' && resp.data.length > 0) generatedImage = `data:image/png;base64,${resp.data}`;

    if (!generatedImage && !generatedText) {
      const fb = (response as { promptFeedback?: { blockReason?: string; blockReasonMessage?: string } }).promptFeedback;
      const fr = candidate?.finishReason as string | undefined;
      if (fb?.blockReason) {
        const msg = fb.blockReasonMessage || fb.blockReason || 'Content was blocked by safety filters.';
        return new Response(JSON.stringify({ error: `Request blocked: ${msg}` }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      console.warn('[image-edit] No content from Gemini.', JSON.stringify({
        hasCandidates: !!response.candidates?.length,
        numCandidates: response.candidates?.length ?? 0,
        hasContent: !!candidate?.content,
        numParts: candidate?.content?.parts?.length ?? 0,
        finishReason: fr,
      }));
      return new Response(JSON.stringify({
        error: "No content generated from Gemini API. The model returned no image or text. Try a different prompt or image.",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: generatedImage, text: generatedText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; statusCode?: number };
    const errorMessage = err?.message || (error != null ? String(error) : "Unknown error");
    console.error("Gemini API Error:", errorMessage, error);

    if (typeof errorMessage === "string") {
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
        return new Response(JSON.stringify({ error: "Invalid or missing API key" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (errorMessage.includes("quota") || errorMessage.includes("429") || errorMessage.includes("Resource Exhausted")) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (errorMessage.includes("model") || errorMessage.includes("not found") || errorMessage.includes("404")) {
        return new Response(
          JSON.stringify({
            error: `Model or request error: ${errorMessage}.`,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
