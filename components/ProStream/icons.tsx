import React from 'react';
import {
  FaVideo,
  FaWifi,
  FaQrcode,
  FaUsb,
  FaChevronDown,
  FaYoutube,
  FaFacebookF,
  FaCircle,
  FaCog,
  FaMicrophone,
  FaMicrophoneSlash,
  FaSyncAlt,
  FaTimes,
} from 'react-icons/fa';


export const IconVideo: React.FC<{ className?: string }> = ({ className }) => (
  <FaVideo className={className} />
);


export const IconWifi: React.FC<{ className?: string }> = ({ className }) => (
  <FaWifi className={className} />
);


export const IconQrCode: React.FC<{ className?: string }> = ({ className }) => (
  <FaQrcode className={className} />
);


export const IconUsb: React.FC<{ className?: string }> = ({ className }) => (
  <FaUsb className={className} />
);


export const IconChevronDown: React.FC<{ className?: string }> = ({ className }) => (
  <FaChevronDown className={className} />
);


export const IconYoutube: React.FC<{ className?: string }> = ({ className }) => (
  <FaYoutube className={className} />
);


export const IconFacebook: React.FC<{ className?: string }> = ({ className }) => (
  <FaFacebookF className={className} />
);


export const IconRecord: React.FC<{ className?: string }> = ({ className }) => (
  <FaCircle className={className} />
);


export const IconSettings: React.FC<{ className?: string }> = ({ className }) => (
  <FaCog className={className} />
);


export const IconMic: React.FC<{ className?: string }> = ({ className }) => (
  <FaMicrophone className={className} />
);


export const IconMicOff: React.FC<{ className?: string }> = ({ className }) => (
  <FaMicrophoneSlash className={className} />
);


export const IconFlipCamera: React.FC<{ className?: string }> = ({ className }) => (
  <FaSyncAlt className={className} />
);


export const IconX: React.FC<{ className?: string }> = ({ className }) => (
  <FaTimes className={className} />
);
