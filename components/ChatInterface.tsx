import React, { useState, useRef, useEffect } from 'react';
import { Message, Role } from '../types';
import { PRESETS } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
  onSendMessage: (text: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isProcessing, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-white/10 bg-slate-900/40">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Magic Presets</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onSendMessage(p.prompt)}
              disabled={isProcessing}
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

      <form onSubmit={handleSubmit} className="p-5 border-t border-white/10 bg-slate-900/40">
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
            disabled={!input.trim() || isProcessing}
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