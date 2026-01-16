import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

/**
 * Layer 2 Security: Firebase App Check
 * This ensures that requests to backend services (or in this case, the integrity of the app session)
 * are coming from the genuine application and not a script/bot.
 * 
 * Note: To fully enforce this on the Gemini API side, you would typically proxy requests 
 * through a Cloud Function that validates the App Check token, OR use the Vertex AI for Firebase SDK.
 * 
 * Since this app uses the direct @google/genai SDK with an API Key, this client-side check 
 * serves as a deterrent and a place to integrate the "I am human" verification flow.
 */

// Placeholder config - You would replace these with your actual Firebase Console values
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "photo-fun.firebaseapp.com",
  projectId: "photo-fun",
  storageBucket: "photo-fun.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let appCheckInitialized = false;

export const initializeSecurity = () => {
  if (appCheckInitialized) return;

  try {
    // We wrap this in a try/catch because we are providing dummy config in this generator.
    // In a real deployment, valid keys are required.
    const app = initializeApp(firebaseConfig);

    // Using ReCaptcha Enterprise as the provider
    // The site key must match the one in index.html
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider('6LeHgnopAAAAAP_qA-w2yHl4yd8q8a9b0c1d2e3f'),
      isTokenAutoRefreshEnabled: true 
    });

    appCheckInitialized = true;
    console.log('Security Layer 2 (App Check) Initialized');
  } catch (e) {
    console.warn('Security Layer 2 initialization skipped (Missing valid config). This is expected in the demo environment.');
  }
};
