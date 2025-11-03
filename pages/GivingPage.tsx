import React, { useState } from 'react';
import { GivingIcon, CopyIcon, CheckIcon } from '../constants/icons';

type Tab = 'offering' | 'donation';

const GivingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('offering');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(identifier);
      setTimeout(() => setCopiedItem(null), 2000);
    });
  };
  
  const mpesaNumber = '0710252081';
  const paybillNumber = '400200';
  const accountNumber = '38447';

  const renderContent = (type: 'offering' | 'donation') => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-secondary">
        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">M-Pesa (Send Money)</h3>
        <p className="text-text-main dark:text-gray-300 mb-2">Follow these steps to give via M-Pesa:</p>
        <ol className="list-decimal list-inside text-text-main dark:text-gray-300 space-y-2 mb-4">
          <li>Go to your M-Pesa menu.</li>
          <li>Select "Send Money".</li>
          <li>Enter the church's phone number:</li>
          <div className="flex items-center gap-4 my-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <span className="font-mono text-lg font-bold text-primary dark:text-secondary">{mpesaNumber}</span>
            <button 
              onClick={() => handleCopy(mpesaNumber, 'mpesa')}
              className="flex items-center gap-1 text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {copiedItem === 'mpesa' ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4" />}
              {copiedItem === 'mpesa' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <li>Enter the amount you wish to give.</li>
          <li>Enter your M-Pesa PIN and confirm.</li>
        </ol>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-blue-500">
        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Paybill</h3>
        <p className="text-text-main dark:text-gray-300 mb-2">Follow these steps to give via Paybill:</p>
        <ol className="list-decimal list-inside text-text-main dark:text-gray-300 space-y-2 mb-4">
          <li>Go to your M-Pesa menu.</li>
          <li>Select "Lipa na M-Pesa".</li>
          <li>Select "Pay Bill".</li>
          <li>Enter Business Number:</li>
          <div className="flex items-center gap-4 my-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <span className="font-mono text-lg font-bold text-primary dark:text-secondary">{paybillNumber}</span>
            <button 
              onClick={() => handleCopy(paybillNumber, 'paybill')}
              className="flex items-center gap-1 text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {copiedItem === 'paybill' ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4" />}
              {copiedItem === 'paybill' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <li>Enter Account Number:</li>
          <div className="flex items-center gap-4 my-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
            <span className="font-mono text-lg font-bold text-primary dark:text-secondary">{accountNumber}</span>
            <button
               onClick={() => handleCopy(accountNumber, 'account')}
               className="flex items-center gap-1 text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
               {copiedItem === 'account' ? <CheckIcon className="w-4 h-4 text-green-500"/> : <CopyIcon className="w-4 h-4" />}
               {copiedItem === 'account' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <li>Enter the amount you wish to give.</li>
          <li>Enter your M-Pesa PIN and confirm.</li>
        </ol>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow">
      <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-5rem)]">
        <div className="text-center mb-12">
            <GivingIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
            <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">Give Generously</h1>
            <p className="mt-2 text-lg text-text-main dark:text-gray-300 max-w-2xl mx-auto">
              "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." - 2 Corinthians 9:7
            </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Tabs */}
          <div className="mb-8 flex justify-center border-b border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setActiveTab('offering')}
              className={`px-6 py-3 text-lg font-semibold transition-colors ${
                activeTab === 'offering'
                  ? 'border-b-2 border-secondary text-primary dark:text-secondary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              Offering
            </button>
            <button
              onClick={() => setActiveTab('donation')}
              className={`px-6 py-3 text-lg font-semibold transition-colors ${
                activeTab === 'donation'
                  ? 'border-b-2 border-secondary text-primary dark:text-secondary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white'
              }`}
            >
              Donation
            </button>
          </div>
          
          {activeTab === 'offering' && renderContent('offering')}
          {activeTab === 'donation' && renderContent('donation')}

        </div>
      </div>
    </div>
  );
};

export default GivingPage;
