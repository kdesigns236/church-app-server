import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  className?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
  value, 
  size = 200, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQRCode();
  }, [value, size]);

  const generateQRCode = async () => {
    if (!canvasRef.current || !value) return;

    try {
      setIsLoading(true);
      setError(null);

      const canvas = canvasRef.current;
      
      // Generate QR code using the qrcode library
      await QRCode.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setIsLoading(false);
    } catch (err) {
      console.error('[QRCodeGenerator] Error generating QR code:', err);
      setError('Failed to generate QR code');
      setIsLoading(false);
      
      // Fallback: draw error message
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = size;
        canvas.height = size;
        
        // Clear canvas
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, size, size);
        
        // Draw error message
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('QR Code Error', size / 2, size / 2 - 10);
        
        ctx.font = '10px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Check URL format', size / 2, size / 2 + 10);
      }
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded-lg bg-white"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 bg-opacity-90 rounded-lg">
            <div className="text-center">
              <div className="text-red-600 text-sm font-medium">QR Error</div>
              <div className="text-red-500 text-xs">Invalid URL</div>
            </div>
          </div>
        )}
      </div>
      
      {/* URL display below QR code */}
      {value && !error && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 break-all">
            {value.length > 40 ? `${value.substring(0, 40)}...` : value}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
