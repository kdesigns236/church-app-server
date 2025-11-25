
export enum MessageAuthor {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface AssistantMessage {
  author: MessageAuthor;
  content: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  senderName: string;
  content?: string; // Made optional for media-only messages
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
  };
  timestamp: string;
  replyTo?: ChatMessage;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  profilePictureUrl?: string;
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface Announcement {
    id: number;
    title: string;
    category: string;
    priority: Priority;
    content: string;
    date: string;
}

export interface SermonComment {
    id: string;
    user: {
        id: string;
        name: string;
        profilePictureUrl?: string;
    };
    content: string;
    timestamp: string;
}

export interface Sermon {
  id: string;
  title: string;
  pastor: string;
  scripture: string;
  date: string;
  videoUrl?: string | File | null; // Cloud URL, IndexedDB identifier, or File object
  videoPublicId?: string; // Cloudinary public ID for deletion
  likes: number;
  comments: SermonComment[];
  isLiked: boolean;
  isSaved: boolean;
  fullSermonUrl?: string;
  order?: number;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: 'Worship' | 'Community' | 'Outreach' | 'Youth';
}

export interface SiteContent {
    verseOfTheWeek: {
        text: string;
        citation: string;
    };
    contactInfo: {
        email: string;
        phone1: string;
        phone2: string;
        addressLine1: string;
        addressLine2: string;
    };
    socialLinks: {
        facebook: string;
        youtube: string;
        tiktok: string;
    }
}

export interface PrayerRequest {
  id: string;
  name: string;
  email: string;
  request: string;
  date: string;
  isPrayedFor: boolean;
}

export interface BibleStudy {
  id: string;
  title: string;
  topic: string;
  scripture: string;
  description: string;
  questions: string[];
  date: string;
  imageUrl?: string;
}