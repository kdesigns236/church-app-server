import { Sermon, Comment } from '../types';

const sampleComments: Comment[] = [
  { id: 'c1', user: { id: 'user2', name: 'Mary Grace' }, content: 'Such a powerful message, Amen!', timestamp: '2 days ago' },
  { id: 'c2', user: { id: 'user3', name: 'Brother Joseph' }, content: 'This really spoke to me. Thank you Pastor!', timestamp: '1 day ago' },
];

export const mockSermons: Sermon[] = [
  {
    id: '1',
    title: 'Foundations of Faith',
    pastor: 'BISHOP SAMSON SITATI',
    scripture: 'Hebrews 11:1',
    date: '2023-10-22',
    videoUrl: 'https://videos.pexels.com/video-files/4496359/4496359-sd_640_1138_25fps.mp4',
    likes: 125,
    comments: sampleComments,
    isLiked: false,
    isSaved: true,
  },
  {
    id: '2',
    title: 'The Power of Prayer',
    pastor: 'Pastor Jane Smith',
    scripture: 'Philippians 4:6-7',
    date: '2023-10-15',
    videoUrl: 'https://videos.pexels.com/video-files/4785440/4785440-sd_640_1138_30fps.mp4',
    likes: 210,
    comments: [
        ...sampleComments,
        { id: 'c3', user: { id: 'user4', name: 'Sister Faith' }, content: 'I needed to hear this today.', timestamp: '4 hours ago' }
    ],
    isLiked: true,
    isSaved: false,
  },
  {
    id: '3',
    title: 'Living in Grace',
    pastor: 'BISHOP SAMSON SITATI',
    scripture: 'Ephesians 2:8-9',
    date: '2023-10-08',
    videoUrl: 'https://videos.pexels.com/video-files/7578539/7578539-sd_540_960_25fps.mp4',
    likes: 180,
    comments: [],
    isLiked: false,
    isSaved: false,
  },
  {
    id: '4',
    title: 'Community and Fellowship',
    pastor: 'Guest Speaker',
    scripture: 'Acts 2:42',
    date: '2023-10-01',
    videoUrl: 'https://videos.pexels.com/video-files/5845459/5845459-sd_540_960_25fps.mp4',
    likes: 302,
    comments: [
        { id: 'c4', user: { id: 'user1', name: 'Admin' }, content: 'Great sermon from our guest speaker!', timestamp: '5 days ago' }
    ],
    isLiked: true,
    isSaved: true,
  },
];