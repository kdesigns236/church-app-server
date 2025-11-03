import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { BibleStudy } from '../types';
import { BibleIcon, EventsIcon } from '../constants/icons';

const BibleStudyCard: React.FC<{ study: BibleStudy }> = ({ study }) => {
  const [showAnswers, setShowAnswers] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-slide-in-up">
      {study.imageUrl && (
        <img 
          src={study.imageUrl} 
          alt={study.title}
          className="w-full h-40 sm:h-48 object-cover"
        />
      )}
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
          <EventsIcon className="w-4 h-4" />
          <span>{new Date(study.date).toLocaleDateString()}</span>
        </div>
        
        <h3 className="text-2xl font-serif font-bold text-primary dark:text-secondary mb-2">
          {study.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-3">
          <BibleIcon className="w-5 h-5 text-secondary" />
          <p className="text-lg font-semibold text-secondary">{study.scripture}</p>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 italic">
          Topic: {study.topic}
        </p>
        
        <p className="text-text-main dark:text-gray-300 mb-6 leading-relaxed">
          {study.description}
        </p>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-lg font-bold text-primary dark:text-white mb-3">
            Discussion Questions:
          </h4>
          <ul className="space-y-3">
            {study.questions.map((question, index) => (
              <li 
                key={index}
                className="flex items-start gap-3 text-text-main dark:text-gray-300"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-secondary text-primary rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <span className="flex-1">{question}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="mt-6 w-full bg-secondary text-primary font-bold py-3 px-6 rounded-md hover:bg-gold-light transition-colors"
        >
          {showAnswers ? 'Hide' : 'Show'} Study Notes
        </button>
        
        {showAnswers && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md animate-fade-in">
            <p className="text-sm text-gray-600 dark:text-gray-300 italic">
              💡 Reflect on these questions in your personal study time or discuss them with your small group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const BibleStudyPage: React.FC = () => {
  const { bibleStudies } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudies = bibleStudies.filter(study =>
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.scripture.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 min-h-screen animate-fade-in">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <BibleIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-4">
            Bible Study
          </h1>
          <p className="text-lg text-text-main dark:text-gray-300 max-w-2xl mx-auto">
            Deepen your understanding of God's Word through guided study topics and discussion questions.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <input
            type="text"
            placeholder="Search by title, topic, or scripture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
        </div>

        {/* Bible Studies Grid */}
        {filteredStudies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStudies.map((study) => (
              <BibleStudyCard key={study.id} study={study} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BibleIcon className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">
              {searchTerm ? 'No studies found' : 'No Bible studies yet'}
            </h3>
            <p className="text-gray-400 dark:text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Check back soon for new study materials'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BibleStudyPage;
