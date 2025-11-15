import React, { useRef, useEffect, useState } from 'react';
import { CameraSlot, CameraDevice, TransitionType, MobileConnection } from '../../types';
import { IconQrCode, IconWifi, IconVideo, IconPhone, IconBattery, IconSignal } from '../icons';

const NetworkCameraModal: React.FC<{ 
  slot: CameraSlot | null; 
  onClose: () => void; 
  onConnect: (slotId: number, url: string) => void;
}> = ({ slot, onClose, onConnect }) => {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  if (!slot) return null;

  const handleConnect = async () => {
    if (!url.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    setIsConnecting(true);
    try {
      // For now, we'll just show instructions since direct URL streaming requires more complex setup
      alert(`Network camera URL saved for ${slot.name}. Use OBS or similar software to add this URL as a video source, then select OBS Virtual Camera from the USB camera dropdown.`);
      onClose();
    } catch (error) {
      alert('Failed to connect to network camera');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e1e1e] p-6 rounded-lg shadow-2xl text-white w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">Network Camera - {slot.name}</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Enter the URL of your network camera or streaming source:
        </p>
        
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="rtmp://example.com/stream or http://camera-ip/stream"
          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 mb-4"
        />

        <div className="text-xs text-blue-400 mb-4 p-3 bg-blue-900/20 rounded-lg">
          <p className="font-semibold mb-1">Supported formats:</p>
          <p>• RTMP streams (rtmp://...)</p>
          <p>• HTTP streams (http://...)</p>
          <p>• RTSP streams (rtsp://...)</p>
          <p>• YouTube Live URLs</p>
        </div>

        <div className="text-xs text-yellow-400 mb-4 p-3 bg-yellow-900/20 rounded-lg">
          <p className="font-semibold mb-1">Setup required:</p>
          <p>Use OBS Studio or similar software to add this URL as a "Media Source", then enable "Virtual Camera" to make it available as a USB camera option.</p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConnect}
            disabled={isConnecting || !url.trim()}
            className="flex-1 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Save URL'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QrCodeModal: React.FC<{ slot: CameraSlot | null; onClose: () => void; }> = ({ slot, onClose }) => {
  const [connectionKey] = useState(() => 'church-stream-' + Date.now());
  
  if (!slot) return null;

  // Create connection data for the Android app
  const connectionData = {
    server: window.location.hostname || 'localhost',
    port: '8080', // WebSocket server port
    slot: slot.id.toString(),
    key: connectionKey,
    appName: 'Church of God Evening Light'
  };

  const connectionString = JSON.stringify(connectionData);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(connectionString)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(connectionString).then(() => {
      alert('Connection data copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy connection data. Please copy manually.');
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div 
        className="bg-[#1e1e1e] p-6 md:p-8 rounded-lg shadow-2xl text-white text-center w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="qr-modal-title" className="text-xl md:text-2xl font-bold mb-4">Church Camera App - {slot.name}</h3>
        <p className="text-gray-400 mb-4 text-sm">
          Scan this QR code with the "Church Camera" Android app to connect your phone directly to this streaming system.
        </p>
        <div className="p-4 bg-white rounded-lg inline-block mb-4">
          <img src={qrCodeUrl} alt={`QR Code for ${slot.name}`} width="256" height="256" />
        </div>
        
        <div className="bg-gray-800 p-3 rounded-lg mb-4">
          <p className="text-xs text-gray-400 mb-2">Connection Data:</p>
          <p className="text-xs text-gray-300 break-all font-mono">{connectionString}</p>
          <button 
            onClick={copyToClipboard}
            className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
          >
            Copy Data
          </button>
        </div>

        <div className="text-xs text-green-400 mb-4 p-3 bg-green-900/20 rounded-lg">
          <p className="font-semibold mb-1">📱 Church Camera Android App</p>
          <p>1. Install the "Church Camera" Android app (APK provided)</p>
          <p>2. Open the app and tap "Scan QR Code"</p>
          <p>3. Scan this QR code to connect directly</p>
          <p>4. Your phone will stream HD video to {slot.name}</p>
        </div>

        <div className="text-xs text-blue-400 mb-4 p-3 bg-blue-900/20 rounded-lg">
          <p className="font-semibold mb-1">🔧 Setup Requirements</p>
          <p><strong>Server:</strong> {connectionData.server}:{connectionData.port}</p>
          <p><strong>Slot:</strong> Camera {connectionData.slot}</p>
          <p><strong>Network:</strong> Phone and computer must be on same WiFi</p>
        </div>

        <div className="text-xs text-yellow-400 p-3 bg-yellow-900/20 rounded-lg">
          <p className="font-semibold mb-1">⚠️ Alternative Methods</p>
          <p><strong>For other phones:</strong> Use DroidCam (Android) or EpocCam (iPhone)</p>
          <p><strong>For network cameras:</strong> Click "Network" button above</p>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={onClose}
            className="flex-1 py-2 bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface CameraSlotPreviewProps {
  slot: CameraSlot;
  onDeviceChange: (slotId: number, deviceId: string) => void;
  onSetActive: (slotId: number) => void;
  onShowQr: (slot: CameraSlot) => void;
  onShowNetwork: (slot: CameraSlot) => void;
  onSwitchConnection: (slotId: number, connectionId: string) => void;
  availableDevices: CameraDevice[];
  isActive: boolean;
}

const CameraSlotPreview: React.FC<CameraSlotPreviewProps> = ({ slot, onDeviceChange, onSetActive, onShowQr, onShowNetwork, onSwitchConnection, availableDevices, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (slot.stream) {
      console.log(`Setting stream for ${slot.name}:`, slot.stream);
      video.srcObject = slot.stream;
      video.play().catch(error => {
        console.error(`Error playing video for ${slot.name}:`, error);
      });
    } else {
      console.log(`Clearing stream for ${slot.name}`);
      video.srcObject = null;
    }

    return () => {
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
  }, [slot.stream, slot.name]);

  const borderClass = isActive ? 'border-green-500 shadow-lg shadow-green-500/10' : 'border-gray-600';
  const grayscaleClass = slot.status === 'disconnected' ? 'grayscale' : '';

  return (
    <div className={`p-2 rounded-lg bg-gray-800 border ${borderClass} flex flex-col`}>
      <div className={`relative aspect-video bg-black rounded overflow-hidden mb-2 ${grayscaleClass}`}>
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
        {slot.status === 'disconnected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <IconVideo className="w-8 h-8 text-gray-500" />
            </div>
        )}
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{slot.name}</p>
        <button 
            onClick={() => onSetActive(slot.id)}
            disabled={slot.status === 'disconnected'}
            className="px-2 py-1 text-xs bg-indigo-600 rounded hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
            {isActive ? 'Active' : 'Set Active'}
        </button>
      </div>
      <div className="mt-auto space-y-2">
           <select
              value={slot.device?.id || ''}
              onChange={(e) => onDeviceChange(slot.id, e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5"
            >
              <option value="">- Select USB Camera -</option>
              {availableDevices.map(device => (
                <option key={device.id} value={device.id}>{device.label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
                <button 
                    onClick={() => onShowQr(slot)}
                    className="flex items-center justify-center space-x-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm text-left">
                    <IconQrCode className="w-5 h-5 text-gray-300"/> <span>QR Code</span>
                </button>
                <button 
                    onClick={() => onShowNetwork(slot)}
                    className="flex items-center justify-center space-x-2 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm text-left"
                >
                    <IconWifi className="w-5 h-5 text-gray-300"/> <span>Network</span>
                </button>
            </div>
            
            {/* Mobile Connections List */}
            {slot.mobileConnections.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-400 font-semibold">Mobile Connections ({slot.mobileConnections.length})</p>
                {slot.mobileConnections.map((connection) => (
                  <div 
                    key={connection.id}
                    className={`p-2 rounded bg-gray-800 border text-xs ${
                      connection.id === slot.activeConnectionId 
                        ? 'border-green-500 bg-green-900/20' 
                        : 'border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <IconPhone className="w-3 h-3 text-blue-400" />
                        <span className="text-white font-medium">{connection.deviceName}</span>
                        {connection.id === slot.activeConnectionId && (
                          <span className="text-green-400 text-xs">ACTIVE</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {connection.signalStrength && (
                          <div className="flex items-center space-x-1">
                            <IconSignal className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">{connection.signalStrength}%</span>
                          </div>
                        )}
                        {connection.batteryLevel && (
                          <div className="flex items-center space-x-1">
                            <IconBattery className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-400">{connection.batteryLevel}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        connection.quality === 'HD' ? 'bg-green-900/30 text-green-400' :
                        connection.quality === 'SD' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {connection.quality}
                      </span>
                      <button 
                        onClick={() => onSwitchConnection(slot.id, connection.id)}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors"
                        disabled={connection.id === slot.activeConnectionId}
                      >
                        {connection.id === slot.activeConnectionId ? 'Active' : 'Switch'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
    </div>
  );
};

// Fix: Define the props interface for the CameraControls component.
interface CameraControlsProps {
  cameraSlots: CameraSlot[];
  setCameraSlots: React.Dispatch<React.SetStateAction<CameraSlot[]>>;
  availableDevices: CameraDevice[];
  activeCameraId: number | null;
  setActiveCameraId: (id: number | null) => void;
  transition: TransitionType;
  setTransition: (type: TransitionType) => void;
  connectCameraToSlot: (slotId: number, deviceId: string) => Promise<boolean>;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  cameraSlots,
  setCameraSlots,
  availableDevices,
  activeCameraId,
  setActiveCameraId,
  transition,
  setTransition,
  connectCameraToSlot,
}) => {
  const [qrModalSlot, setQrModalSlot] = useState<CameraSlot | null>(null);
  const [networkModalSlot, setNetworkModalSlot] = useState<CameraSlot | null>(null);

  const handleDeviceChange = async (slotId: number, deviceId: string) => {
    if (!deviceId) {
      // Disconnect camera
      const newSlots = [...cameraSlots];
      const slotIndex = newSlots.findIndex(s => s.id === slotId);
      if (slotIndex !== -1) {
        // Stop previous stream if exists
        if (newSlots[slotIndex].stream) {
          newSlots[slotIndex].stream?.getTracks().forEach(track => track.stop());
        }
        
        newSlots[slotIndex].device = null;
        newSlots[slotIndex].stream = null;
        newSlots[slotIndex].status = 'disconnected';
        
        if (activeCameraId === slotId) {
          setActiveCameraId(null);
        }
        
        setCameraSlots(newSlots);
      }
      return;
    }

    // Connect camera using the shared function
    const success = await connectCameraToSlot(slotId, deviceId);
    if (!success) {
      console.error(`Failed to connect camera to slot ${slotId}`);
    }
  };

  const handleSetActive = (slotId: number) => {
    setActiveCameraId(slotId);
  }

  const handleNetworkConnect = (slotId: number, url: string) => {
    // For now, just save the URL - in a real implementation, this would connect to the network stream
    console.log(`Network camera URL for slot ${slotId}: ${url}`);
  };

  const handleSwitchConnection = (slotId: number, connectionId: string) => {
    const newSlots = [...cameraSlots];
    const slotIndex = newSlots.findIndex(s => s.id === slotId);
    
    if (slotIndex !== -1) {
      const connection = newSlots[slotIndex].mobileConnections.find(c => c.id === connectionId);
      if (connection) {
        // Switch to this connection
        newSlots[slotIndex].activeConnectionId = connectionId;
        newSlots[slotIndex].stream = connection.stream;
        newSlots[slotIndex].status = connection.stream ? 'connected' : 'disconnected';
        
        setCameraSlots(newSlots);
        console.log(`Switched slot ${slotId} to connection ${connectionId} (${connection.deviceName})`);
      }
    }
  };

  return (
    <>
      <QrCodeModal slot={qrModalSlot} onClose={() => setQrModalSlot(null)} />
      <NetworkCameraModal 
        slot={networkModalSlot} 
        onClose={() => setNetworkModalSlot(null)}
        onConnect={handleNetworkConnect}
      />
      <div className="space-y-4 h-full flex flex-col">
        <div className="flex-grow min-h-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-400">Camera Inputs</h4>
            <div className="text-xs text-gray-500">
              {availableDevices.length} device(s) detected
            </div>
          </div>
          
          {availableDevices.length === 0 && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <p className="text-xs text-yellow-300 font-semibold mb-1">📹 No cameras detected</p>
              <p className="text-xs text-yellow-200">
                Connect a USB camera or use the QR Code/Network buttons below to add mobile cameras.
              </p>
            </div>
          )}
          <div className="overflow-y-auto max-h-[30vh] md:max-h-[40vh] pr-2 -mr-2 scroll-container">
            <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
              {cameraSlots.map(slot => (
                <CameraSlotPreview 
                  key={slot.id}
                  slot={slot}
                  onDeviceChange={handleDeviceChange}
                  onSetActive={handleSetActive}
                  onShowQr={setQrModalSlot}
                  onShowNetwork={setNetworkModalSlot}
                  onSwitchConnection={handleSwitchConnection}
                  availableDevices={availableDevices}
                  isActive={slot.id === activeCameraId}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 pt-2 border-t border-gray-700">
          <h4 className="text-sm font-semibold mb-2 text-gray-400">Transitions</h4>
          <div className="flex space-x-2">
            {(['cut', 'fade', 'dissolve'] as TransitionType[]).map(t => (
              <button
                key={t}
                onClick={() => setTransition(t)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex-grow ${
                  transition === t ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CameraControls;
