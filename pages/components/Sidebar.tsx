import React from 'react';
import Accordion from './ui/Accordion';
import CameraControls from './sections/CameraControls';
import StreamControls from './sections/StreamControls';
import Announcements from './sections/Announcements';
import LyricsDisplay from './sections/LyricsDisplay';
import BibleVerses from './sections/BibleVerses';
import LowerThirds from './sections/LowerThirds';
import RecordingControls from './sections/RecordingControls';
import StreamStats from './sections/StreamStats';
import LiveChat from './sections/LiveChat';
import { CameraSlot, CameraDevice, TransitionType, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from '../types';

interface SidebarProps {
  cameraSlots: CameraSlot[];
  setCameraSlots: React.Dispatch<React.SetStateAction<CameraSlot[]>>;
  availableDevices: CameraDevice[];
  activeCameraId: number | null;
  setActiveCameraId: (id: number | null) => void;
  transition: TransitionType;
  setTransition: (type: TransitionType) => void;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  lowerThirdConfig: LowerThirdConfig;
  setLowerThirdConfig: React.Dispatch<React.SetStateAction<LowerThirdConfig>>;
  replayLowerThirdAnimation: () => void;
  announcementConfig: AnnouncementConfig;
  setAnnouncementConfig: React.Dispatch<React.SetStateAction<AnnouncementConfig>>;
  lyricsConfig: LyricsConfig;
  setLyricsConfig: React.Dispatch<React.SetStateAction<LyricsConfig>>;
  bibleVerseConfig: BibleVerseConfig;
  setBibleVerseConfig: React.Dispatch<React.SetStateAction<BibleVerseConfig>>;
  connectCameraToSlot: (slotId: number, deviceId: string) => Promise<boolean>;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className="h-full w-full max-w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-bold truncate">Stream Dashboard</h1>
      </div>
      <div className="flex-grow overflow-y-auto overflow-x-hidden min-h-0 scroll-container">
        <Accordion title="Stream Controls" defaultOpen>
          <StreamControls isLive={props.isLive} setIsLive={props.setIsLive} />
        </Accordion>
        <Accordion title="Camera & Transition" defaultOpen>
          <CameraControls {...props} />
        </Accordion>
        <Accordion title="Lower Thirds">
          <LowerThirds 
            config={props.lowerThirdConfig} 
            setConfig={props.setLowerThirdConfig} 
            replayAnimation={props.replayLowerThirdAnimation}
          />
        </Accordion>
        <Accordion title="Announcements">
          <Announcements 
            config={props.announcementConfig}
            setConfig={props.setAnnouncementConfig}
          />
        </Accordion>
        <Accordion title="Lyrics Display">
          <LyricsDisplay 
            config={props.lyricsConfig}
            setConfig={props.setLyricsConfig}
          />
        </Accordion>
        <Accordion title="Bible Verses">
          <BibleVerses 
            config={props.bibleVerseConfig}
            setConfig={props.setBibleVerseConfig}
          />
        </Accordion>
        <Accordion title="Recording">
          <RecordingControls />
        </Accordion>
        <Accordion title="Stream Statistics">
          <StreamStats />
        </Accordion>
        <Accordion title="Live Chat">
          <LiveChat />
        </Accordion>
      </div>
    </div>
  );
};

export default Sidebar;
