import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role } from '../types';
import { PRESETS } from '../constants';

const RECAPTCHA_SITE_KEY = '6Le3wV4sAAAAAP__NFQlzvSI56A7mqjPdLR9SxM4';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
  onSendMessage: (text: string, captchaToken: string) => void;
  showImageControls?: boolean;
  onReset?: () => void;
  onReplaceImage?: () => void;
  onOpenCamera?: () => void;
  onSave?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isProcessing, onSendMessage, showImageControls, onReset, onReplaceImage, onOpenCamera, onSave }) => {
  const [input, setInput] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render the reCAPTCHA widget once the container is mounted and the API is loaded
  useEffect(() => {
    if (!captchaContainerRef.current) return;
    const container = captchaContainerRef.current;

    const renderCaptcha = () => {
      // Avoid double-rendering
      if (captchaWidgetId.current !== null) return;
      captchaWidgetId.current = grecaptcha.render(container, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(null),
        'error-callback': () => setCaptchaToken(null),
        theme: 'dark',
      });
    };

    // The reCAPTCHA script may or may not be loaded yet (async defer)
    if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.render === 'function') {
      renderCaptcha();
    } else {
      // Poll until the API is ready (script is loading async)
      const interval = setInterval(() => {
        if (typeof grecaptcha !== 'undefined' && typeof grecaptcha.render === 'function') {
          clearInterval(interval);
          renderCaptcha();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const resetCaptcha = useCallback(() => {
    setCaptchaToken(null);
    if (captchaWidgetId.current !== null) {
      try { grecaptcha.reset(captchaWidgetId.current); } catch (_) { /* ignore if not ready */ }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing || !captchaToken) return;
    onSendMessage(input, captchaToken);
    setInput('');
    resetCaptcha();
  };

  const handlePresetClick = (prompt: string) => {
    if (!captchaToken) return;
    onSendMessage(prompt, captchaToken);
    resetCaptcha();
  };

  return (
    <div className="flex flex-col h-full lg:h-full min-h-[400px] bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {showImageControls && (
        <div className="px-4 py-3 border-b border-white/10 bg-slate-900/40">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg transition-all"
              >
                Reset
              </button>
            )}
            {onReplaceImage && (
              <button
                type="button"
                onClick={onReplaceImage}
                className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg transition-all"
              >
                Upload
              </button>
            )}
            {onOpenCamera && (
              <button
                type="button"
                onClick={onOpenCamera}
                className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg transition-all"
              >
                Camera
              </button>
            )}
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all flex items-center justify-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                  <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                  <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                </svg>
                <span>Save</span>
              </button>
            )}
          </div>
        </div>
      )}
      <div className="p-5 border-b border-white/10 bg-slate-900/40">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Magic Presets</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetClick(p.prompt)}
              disabled={isProcessing || !captchaToken}
              className="flex-shrink-0 px-4 py-2 rounded-xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 transition-all disabled:opacity-50"
            >
              <span className="text-xs font-bold text-slate-200">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30 italic">
             <p className="text-sm">Upload a photo to start editing...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === Role.USER
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex justify-start">
             <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-none border border-white/5 flex space-x-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-5 pt-4 border-t border-white/10 bg-slate-900/40">
        <div ref={captchaContainerRef} className="flex justify-center mb-3" />
        {!captchaToken && (
          <p className="text-[10px] text-slate-500 text-center mb-2">Complete the CAPTCHA above to send a request</p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="px-5 pb-5 bg-slate-900/40">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="Edit instructions..."
            className="w-full bg-black/40 text-white placeholder-slate-600 border border-white/5 rounded-xl py-4 pl-5 pr-14 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing || !captchaToken}
            className="absolute right-2 p-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-0 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};