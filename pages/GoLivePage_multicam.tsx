import React, { useState, useRef, useEffect } from 'react';

// Icon components as simple SVGs
const Camera = ({ className }) => <span className={className}>📹</span>;
const Wifi = ({ className }) => <span className={className}>📶</span>;
const Usb = ({ className }) => <span className={className}>🔌</span>;
const Play = ({ className }) => <span className={className}>▶️</span>;
const Square = ({ className }) => <span className={className}>⏹️</span>;
const Monitor = ({ className }) => <span className={className}>🖥️</span>;
const QrCode = ({ className }) => <span className={className}>📱</span>;
const Trash2 = ({ className }) => <span className={className}>🗑️</span>;

export default function GoLivePage() {
  const [cameras, setCameras] = useState([]);
  const [activeCamera, setActiveCamera] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const mainVideoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // USB Camera Detection
  const detectUSBCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const newCameras = await Promise.all(
        videoDevices.map(async (device, index) => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: device.deviceId }
            });
            return {
              id: device.deviceId,
              name: device.label || `USB Camera ${index + 1}`,
              type: 'usb',
              stream: stream,
              status: 'connected'
            };
          } catch (err) {
            console.error('Error accessing camera:', err);
            return null;
          }
        })
      );

      const validCameras = newCameras.filter(cam => cam !== null);
      setCameras(prev => {
        const existing = prev.filter(cam => cam.type !== 'usb');
        return [...existing, ...validCameras];
      });

      if (validCameras.length > 0 && !activeCamera) {
        setActiveCamera(validCameras[0]);
      }
    } catch (err) {
      alert('Error accessing cameras: ' + err.message);
    }
  };

  // QR Code Scanner for Network Cameras
  const startQRScanner = async () => {
    setShowQRScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (qrScannerRef.current) {
        qrScannerRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Cannot access camera for QR scanning: ' + err.message);
      setShowQRScanner(false);
    }
  };

  const stopQRScanner = () => {
    if (qrScannerRef.current && qrScannerRef.current.srcObject) {
      qrScannerRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setShowQRScanner(false);
  };

  // Add Network Camera via QR or Manual Input
  const addNetworkCamera = (url) => {
    if (!url) return;
    
    // Validate URL format
    try {
      new URL(url);
    } catch {
      alert('Invalid URL format');
      return;
    }

    const newCamera = {
      id: `network_${Date.now()}`,
      name: `Network Camera ${cameras.filter(c => c.type === 'network').length + 1}`,
      type: 'network',
      url: url,
      status: 'connected'
    };

    setCameras(prev => [...prev, newCamera]);
    setQrInput('');
    stopQRScanner();
  };

  // Switch Active Camera
  const switchCamera = (camera) => {
    setActiveCamera(camera);
    if (mainVideoRef.current && camera.stream) {
      mainVideoRef.current.srcObject = camera.stream;
    }
  };

  // Remove Camera
  const removeCamera = (cameraId) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera && camera.stream) {
      camera.stream.getTracks().forEach(track => track.stop());
    }
    setCameras(prev => prev.filter(c => c.id !== cameraId));
    if (activeCamera?.id === cameraId) {
      setActiveCamera(null);
    }
  };

  // Recording Controls
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In production, implement actual recording logic here
  };

  // Set main video stream when active camera changes
  useEffect(() => {
    if (mainVideoRef.current && activeCamera?.stream) {
      mainVideoRef.current.srcObject = activeCamera.stream;
    }
  }, [activeCamera]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Monitor className="w-8 h-8" />
            Church Live Camera Switcher
          </h1>
          <div className="flex gap-2">
            <button
              onClick={toggleRecording}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRecording ? 'Stop' : 'Record'}
            </button>
          </div>
        </div>

        {/* Main Preview */}
        <div className="bg-black rounded-lg overflow-hidden mb-6 aspect-video relative">
          {activeCamera ? (
            <>
              {activeCamera.type === 'usb' ? (
                <video
                  ref={mainVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={activeCamera.url}
                  className="w-full h-full"
                  title="Network Camera Feed"
                  allow="camera"
                />
              )}
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 px-3 py-2 rounded">
                <p className="text-sm font-semibold">{activeCamera.name}</p>
                <p className="text-xs text-gray-400">{activeCamera.type.toUpperCase()}</p>
              </div>
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 px-3 py-2 rounded">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-semibold">REC</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No camera selected</p>
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={detectUSBCameras}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <Usb className="w-5 h-5" />
            Detect USB Cameras
          </button>
          <button
            onClick={startQRScanner}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-lg flex items-center justify-center gap-2 font-semibold"
          >
            <QrCode className="w-5 h-5" />
            Add Network Camera (QR)
          </button>
        </div>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Add Network Camera</h2>
              
              <div className="mb-4">
                <video
                  ref={qrScannerRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-black"
                />
                <p className="text-sm text-gray-400 mt-2">
                  Scan QR code containing camera stream URL
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Or enter URL manually:</label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="https://camera-ip:port/stream"
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => addNetworkCamera(qrInput)}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Add Camera
                </button>
                <button
                  onClick={stopQRScanner}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Camera Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Wifi className="w-5 h-5" />
            Connected Cameras ({cameras.length})
          </h2>
          
          {cameras.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No cameras connected</p>
              <p className="text-sm text-gray-500 mt-2">
                Connect USB cameras or add network cameras via QR code
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cameras.map((camera) => (
                <div
                  key={camera.id}
                  className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
                    activeCamera?.id === camera.id ? 'ring-4 ring-blue-500' : 'hover:ring-2 ring-gray-600'
                  }`}
                >
                  <div onClick={() => switchCamera(camera)} className="aspect-video bg-black relative">
                    {camera.type === 'usb' && camera.stream ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        ref={(el) => {
                          if (el) el.srcObject = camera.stream;
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Camera className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    {activeCamera?.id === camera.id && (
                      <div className="absolute top-2 left-2 bg-blue-500 px-2 py-1 rounded text-xs font-bold">
                        LIVE
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{camera.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        {camera.type === 'usb' ? <Usb className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {camera.type.toUpperCase()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCamera(camera.id);
                      }}
                      className="p-2 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3">How to Connect Cameras:</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-white">USB Cameras:</strong>
              <p>Connect cameras via USB and click "Detect USB Cameras" to automatically find them.</p>
            </div>
            <div>
              <strong className="text-white">Network Cameras:</strong>
              <p>Generate a QR code with your camera's stream URL (e.g., http://192.168.1.100:8080/video) 
              and scan it, or enter the URL manually.</p>
            </div>
            <div>
              <strong className="text-white">Switching:</strong>
              <p>Click any camera thumbnail to switch it to the main preview. The active camera is highlighted in blue.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
