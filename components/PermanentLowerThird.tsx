import React, { useState, useEffect } from 'react';

interface PermanentLowerThirdProps {
  churchName?: string;
  customText?: string;
  logoUrl?: string;
  isVisible?: boolean;
  onEdit?: () => void;
}

const PermanentLowerThird: React.FC<PermanentLowerThirdProps> = ({
  churchName = "CHURCH OF GOD EVENING LIGHT",
  customText = "",
  logoUrl = "/church-logo.png",
  isVisible = true,
  onEdit
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempChurchName, setTempChurchName] = useState(churchName);
  const [tempCustomText, setTempCustomText] = useState(customText);
  const [showEditButton, setShowEditButton] = useState(false);

  if (!isVisible) return null;

  const handleSave = () => {
    setIsEditing(false);
    if (onEdit) {
      onEdit();
    }
  };

  return (
    <>
      {/* Permanent Lower Third Overlay */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        onMouseEnter={() => setShowEditButton(true)}
        onMouseLeave={() => setShowEditButton(false)}
      >
        {/* Main Lower Third Graphics */}
        <div className="relative">
          {/* Red Banner with 3D Effect */}
          <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-red-600 h-16 flex items-center shadow-2xl">
            {/* 3D Left Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-red-800 to-red-600 transform -skew-x-12 shadow-lg"></div>
            
            {/* Church Logo */}
            <div className="relative z-10 ml-12 mr-4 flex-shrink-0">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Church Logo" 
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to default icon if logo fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-400 font-bold text-lg">COGEL</span>
                  </div>
                )}
              </div>
            </div>

            {/* Church Name */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={tempChurchName}
                  onChange={(e) => setTempChurchName(e.target.value)}
                  className="bg-white/20 text-white font-bold text-xl px-2 py-1 rounded border-none outline-none w-full"
                  placeholder="Church Name"
                />
              ) : (
                <h1 className="text-white font-bold text-xl tracking-wide drop-shadow-lg">
                  {churchName}
                </h1>
              )}
            </div>

            {/* 3D Right Edge */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-red-800 to-red-600 transform skew-x-12 shadow-lg"></div>
          </div>

          {/* White/Gray Banner for Custom Text */}
          {(customText || isEditing) && (
            <div className="relative bg-gradient-to-r from-gray-100 via-white to-gray-100 h-10 flex items-center shadow-lg border-t border-gray-200">
              {/* 3D Left Edge */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-300 to-gray-100 transform -skew-x-12"></div>
              
              {/* Custom Text */}
              <div className="flex-1 ml-8 mr-8">
                {isEditing ? (
                  <input
                    type="text"
                    value={tempCustomText}
                    onChange={(e) => setTempCustomText(e.target.value)}
                    className="bg-gray-200 text-gray-800 font-semibold text-lg px-2 py-1 rounded border-none outline-none w-full"
                    placeholder="Custom message or verse..."
                  />
                ) : (
                  <p className="text-gray-800 font-semibold text-lg text-center drop-shadow-sm">
                    {customText}
                  </p>
                )}
              </div>

              {/* 3D Right Edge */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-300 to-gray-100 transform skew-x-12"></div>
            </div>
          )}

          {/* Alpha Channel Transparency Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none"></div>
        </div>

        {/* Edit Button (appears on hover) */}
        {showEditButton && (
          <div className="absolute top-2 right-4 pointer-events-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors shadow-lg"
                >
                  ✓ Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTempChurchName(churchName);
                    setTempCustomText(customText);
                  }}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors shadow-lg"
                >
                  ✕ Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors shadow-lg"
              >
                ✏️ Edit
              </button>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal for Advanced Options */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🎬 Lower Third Editor
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Church Name
                </label>
                <input
                  type="text"
                  value={tempChurchName}
                  onChange={(e) => setTempChurchName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter church name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Message
                </label>
                <input
                  type="text"
                  value={tempCustomText}
                  onChange={(e) => setTempCustomText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Bible verse, announcement, etc."
                />
              </div>

              {/* Quick Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Templates:
                </label>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    "Sunday Worship Service",
                    "Bible Study & Prayer",
                    "Youth Service",
                    "Special Service",
                    "Live Worship"
                  ].map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setTempCustomText(template)}
                      className="text-left p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {template}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</h4>
                <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-3 rounded">
                  <div className="font-bold text-lg">{tempChurchName}</div>
                  {tempCustomText && (
                    <div className="text-sm bg-white/20 p-1 rounded mt-1">
                      {tempCustomText}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setTempChurchName(churchName);
                  setTempCustomText(customText);
                }}
                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PermanentLowerThird;
