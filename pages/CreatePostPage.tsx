import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useAppContext } from '../context/AppContext';
import { websocketService } from '../services/websocketService';
import { FiX, FiImage, FiVideo, FiSmile } from 'react-icons/fi';
import { uploadService } from '../services/uploadService';
import { uploadMediaToFirebase } from '../services/firebaseUploadService';

const CreatePostPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { createPost, updatePost, posts } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isStoryMode = searchParams.get('mode') === 'story';
  const editIdStr = searchParams.get('edit');
  const editPostId = editIdStr ? parseInt(editIdStr, 10) : null;
  const isEditing = !!editPostId;
  const [postContent, setPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [removedExistingMedia, setRemovedExistingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const currentUserName = user?.name || 'User';
  const currentUserAvatar =
    (user?.name && user.name.trim().charAt(0).toUpperCase()) || 'U';

  const handleFileSelected = (file: File, type: 'image' | 'video') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setSelectedMedia({ url: result, type });
        setRemovedExistingMedia(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  useEffect(() => {
    // Prefill when editing
    if (!isEditing || !editPostId) return;
    try {
      const original = (Array.isArray(posts) ? posts : []).find(p => p.id === editPostId);
      if (original) {
        setPostContent(original.content || '');
        setSelectedMedia(original.media || null);
        setRemovedExistingMedia(false);
      }
    } catch {}
  }, [isEditing, editPostId, posts]);

  const dataUrlToFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const match = arr[0].match(/:(.*?);/);
    const mime = match ? match[1] : 'application/octet-stream';
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const uploadSelectedMedia = async (kind: 'story' | 'post'): Promise<{ url: string; type: 'image' | 'video' } | undefined> => {
    if (!selectedMedia) return undefined;
    try {
      if (typeof selectedMedia.url === 'string' && selectedMedia.url.startsWith('data:')) {
        const ext = selectedMedia.type === 'video' ? 'mp4' : 'png';
        const file = dataUrlToFile(selectedMedia.url, `${kind}-${Date.now()}.${ext}`);
        // Try Firebase first
        try {
          const fb = await uploadMediaToFirebase(kind === 'story' ? 'stories' : 'posts', file);
          if (fb.success && fb.url) {
            return { url: fb.url, type: selectedMedia.type };
          }
        } catch {}
        // Fallback to server upload endpoint
        try {
          const remoteUrl = await uploadService.uploadFile(file);
          return { url: remoteUrl, type: selectedMedia.type };
        } catch {}
        return undefined;
      } else {
        return selectedMedia;
      }
    } catch {
      return undefined;
    }
  };

  const handlePost = async () => {
    if (!user) return;
    const trimmed = postContent.trim();
    if (!trimmed) return;

    if (isStoryMode) {
      try {
        const uploadedMedia = await uploadSelectedMedia('story');
        const newStory = {
          id: Date.now(),
          createdAt: Date.now(),
          authorId: user.id,
          author: user.name,
          avatar: user.name.trim().charAt(0).toUpperCase(),
          content: trimmed,
          media: uploadedMedia,
          viewed: false,
          type: selectedMedia
            ? selectedMedia.type === 'video'
              ? 'video'
              : 'photo'
            : 'text',
        };
        try {
          const existing = localStorage.getItem('communityStories');
          const stories = existing ? JSON.parse(existing) : [];
          stories.unshift(newStory);
          try {
            localStorage.setItem('communityStories', JSON.stringify(stories));
          } catch (e) {
            const slim = stories.slice(0, 50).map((s: any) => ({
              id: s.id,
              createdAt: s.createdAt,
              authorId: s.authorId,
              author: s.author,
              avatar: s.avatar,
              content: s.content,
              viewed: !!s.viewed,
              type: s.type,
              media: s.media && typeof s.media.url === 'string' && s.media.url.startsWith('data:') ? undefined : s.media,
            }));
            try { localStorage.setItem('communityStories', JSON.stringify(slim)); } catch {}
          }
        } catch {}

        websocketService.pushUpdate({
          type: 'communityStories',
          action: 'add',
          data: newStory,
        });
      } catch (error) {
        console.error('Error saving story to localStorage', error);
      }
    } else if (isEditing && editPostId) {
      // Permission check: only admin or author can edit
      try {
        const original = (Array.isArray(posts) ? posts : []).find(p => p.id === editPostId);
        if (!original) return;
        const canEdit = (user.role === 'admin') || (original.author === user.name);
        if (!canEdit) return;
        let newMedia: { url: string; type: 'image' | 'video' } | undefined = undefined;
        if (!removedExistingMedia) {
          if (selectedMedia) {
            if (typeof selectedMedia.url === 'string' && selectedMedia.url.startsWith('data:')) {
              // Upload newly selected media if it's a data URL
              newMedia = await uploadSelectedMedia('post');
            } else {
              newMedia = selectedMedia;
            }
          } else {
            newMedia = original.media;
          }
        }
        const updated = {
          ...original,
          content: trimmed,
          media: newMedia,
        };
        updatePost(updated as any);
      } catch {}
    } else {
      let mediaForPost: { url: string; type: 'image' | 'video' } | undefined = undefined;
      try {
        mediaForPost = await uploadSelectedMedia('post');
      } catch (e) {
        console.error('Media upload failed, posting without media', e);
        mediaForPost = undefined;
      }
      createPost(trimmed, user, mediaForPost);
    }

    setPostContent('');
    setSelectedMedia(null);
    setRemovedExistingMedia(false);
    navigate('/chat');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#020617' : '#f0f2f5',
        color: isDark ? '#e5e7eb' : '#111827',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: isDark ? '#020617' : 'white',
          borderBottom: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          paddingTop: 'calc(env(safe-area-inset-top) + 8px)'
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
              color: isDark ? '#e5e7eb' : '#1f2937',
              margin: 0,
            }}
          >
            {isStoryMode ? 'Create Story' : (isEditing ? 'Edit Post' : 'Create Post')}
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
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelected(file, 'image');
              e.target.value = '';
            }
          }}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileSelected(file, 'video');
              e.target.value = '';
            }
          }}
        />
      </div>

      <div style={{ maxWidth: '680px', margin: '16px auto', padding: '0 16px' }}>
        <div
          style={{
            backgroundColor: isDark ? '#020617' : 'white',
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
              backgroundColor: isDark ? '#020617' : 'white',
              color: isDark ? '#e5e7eb' : '#111827',
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
              type="button"
              onClick={handleVideoClick}
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
              type="button"
              onClick={handleImageClick}
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
              <span>Photo</span>
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

          {selectedMedia && (
            <div style={{ marginTop: '12px' }}>
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt="Selected"
                  style={{
                    maxWidth: '100%',
                    borderRadius: '10px',
                    maxHeight: '320px',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <video
                  controls
                  src={selectedMedia.url}
                  style={{
                    width: '100%',
                    borderRadius: '10px',
                    maxHeight: '320px',
                    backgroundColor: '#000',
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => { setSelectedMedia(null); setRemovedExistingMedia(true); }}
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#ef4444',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
              >
                Remove media
              </button>
            </div>
          )}

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
            {isEditing ? 'Save changes' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
