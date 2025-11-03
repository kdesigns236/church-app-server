import { Event } from '../types';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Sunday Worship Service',
    date: '2023-11-05',
    time: '10:00 AM',
    location: 'Main Sanctuary',
    description: 'Join us for our weekly worship service. All are welcome to attend and experience fellowship and teaching.',
    category: 'Worship',
  },
  {
    id: '2',
    title: 'Youth Group Hangout',
    date: '2023-11-10',
    time: '7:00 PM',
    location: 'Youth Hall',
    description: 'A fun evening for our youth with games, snacks, and a short devotional. For ages 13-18.',
    category: 'Youth',
  },
  {
    id: '3',
    title: 'Community Food Pantry',
    date: '2023-11-18',
    time: '9:00 AM - 12:00 PM',
    location: 'Church Parking Lot',
    description: 'We are distributing food to families in need. Volunteers are welcome to help with setup and distribution.',
    category: 'Outreach',
  },
  {
    id: '4',
    title: 'All-Church Potluck',
    date: '2023-11-26',
    time: '12:00 PM',
    location: 'Fellowship Hall',
    description: 'Bring a dish to share and enjoy a meal together after the service. A great time to connect with others.',
    category: 'Community',
  }
];
