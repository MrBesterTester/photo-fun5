import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ChatInterface } from './components/ChatInterface';
import { Message, Role } from './types';
import { editImageWithGemini } from './services/geminiService';
import { ERROR_MESSAGES } from './constants';
import { loadImageAsBase64 } from './utils/imageLoader';

const MAX_SESSION_REQUESTS = 10;
const DEFAULT_IMAGE_PATH = '/images/default-portrait.jpg';

const App: React.FC = () => {
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [isLoadingDefault, setIsLoadingDefault] = useState(true);

  useEffect(() => {
    // Check if API is available: TrueFoundry (Option A) or direct Gemini
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string);
    const tfBase = import.meta.env.VITE_TRUEFOUNDRY_BASE_URL || (process.env.TRUEFOUNDRY_BASE_URL as string);
    const tfKey = import.meta.env.VITE_TRUEFOUNDRY_API_KEY || (process.env.TRUEFOUNDRY_API_KEY as string);

    const hasGemini = geminiKey && geminiKey.trim() !== '' && geminiKey !== 'your_gemini_api_key_here';
    const hasTrueFoundry = tfBase && tfKey && tfKey.trim() !== '';

    setApiKeyVerified(hasGemini || hasTrueFoundry);
  }, []);

  // Load default image on mount
  useEffect(() => {
    const loadDefaultImage = async () => {
      try {
        const base64Image = await loadImageAsBase64(DEFAULT_IMAGE_PATH);
        setOriginalImage(base64Image);
        setCurrentImage(base64Image);
        setMessages([{
          id: 'init',
          role: Role.MODEL,
          text: "Awesome photo! Select a style or type your request below.",
          timestamp: Date.now()
        }]);
      } catch (error) {
        console.warn('Could not load default image, user can upload their own:', error);
        // If default image fails to load, just show the uploader
      } finally {
        setIsLoadingDefault(false);
      }
    };

    loadDefaultImage();
  }, []);

  const handleSelectKey = async () => {
    alert(
      'To set your API:\n\n' +
      'Option A – TrueFoundry (recommended):\n' +
      '1. Create .env.local in the project root\n' +
      '2. Add: TRUEFOUNDRY_BASE_URL, TRUEFOUNDRY_API_KEY, TRUEFOUNDRY_MODEL, TRUEFOUNDRY_METADATA_PROJECT_ID\n' +
      '3. Restart the dev server\n\n' +
      'Option B – Direct Gemini:\n' +
      '1. Add: GEMINI_API_KEY=your_key_here\n\n' +
      'See docs/TRUEFOUNDRY_SETUP.md and README.md for details.'
    );
  };

  const handleImageSelect = useCallback((base64: string) => {
    setOriginalImage(base64);
    setCurrentImage(base64);
    setMessages([{
      id: 'init',
      role: Role.MODEL,
      text: "Awesome photo! Select a style or type your request below.",
      timestamp: Date.now()
    }]);
  }, []);

  const handleReplaceImage = useCallback(() => {
    // Reset to show uploader, allowing user to upload a new image
    setOriginalImage(null);
    setCurrentImage(null);
    setMessages([]);
  }, []);

  const handleReset = useCallback(() => {
    if (originalImage) setCurrentImage(originalImage);
  }, [originalImage]);

  const handleSendMessage = async (text: string) => {
    if (requestCount >= MAX_SESSION_REQUESTS) {
       setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: ERROR_MESSAGES.quota, timestamp: Date.now() }]);
       return;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.USER, text, timestamp: Date.now() }]);
    setIsProcessing(true);
    setRequestCount(prev => prev + 1);

    try {
      const { image, text: responseText } = await editImageWithGemini(currentImage!, text);
      if (image) setCurrentImage(image);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: responseText || "Transformation complete!", timestamp: Date.now() }]);
    } catch (error: any) {
      const err = error?.message || error?.toString?.() || String(error);
      if (err.includes("Requested entity was not found")) {
        setApiKeyVerified(false);
      } else {
        // In dev, show the real error so you can debug in Safari (no DevTools needed)
        const display = import.meta.env.DEV ? `${ERROR_MESSAGES.generic} (${err})` : ERROR_MESSAGES.generic;
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: display, timestamp: Date.now() }]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header onChangeKey={handleSelectKey} />
      <main className="flex-1 overflow-hidden p-4 md:p-6 lg:p-10 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-h-[400px] lg:h-full bg-slate-900 rounded-3xl overflow-hidden border border-white/5">
            {isLoadingDefault ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                  <p className="text-slate-400">Loading default image...</p>
                </div>
              </div>
            ) : !currentImage ? (
              <ImageUploader onImageSelect={handleImageSelect} />
            ) : (
              <ImagePreview 
                originalImage={originalImage!}
                currentImage={currentImage}
                isProcessing={isProcessing}
                onReset={handleReset}
                onReplaceImage={handleReplaceImage}
              />
            )}
          </div>
          <div className="w-full lg:w-[450px] h-full">
             <ChatInterface 
                messages={messages}
                isProcessing={isProcessing}
                onSendMessage={handleSendMessage}
             />
          </div>
      </main>
    </div>
  );
};

export default App;