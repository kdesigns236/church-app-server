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
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaPhoneAlt,
  FaBatteryThreeQuarters,
  FaSignal,
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

export const IconChevronLeft: React.FC<{ className?: string }> = ({ className }) => (
	  <FaChevronLeft className={className} />
);

export const IconChevronRight: React.FC<{ className?: string }> = ({ className }) => (
	  <FaChevronRight className={className} />
);

export const IconMenu: React.FC<{ className?: string }> = ({ className }) => (
	  <FaBars className={className} />
);

export const IconPhone: React.FC<{ className?: string }> = ({ className }) => (
	  <FaPhoneAlt className={className} />
);

export const IconBattery: React.FC<{ className?: string }> = ({ className }) => (
	  <FaBatteryThreeQuarters className={className} />
);

export const IconSignal: React.FC<{ className?: string }> = ({ className }) => (
	  <FaSignal className={className} />
);
