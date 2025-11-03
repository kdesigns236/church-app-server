import React from 'react';
import { BroadcastIcon, ExternalLinkIcon } from '../constants/icons';

const resources = [
  {
    name: 'Restream',
    description: 'Easily broadcast live to multiple social media platforms at once from your browser. Great for beginners.',
    link: 'https://restream.io/',
  },
  {
    name: 'StreamYard',
    description: 'A browser-based live streaming studio. Perfect for interviews, talk shows, and professional-looking broadcasts.',
    link: 'https://streamyard.com/',
  },
  {
    name: 'OBS Studio',
    description: 'A powerful, free, and open-source software for video recording and live streaming. Highly customizable for advanced users.',
    link: 'https://obsproject.com/',
  },
];

const ResourceCard: React.FC<{ name: string; description: string; link: string; }> = ({ name, description, link }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col animate-slide-in-up">
        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-3">{name}</h3>
        <p className="text-text-main dark:text-gray-300 flex-grow mb-6">{description}</p>
        <a 
            href={link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-2 bg-secondary text-primary font-bold py-2 px-4 rounded-md hover:bg-gold-light transition-colors"
        >
            Visit Website <ExternalLinkIcon className="w-4 h-4" />
        </a>
    </div>
);

const GoLivePage: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-10rem)]">
        <div className="text-center mb-12">
          <BroadcastIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
          <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">Go Live & Reach the World</h1>
          <p className="mt-2 text-lg text-text-main dark:text-gray-300 max-w-3xl mx-auto">
            Spread the message by broadcasting your services live to multiple platforms simultaneously. Here are some free and popular tools to get you started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {resources.map(resource => (
            <ResourceCard key={resource.name} {...resource} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GoLivePage;