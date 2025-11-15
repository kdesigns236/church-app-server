import React, { useEffect, useRef, useState } from 'react';
import { IconX } from './icons';
import jsQR from 'jsqr';


interface ScannerProps {
  prompt: string;
  onScan: (data: string) => void;
  onCancel: () => void;
}


const Scanner: React.FC<ScannerProps> = ({ prompt, onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    let stopped = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Could not access camera. Please check permissions.');
      }
    };

    startCamera();

    const scan = () => {
      if (stopped) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        requestAnimationFrame(scan);
        return;
      }

      const context = canvas.getContext('2d');
      if (!context || video.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }

      const width = video.videoWidth || 300;
      const height = video.videoHeight || 300;
      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, width, height);

      if (code && code.data) {
        stopped = true;
        if (video.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        onScan(code.data);
        return;
      }

      requestAnimationFrame(scan);
    };

    requestAnimationFrame(scan);

    return () => {
      stopped = true;
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [onScan]);


  return (
    <div className="flex items-center justify-center h-screen w-screen bg-black text-white p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
        >
          <IconX className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
          <p className="text-gray-400">{prompt}</p>
        </div>

        <div className="relative aspect-square bg-black rounded-lg overflow-hidden mb-6 border-2 border-blue-500">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" width="300" height="300" />
          
          {/* QR Scanner overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-blue-500 rounded-lg"></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-4 text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
        >
          Cancel
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Point your camera at the QR code to scan it automatically
        </p>
      </div>
    </div>
  );
};


export default Scanner;
