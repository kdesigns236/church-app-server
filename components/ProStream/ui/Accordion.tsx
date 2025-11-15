import React, { useState } from 'react';
import { IconChevronDown } from '../icons';


interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}


const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);


  return (
    <div className="border-b border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-800/50 transition-colors duration-200"
      >
        <h3 className="font-semibold text-gray-200">{title}</h3>
        <IconChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 bg-black/20">
          {children}
        </div>
      </div>
    </div>
  );
};


export default Accordion;
