import React, { useState, useEffect } from 'react';
import { ArrowLeft, Palette, Type, Image, Settings } from 'lucide-react';
import { useRouter } from 'next/router';

interface LowerThirdSettings {
  churchName: string;
  lowerThirdText: string;
  logoIcon: string;
  redBarColor: string;
  whiteBarColor: string;
  showPermanentLowerThird: boolean;
}

const GraphicsEditorPage: React.FC = () => {
  const router = useRouter();
  const [settings, setSettings] = useState<LowerThirdSettings>({
    churchName: 'CHURCH OF GOD EVENING LIGHT',
    lowerThirdText: '',
    logoIcon: '',
    redBarColor: '#6b46c1',
    whiteBarColor: '#f8f9fa',
    showPermanentLowerThird: true
  });

  const adjustColor = (color: string, amount: number): string => {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  };

  const handleSettingChange = (key: keyof LowerThirdSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Save settings to localStorage or API
    localStorage.setItem('lowerThirdSettings', JSON.stringify(settings));
    alert('Graphics settings saved successfully!');
  };

  useEffect(() => {
    // Load existing settings
    const saved = localStorage.getItem('lowerThirdSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

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
                Graphics Editor
              </h1>
            </div>
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Live Preview */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Image className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Live Preview
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                {/* Preview Container */}
                <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  {/* Simulated Video Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white/30 text-6xl">📹</div>
                  </div>
                  
                  {/* Lower Third Preview */}
                  {settings.showPermanentLowerThird && (
                    <div className="absolute bottom-0 left-0 right-0 z-10">
                      <div className="relative w-full h-20">
                        
                        {/* Large Purple Church Name Bar (Top) */}
                        <div 
                          className="absolute top-0 left-0 w-full h-12 z-30"
                          style={{
                            background: `linear-gradient(135deg, ${settings.redBarColor} 0%, ${adjustColor(settings.redBarColor, -20)} 100%)`,
                            clipPath: 'polygon(0 0, calc(100% - 40px) 0, 100% 100%, 0 100%)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
                          }}
                        >
                          <div className="flex items-center h-full px-6">
                            <span className="text-white font-bold text-lg tracking-wider drop-shadow-lg">
                              {settings.churchName}
                            </span>
                          </div>
                        </div>

                        {/* Small White Details Bar (Bottom) */}
                        <div 
                          className="absolute top-12 left-0 w-full h-6 z-20"
                          style={{
                            background: `linear-gradient(135deg, ${settings.whiteBarColor} 0%, ${adjustColor(settings.whiteBarColor, -10)} 100%)`,
                            clipPath: 'polygon(0 0, calc(100% - 30px) 0, 100% 100%, 0 100%)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
                          }}
                        >
                          <div className="flex items-center h-full px-4">
                            <span className="text-gray-800 font-medium text-xs tracking-wide">
                              {settings.lowerThirdText || settings.churchName}
                            </span>
                          </div>
                        </div>

                        {/* Left Tab with Logo */}
                        <div 
                          className="absolute top-12 left-0 w-12 h-6 z-30"
                          style={{
                            background: `linear-gradient(135deg, ${adjustColor(settings.redBarColor, -30)} 0%, ${adjustColor(settings.redBarColor, -50)} 100%)`,
                            clipPath: 'polygon(0 0, 80% 0, 100% 100%, 0 100%)',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                          }}
                        >
                          <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                              <img 
                                src="/logo.jpg" 
                                alt="Church Logo" 
                                className="w-6 h-6 rounded-full object-contain p-1"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <span 
                                className="text-purple-600 font-bold text-sm hidden items-center justify-center w-full h-full"
                                style={{ color: settings.redBarColor }}
                              >
                                {settings.logoIcon}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Editor Controls */}
          <div className="space-y-6">
            
            {/* Text Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Type className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Text Settings
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Church Name (Large Bar)
                  </label>
                  <input
                    type="text"
                    value={settings.churchName}
                    onChange={(e) => handleSettingChange('churchName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter church name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lower Third Text (Small Bar)
                  </label>
                  <input
                    type="text"
                    value={settings.lowerThirdText}
                    onChange={(e) => handleSettingChange('lowerThirdText', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter passing details (optional)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty to show church name in both bars
                  </p>
                </div>
              </div>
            </div>

            {/* Color Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Color Settings
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Top Bar Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.redBarColor}
                      onChange={(e) => handleSettingChange('redBarColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.redBarColor}
                      onChange={(e) => handleSettingChange('redBarColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bottom Bar Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.whiteBarColor}
                      onChange={(e) => handleSettingChange('whiteBarColor', e.target.value)}
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.whiteBarColor}
                      onChange={(e) => handleSettingChange('whiteBarColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Logo Settings
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fallback Icon
                  </label>
                  <input
                    type="text"
                    value={settings.logoIcon}
                    onChange={(e) => handleSettingChange('logoIcon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg"
                    placeholder="Logo icon (optional)"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Shown if logo image fails to load
                  </p>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Logo Image:</strong> The system automatically uses `/logo.jpg` as the church logo. Place your logo file in the public folder with this name.
                  </p>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Display Settings
                  </h2>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Lower Third
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Display the lower third overlay on stream
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showPermanentLowerThird}
                      onChange={(e) => handleSettingChange('showPermanentLowerThird', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveSettings}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
          >
            Save Graphics Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphicsEditorPage;
