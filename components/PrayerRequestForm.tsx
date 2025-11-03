
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export const PrayerRequestForm: React.FC = () => {
  const { addPrayerRequest } = useAppContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [request, setRequest] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) {
      setError('Prayer request cannot be empty.');
      return;
    }
    setError('');
    addPrayerRequest({ name, email, request });
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-green-100 dark:bg-green-900/50 rounded-lg animate-fade-in">
        <h3 className="text-2xl font-serif text-success dark:text-green-300">Thank You!</h3>
        <p className="mt-2 text-text-main dark:text-accent">Your prayer request has been received. Our prayer team will be lifting you up. "The prayer of a righteous person is powerful and effective." - James 5:16</p>
        <button 
          onClick={() => {
            setIsSubmitted(false);
            setName('');
            setEmail('');
            setRequest('');
          }}
          className="mt-4 px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-navy-light transition-colors"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-main dark:text-gray-300">Name (Optional)</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-text-main dark:text-gray-300">Email (Optional, for follow-up)</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
        />
      </div>
      <div>
        <label htmlFor="request" className="block text-sm font-medium text-text-main dark:text-gray-300">Prayer Request</label>
        <textarea
          id="request"
          rows={4}
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-secondary focus:border-secondary"
          required
        />
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary bg-secondary hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors"
        >
          Submit Prayer Request
        </button>
      </div>
    </form>
  );
};
