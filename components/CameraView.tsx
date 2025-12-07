import React, { useRef, useEffect, useState } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1080 },
            height: { ideal: 1920 }
          },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    if (isActive && !stream) {
      startCamera();
    } 

    return () => {
      // Cleanup stream when component unmounts or becomes inactive
      if (!isActive && stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    };
  }, [isActive, stream]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match video dimension
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert to base64 jpeg
        const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-3xl shadow-2xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-50'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Hand Reference Guide Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
         <div className="border-2 border-dashed border-white w-64 h-64 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-mono uppercase tracking-widest text-center">
              Place Food & Hand<br/>Within Frame
            </span>
         </div>
      </div>

      {isActive && (
        <button
          onClick={handleCapture}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform flex items-center justify-center z-20"
          aria-label="Capture Photo"
        >
          <div className="w-16 h-16 bg-white border-2 border-black rounded-full" />
        </button>
      )}
    </div>
  );
};

export default CameraView;
