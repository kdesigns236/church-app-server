import React, { useState, useCallback } from 'react';
// Reuse the already-implemented professional components from the main project
import Connect from '../../components/ProStream/Connect';
import RemoteControl from '../../components/ProStream/RemoteControl';
import CameraClient from '../../components/ProStream/CameraClient';
import Display from '../../components/ProStream/Display';
import Scanner from '../../components/ProStream/Scanner';


type View = 'connect' | 'controller' | 'camera_scan' | 'camera' | 'display';


interface CameraConnectData {
  sessionId: string;
  slotId: string;
}


const App: React.FC = () => {
  const [view, setView] = useState<View>('connect');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraData, setCameraData] = useState<CameraConnectData | null>(null);


  // Check for ?role=display on initial load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'display') {
      const session = params.get('session');
      if (session) {
        setSessionId(`pro-stream-session:${session}`);
        setView('display');
      } else {
        setView('connect');
      }
    }
  }, []);


  const handleSelectRole = (role: 'controller' | 'camera') => {
    if (role === 'controller') {
      const newSessionId = `pro-stream-session:${Math.random().toString(36).substring(2, 9)}`;
      setSessionId(newSessionId);
      setView('controller');
    } else {
      setView('camera_scan');
    }
  };


  const handleCameraScan = (scannedData: string) => {
    try {
      const data = JSON.parse(scannedData);
      if (data.sessionId && data.slotId) {
        setCameraData(data);
        setView('camera');
      } else {
        throw new Error('Missing sessionId or slotId');
      }
    } catch (e) {
      alert('Invalid Camera QR Code. Please scan a code from the Controller dashboard.');
    }
  };


  const handleExit = () => {
    setView('connect');
    setSessionId(null);
    setCameraData(null);
    window.history.pushState({}, document.title, window.location.pathname);
  };


  switch (view) {
    case 'display':
      return <Display sessionId={sessionId!} />;
    case 'controller':
      return <RemoteControl sessionId={sessionId!} onExit={handleExit} />;
    case 'camera_scan':
      return <Scanner 
                prompt="Scan the QR Code from a camera slot in the Controller dashboard."
                onScan={handleCameraScan} 
                onCancel={handleExit} 
             />;
    case 'camera':
      return <CameraClient sessionId={cameraData!.sessionId} slotId={cameraData!.slotId} onExit={handleExit} />;
    case 'connect':
    default:
      return <Connect onSelectRole={handleSelectRole} />;
  }
};


export default App;
