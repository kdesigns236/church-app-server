import React, { useState } from 'react';
import { CameraSlot, CameraDevice, TransitionType } from '../types';
import { IconQrCode, IconWifi, IconUsb } from '../icons';

interface CameraControlsProps {
  sessionId: string;
  cameraSlots: CameraSlot[];
  onDeviceChange: (slotId: number, deviceId: string) => void;
  availableDevices: CameraDevice[];
  activeCameraId: number | null;
  setActiveCameraId: (id: number | null) => void;
  transition: TransitionType;
  setTransition: (type: TransitionType) => void;
  sourceMode: 'local' | 'controller';
  setSourceMode: (mode: 'local' | 'controller') => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({
  sessionId,
  cameraSlots,
  onDeviceChange,
  availableDevices,
  activeCameraId,
  setActiveCameraId,
  transition,
  setTransition,
  sourceMode,
  setSourceMode,
}) => {
  const [qrSlot, setQrSlot] = useState<CameraSlot | null>(null);

  const shortSessionId = (sessionId.split(':')[1] || sessionId).trim();

  const buildQrUrl = (slot: CameraSlot) => {
    const payload = {
      sessionId: shortSessionId,
      slotId: slot.id.toString(),
    };
    const data = JSON.stringify(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data)}`;
  };

  return (
    <>
      {qrSlot && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setQrSlot(null)}
        >
          <div
            className="bg-[#1e1e1e] p-6 rounded-lg shadow-2xl text-white w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">Connect Phone to {qrSlot.name}</h3>
            <p className="text-xs text-gray-400 mb-3">
              Open the Pro Stream Client on your phone, choose <span className="font-semibold">Camera</span>,
              then scan this QR code to link directly to this slot.
            </p>
            <div className="bg-white rounded-lg p-3 flex items-center justify-center mb-4">
              <img
                src={buildQrUrl(qrSlot)}
                alt={`QR for ${qrSlot.name}`}
                className="w-48 h-48"
              />
            </div>
            <p className="text-[10px] text-gray-500 break-all text-center mb-4">
              Session: {shortSessionId} • Slot: {qrSlot.id}
            </p>
            <button
              onClick={() => setQrSlot(null)}
              className="w-full py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
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
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-400">Output Source</h4>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setSourceMode('local')}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                sourceMode === 'local'
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-800 text-gray-200 border-gray-600 hover:border-white/70'
              }`}
            >
              GoLive camera
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('controller')}
              className={`flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                sourceMode === 'controller'
                  ? 'bg-white text-black border-white'
                  : 'bg-gray-800 text-gray-200 border-gray-600 hover:border-white/70'
              }`}
            >
              External cameras
            </button>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-400">Camera Slots</h4>
          <div className="space-y-2">
            {cameraSlots.map(slot => (
              <div key={slot.id} className="p-2 bg-gray-900 rounded-lg">
                <select
                  value={slot.device?.id || ''}
                  onChange={(e) => onDeviceChange(slot.id, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg p-1.5"
                >
                  <option value="">- {slot.name} -</option>
                  {availableDevices.map(device => (
                    <option key={device.id} value={device.id}>{device.label}</option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-gray-400">
                  {slot.status === 'connected' && slot.sourceType === 'remote' && (
                    <span>Phone camera connected</span>
                  )}
                  {slot.status === 'connected' && slot.sourceType === 'local' && slot.device && (
                    <span>Using local device: {slot.device.label}</span>
                  )}
                  {slot.status === 'disconnected' && (
                    <span>No camera connected</span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <button 
                    onClick={() => setActiveCameraId(slot.id)}
                    disabled={slot.status === 'disconnected'}
                    className="flex-1 px-2 py-1 text-xs bg-indigo-600 rounded hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {activeCameraId === slot.id ? 'Active' : 'Set Active'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQrSlot(slot)}
                    className="px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded flex items-center justify-center space-x-1 hover:bg-gray-700 transition-colors"
                  >
                    <IconQrCode className="w-4 h-4 text-gray-300" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CameraControls;
