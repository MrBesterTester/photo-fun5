import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { ChatInterface } from './components/ChatInterface';
import { Message, Role } from './types';
import { editImageWithGemini } from './services/geminiService';
import { ERROR_MESSAGES } from './constants';

const MAX_SESSION_REQUESTS = 10;

const App: React.FC = () => {
  const [apiKeyVerified, setApiKeyVerified] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    // Check if API key is available from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env.GEMINI_API_KEY as string);
    if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
      setApiKeyVerified(true);
    } else {
      setApiKeyVerified(false);
    }
  }, []);

  const handleSelectKey = async () => {
    // In local development, show instructions
    alert('To set your API key:\n1. Create a .env.local file in the project root\n2. Add: GEMINI_API_KEY=your_key_here\n3. Restart the dev server\n\nGet your key from: https://aistudio.google.com/app/apikey');
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
      const err = error.toString();
      if (err.includes("Requested entity was not found")) {
        setApiKeyVerified(false);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: Role.MODEL, text: ERROR_MESSAGES.generic, timestamp: Date.now() }]);
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
            {!currentImage ? (
              <ImageUploader onImageSelect={handleImageSelect} />
            ) : (
              <ImagePreview 
                originalImage={originalImage!}
                currentImage={currentImage}
                isProcessing={isProcessing}
                onReset={handleReset}
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