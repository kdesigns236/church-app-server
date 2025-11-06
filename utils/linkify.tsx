// Utility to convert URLs in text to clickable links
import React from 'react';

/**
 * Converts plain text URLs to clickable links
 * Supports http://, https://, and www. URLs
 */
export const linkify = (text: string): React.ReactNode[] => {
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the clickable URL
    let url = match[0];
    let displayUrl = url;
    
    // Add https:// if URL starts with www.
    if (url.startsWith('www.')) {
      url = 'https://' + url;
    }

    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-secondary hover:text-gold underline font-semibold break-all"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {displayUrl}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};

/**
 * Preserves line breaks and converts URLs to links
 */
export const linkifyWithLineBreaks = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => (
    <React.Fragment key={lineIndex}>
      {linkify(line)}
      {lineIndex < lines.length - 1 && <br />}
    </React.Fragment>
  ));
};
