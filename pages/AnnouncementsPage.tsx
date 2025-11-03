
import React from 'react';
import { AnnouncementsIcon } from '../constants/icons';
import { Announcement, Priority } from '../types';
import { useAppContext } from '../context/AppContext';

const priorityStyles: Record<Priority, string> = {
    High: 'border-red-500',
    Medium: 'border-yellow-500',
    Low: 'border-blue-500',
};

const AnnouncementCard: React.FC<{ announcement: Announcement }> = ({ announcement }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border-l-4 ${priorityStyles[announcement.priority]}`}>
        <div className="p-6">
            <div className="flex justify-between items-start">
                <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-secondary bg-secondary/20">
                        {announcement.category}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-primary dark:text-white mt-2">{announcement.title}</h3>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(announcement.date).toLocaleDateString()}</span>
            </div>
            <p className="text-text-main dark:text-gray-300 mt-4">{announcement.content}</p>
        </div>
    </div>
);


const AnnouncementsPage: React.FC = () => {
  const { announcements } = useAppContext();
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
            <div className="text-center mb-12">
                <AnnouncementsIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
                <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">Announcements</h1>
                <p className="mt-2 text-lg text-text-main dark:text-gray-300">
                    Stay up-to-date with the latest news and updates from our church.
                </p>
            </div>

            <div className="space-y-6 max-w-4xl mx-auto">
                {announcements.map(announcement => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
            </div>
        </div>
    </div>
  );
};

export default AnnouncementsPage;
