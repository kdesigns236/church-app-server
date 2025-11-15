export interface CameraDevice {
  id: string;
  label: string;
}


export interface CameraSlot {
  id: number;
  name: string;
  device: CameraDevice | null;
  stream: MediaStream | null;
  status: 'disconnected' | 'connected' | 'active';
  sourceType: 'local' | 'remote' | null;
}


export type TransitionType = 'cut' | 'fade' | 'dissolve';


export interface LowerThirdConfig {
  isVisible: boolean;
  topText: string;
  mainText: string;
  logoIcon: string;
  accentColor: string;
  mainBarColor: string;
  scale?: number;
}


export type GraphicAnimationStyle = 'fade' | 'slideUp' | 'slideDown' | 'scroll';
export type GraphicPosition = 'top' | 'middle' | 'bottom';


export interface AnnouncementConfig {
  isVisible: boolean;
  text: string;
  fontSize: string;
  fontFamily: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  backgroundOpacity: number;
  animationStyle: GraphicAnimationStyle;
  position: GraphicPosition;
  scale?: number;
}


export interface Song {
    title: string;
    verses: string[];
}


export interface LyricsConfig {
    isVisible: boolean;
    song: Song | null;
    verseIndex: number;
    fontSize: string;
    fontFamily: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor: string;
    backgroundOpacity: number;
    animationStyle: GraphicAnimationStyle;
    position: GraphicPosition;
    scale?: number;
}


export interface BibleVerseConfig {
    isVisible: boolean;
    text: string;
    reference: string;
    fontSize: string;
    fontFamily: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
    backgroundColor: string;
    backgroundOpacity: number;
    animationStyle: GraphicAnimationStyle;
    position: GraphicPosition;
    scale?: number;
}
