import React from 'react';
import { EventsIcon, LocationMarkerIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';
import { Event } from '../types';

const categoryColors: Record<Event['category'], string> = {
    Worship: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Community: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Outreach: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Youth: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const EventCard: React.FC<{ event: Event }> = ({ event }) => {
    const eventDate = new Date(event.date);
    // Add timezone offset to prevent date from showing as previous day
    eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());

    const day = eventDate.toLocaleDateString('en-US', { day: '2-digit' });
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex overflow-hidden">
            <div className="flex flex-col items-center justify-center bg-primary text-white p-4 w-24 flex-shrink-0">
                <span className="text-3xl font-bold">{day}</span>
                <span className="text-md font-semibold">{month}</span>
            </div>
            <div className="p-5 flex flex-col justify-between">
                <div>
                    <span className={`text-xs font-semibold inline-block py-1 px-3 uppercase rounded-full ${categoryColors[event.category]}`}>
                        {event.category}
                    </span>
                    <h3 className="text-xl font-serif font-bold text-primary dark:text-white mt-2 mb-1">{event.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 gap-4">
                        <span>{event.time}</span>
                        <span className="flex items-center gap-1">
                            <LocationMarkerIcon className="w-4 h-4" /> {event.location}
                        </span>
                    </div>
                    <p className="text-text-main dark:text-gray-300 mt-3 text-sm">{event.description}</p>
                </div>
            </div>
        </div>
    );
};

const EventsPage: React.FC = () => {
    const { events } = useAppContext();
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
                <div className="text-center mb-12">
                    <EventsIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
                    <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">Upcoming Events</h1>
                    <p className="mt-2 text-lg text-text-main dark:text-gray-300">
                        Join us for fellowship, worship, and community outreach.
                    </p>
                </div>

                {events.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {sortedEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                ) : (
                     <p className="text-center text-text-main dark:text-gray-400">No upcoming events scheduled. Please check back soon!</p>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
