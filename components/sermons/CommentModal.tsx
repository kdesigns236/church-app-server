
import React, { useState } from 'react';
import { Sermon } from '../../types';
import { CloseIcon, SendIcon } from '../../constants/icons';
import { useAuth } from '../../hooks/useAuth';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sermon: Sermon | null;
  onAddComment: (sermonId: string, content: string) => void;
}

export const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, sermon, onAddComment }) => {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  if (!isOpen || !sermon) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    onAddComment(sermon.id, newComment);
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-accent dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg h-[90vh] max-h-[700px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-serif font-bold text-primary dark:text-white">Comments ({sermon.comments.length})</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <CloseIcon className="w-6 h-6 text-text-main dark:text-gray-300" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {sermon.comments.length > 0 ? (
            sermon.comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-3">
                {comment.user.profilePictureUrl ? (
                   <img src={comment.user.profilePictureUrl} alt={comment.user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                ) : (
                    <span className="w-10 h-10 rounded-full bg-primary text-secondary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {comment.user.name.charAt(0).toUpperCase()}
                    </span>
                )}
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg w-full">
                  <div className="flex items-baseline justify-between">
                    <p className="font-bold text-primary dark:text-secondary">{comment.user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{comment.timestamp}</p>
                  </div>
                  <p className="text-text-main dark:text-gray-200 mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">Be the first to comment!</p>
          )}
        </div>

        {user && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="p-3 rounded-full bg-secondary text-primary hover:bg-gold-light disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <SendIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};