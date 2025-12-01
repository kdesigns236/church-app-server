import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import { FiX, FiImage, FiVideo, FiSmile } from 'react-icons/fi';

const CreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const { createPost } = useAppContext();
  const navigate = useNavigate();
  const [postContent, setPostContent] = useState('');

  const currentUserName = user?.name || 'User';
  const currentUserAvatar =
    (user?.name && user.name.trim().charAt(0).toUpperCase()) || 'U';

  const handlePost = () => {
    if (!user) return;
    if (postContent.trim()) {
      createPost(postContent, user);
      navigate('/chat');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0,
            }}
          >
            Create Post
          </h1>
          <button
            onClick={() => navigate('/chat')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <FiX size={24} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '16px auto', padding: '0 16px' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
                flexShrink: 0,
              }}
            >
              {currentUserAvatar}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '15px',
                }}
              >
                {currentUserName}
              </h3>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: '#6b7280',
                  backgroundColor: '#e5e7eb',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                Public
              </p>
            </div>
          </div>

          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUserName.split(' ')[0]}?`}
            style={{
              width: '100%',
              minHeight: '150px',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '18px',
              fontFamily: 'inherit',
              margin: '16px 0',
              padding: '0',
            }}
          />

          <div
            style={{
              borderTop: '1px solid #e5e7eb',
              padding: '12px 0 0',
              display: 'flex',
              justifyContent: 'space-around',
            }}
          >
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiVideo size={18} />
              <span>Video</span>
            </button>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#22c55e',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiImage size={18} />
              <span>Photo/Video</span>
            </button>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#f97316',
                cursor: 'pointer',
                padding: '6px 0',
                fontWeight: 500,
              }}
            >
              <FiSmile size={18} />
              <span>Feeling/Activity</span>
            </button>
          </div>

          <button
            onClick={handlePost}
            disabled={!postContent.trim()}
            style={{
              width: '100%',
              backgroundColor: postContent.trim() ? '#1877f2' : '#d1d5db',
              color: 'white',
              padding: '10px 0',
              borderRadius: '8px',
              border: 'none',
              cursor: postContent.trim() ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '15px',
              marginTop: '16px',
            }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
