import React, { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Settings, Monitor, Wifi, Video, Mic } from 'lucide-react';
import { useRouter } from 'next/router';

interface CameraSource {
  id: string;
  name: string;
  type: 'local' | 'remote';
  isActive: boolean;
  stream?: MediaStream;
}

interface StreamSettings {
  resolution: string;
  frameRate: number;
  bitrate: number;
  audioQuality: string;
  platforms: Array<{
    name: string;
    isConnected: boolean;
    isEnabled: boolean;
  }>;
}

const StreamSettingsPage: React.FC = () => {
  const router = useRouter();
  const [cameras, setCameras] = useState<CameraSource[]>([]);
  const [activeCamera, setActiveCamera] = useState<CameraSource | null>(null);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    resolution: '1920x1080',
    frameRate: 30,
    bitrate: 2500,
    audioQuality: 'high',
    platforms: [
      { name: 'Facebook', isConnected: false, isEnabled: true },
      { name: 'YouTube', isConnected: false, isEnabled: true }
    ]
  });
  const [devices, setDevices] = useState<{
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
  }>({ videoDevices: [], audioDevices: [] });

  useEffect(() => {
    loadCameras();
    loadDevices();
  }, []);

  const loadCameras = async () => {
    try {
      // Load available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      const cameraList: CameraSource[] = videoDevices.map((device, index) => ({
        id: device.deviceId,
        name: device.label || `Camera ${index + 1}`,
        type: 'local',
        isActive: index === 0
      }));

      setCameras(cameraList);
      if (cameraList.length > 0) {
        setActiveCamera(cameraList[0]);
      }
    } catch (err) {
      console.error('Failed to load cameras:', err);
    }
  };

  const loadDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput');
      
      setDevices({ videoDevices, audioDevices });
    } catch (err) {
      console.error('Failed to load devices:', err);
    }
  };

  const handleCameraSwitch = (cameraId: string) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (camera) {
      setCameras(prev => prev.map(c => ({ ...c, isActive: c.id === cameraId })));
      setActiveCamera(camera);
    }
  };

  const handleStreamSettingChange = (key: keyof StreamSettings, value: any) => {
    setStreamSettings(prev => ({ ...prev, [key]: value }));
  };

  const handlePlatformToggle = (platformName: string) => {
    setStreamSettings(prev => ({
      ...prev,
      platforms: prev.platforms.map(p => 
        p.name === platformName 
          ? { ...p, isEnabled: !p.isEnabled }
          : p
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/golive')}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to GoLive
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Stream Settings
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Camera Sources */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Camera Sources
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Video Devices */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Camera
                  </label>
                  <select
                    value={activeCamera?.id || ''}
                    onChange={(e) => handleCameraSwitch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {devices.videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera List */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Available Cameras
                  </h3>
                  <div className="space-y-2">
                    {cameras.map(camera => (
                      <div
                        key={camera.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          camera.isActive
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        onClick={() => handleCameraSwitch(camera.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Video className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {camera.name}
                            </span>
                          </div>
                          {camera.isActive && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {camera.type === 'local' ? 'Local Camera' : 'Remote Camera'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Audio Management
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                      Automatic Audio Detection
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    System automatically detects and uses the best available microphone. Jack microphones get highest priority, followed by professional USB microphones.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stream Settings */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Stream Quality
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution
                  </label>
                  <select
                    value={streamSettings.resolution}
                    onChange={(e) => handleStreamSettingChange('resolution', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="1920x1080">1080p (1920x1080)</option>
                    <option value="1280x720">720p (1280x720)</option>
                    <option value="854x480">480p (854x480)</option>
                  </select>
                </div>

                {/* Frame Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frame Rate
                  </label>
                  <select
                    value={streamSettings.frameRate}
                    onChange={(e) => handleStreamSettingChange('frameRate', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={60}>60 FPS</option>
                    <option value={30}>30 FPS</option>
                    <option value={24}>24 FPS</option>
                  </select>
                </div>

                {/* Bitrate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bitrate (kbps)
                  </label>
                  <input
                    type="number"
                    value={streamSettings.bitrate}
                    onChange={(e) => handleStreamSettingChange('bitrate', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="500"
                    max="10000"
                    step="100"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Recommended: 2500-4000 kbps for 1080p
                  </p>
                </div>

                {/* Audio Quality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Audio Quality
                  </label>
                  <select
                    value={streamSettings.audioQuality}
                    onChange={(e) => handleStreamSettingChange('audioQuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="high">High (320 kbps)</option>
                    <option value="medium">Medium (192 kbps)</option>
                    <option value="low">Low (128 kbps)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Platform Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Streaming Platforms
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {streamSettings.platforms.map(platform => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        platform.isConnected ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {platform.name}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        platform.isConnected 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {platform.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={platform.isEnabled}
                        onChange={() => handlePlatformToggle(platform.name)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Auto-Connect:</strong> When you click "Go Live", the system automatically connects to all enabled platforms and starts streaming.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Settings */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => router.push('/golive')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Save & Return to GoLive
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreamSettingsPage;
