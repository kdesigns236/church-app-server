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
import { CameraSlot, CameraDevice, TransitionType, LowerThirdConfig, AnnouncementConfig, LyricsConfig, BibleVerseConfig } from './types';


interface SidebarProps {
  sessionId: string;
  cameraSlots: CameraSlot[];
  onDeviceChange: (slotId: number, deviceId: string) => void;
  availableDevices: CameraDevice[];
  activeCameraId: number | null;
  setActiveCameraId: (id: number | null) => void;
  transition: TransitionType;
  setTransition: (type: TransitionType) => void;
  isLive: boolean;
  setIsLive: (isLive: boolean | ((prev: boolean) => boolean)) => void;
  sourceMode: 'local' | 'controller';
  setSourceMode: (mode: 'local' | 'controller') => void;
  lowerThirdConfig: LowerThirdConfig;
  setLowerThirdConfig: React.Dispatch<React.SetStateAction<LowerThirdConfig>>;
  replayLowerThirdAnimation: () => void;
  announcementConfig: AnnouncementConfig;
  setAnnouncementConfig: React.Dispatch<React.SetStateAction<AnnouncementConfig>>;
  lyricsConfig: LyricsConfig;
  setLyricsConfig: React.Dispatch<React.SetStateAction<LyricsConfig>>;
  bibleVerseConfig: BibleVerseConfig;
  setBibleVerseConfig: React.Dispatch<React.SetStateAction<BibleVerseConfig>>;
}


const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className="p-4 space-y-2">
      <Accordion title="Camera & Transition" defaultOpen>
        <CameraControls 
            sessionId={props.sessionId}
            cameraSlots={props.cameraSlots}
            availableDevices={props.availableDevices}
            activeCameraId={props.activeCameraId}
            setActiveCameraId={props.setActiveCameraId}
            transition={props.transition}
            setTransition={props.setTransition}
            sourceMode={props.sourceMode}
            setSourceMode={props.setSourceMode}
            onDeviceChange={props.onDeviceChange}
        />
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
  );
};


export default Sidebar;
