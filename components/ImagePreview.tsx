import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImagePreviewProps {
  originalImage: string;
  currentImage: string;
  isProcessing: boolean;
  onReset: () => void;
  onReplaceImage?: () => void;
  onCameraImage?: (base64: string) => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ originalImage, currentImage, isProcessing, onReset, onReplaceImage, onCameraImage }) => {
  const [comparing, setComparing] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start/stop camera when modal opens/closes
  useEffect(() => {
    if (!cameraOpen || !onCameraImage) return;
    setCameraError(null);
    const constraints: MediaStreamConstraints = {
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    };
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err: Error) => {
        setCameraError(err?.message || 'Could not access camera. Please allow camera permission.');
      });
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraOpen, onCameraImage]);

  const closeCamera = useCallback(() => {
    setCameraOpen(false);
    setCameraError(null);
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current || !onCameraImage) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCameraImage(dataUrl);
    closeCamera();
  }, [onCameraImage, closeCamera]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `photofun-edit-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="relative w-full h-full flex flex-col p-4 md:p-8">
      <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 group shadow-2xl">
        <img 
          src={comparing ? originalImage : currentImage} 
          alt="Visual" 
          className="w-full h-full object-contain transition-opacity duration-300"
        />

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-blue-100 font-bold tracking-widest uppercase animate-pulse">Processing</p>
          </div>
        )}

        {!isProcessing && (
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
              <div className="flex gap-2">
                <button 
                  onClick={onReset}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-lg backdrop-blur-md transition-all"
                >
                  Reset
                </button>
                {onReplaceImage && (
                  <button 
                    onClick={onReplaceImage}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg backdrop-blur-md transition-all"
                  >
                    Upload Image
                  </button>
                )}
                {onCameraImage && (
                  <button 
                    onClick={() => setCameraOpen(true)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-500/20 hover:bg-blue-500/40 border border-blue-500/50 rounded-lg backdrop-blur-md transition-all"
                  >
                    Use Camera
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                {currentImage !== originalImage && (
                  <button 
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg backdrop-blur-md transition-all"
                    onMouseDown={() => setComparing(true)}
                    onMouseUp={() => setComparing(false)}
                    onMouseLeave={() => setComparing(false)}
                  >
                    Hold to Compare
                  </button>
                )}
                <button 
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-6 py-2 bg-white text-black rounded-lg hover:bg-slate-200 transition-all font-bold text-sm shadow-xl"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                      <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    <span>Save</span>
                </button>
              </div>
           </div>
        )}
      </div>

      {/* Camera modal (portal so it overlays everything) */}
      {cameraOpen && onCameraImage && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-2xl aspect-[4/3] bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-red-400 text-center px-4">{cameraError}</p>
              </div>
            )}
          </div>
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={closeCamera}
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white border border-white/30 hover:border-white/50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={!!cameraError}
              className="px-8 py-3 text-sm font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              Capture
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};