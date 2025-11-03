
import type { Announcement } from '../types';

export const mockAnnouncements: Announcement[] = [
    { id: 1, title: 'Youth Group Bake Sale', category: 'Events', priority: 'High', content: 'Support our youth mission trip! This Saturday after service.', date: '2023-10-28' },
    { id: 2, title: 'New Sermon Series: "Foundations"', category: 'Worship', priority: 'Medium', content: 'Join us this month as we explore the core beliefs of our faith.', date: '2023-10-25' },
    { id: 3, title: 'Community Food Drive', category: 'Outreach', priority: 'Medium', content: 'We are collecting non-perishable food items in the main lobby until the end of the month.', date: '2023-10-22' },
    { id: 4, title: 'Parking Lot Maintenance', category: 'General', priority: 'Low', content: 'The north parking lot will be closed for repaving next week. Please use the south lot.', date: '2023-10-20' },
];
