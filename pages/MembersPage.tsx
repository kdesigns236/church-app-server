import React from 'react';
import { useAuth } from '../hooks/useAuth';

const OnlineDot: React.FC<{ online?: boolean }> = ({ online }) => (
  <span
    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white dark:ring-black ${online ? 'bg-green-500' : 'bg-gray-400'}`}
    aria-label={online ? 'Online' : 'Offline'}
  />
);

const Avatar: React.FC<{ name: string; photo?: string; online?: boolean }>= ({ name, photo, online }) => (
  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-secondary text-primary flex items-center justify-center font-bold">
    {photo ? (
      <img src={photo} alt={name} className="w-full h-full object-cover" />
    ) : (
      <span>{name.charAt(0).toUpperCase()}</span>
    )}
    <OnlineDot online={online} />
  </div>
);

const MembersPage: React.FC = () => {
  const { users } = useAuth();
  const list = Array.isArray(users) ? [...users] : [];
  // Online first, then by name
  list.sort((a, b) => Number(!!b.isOnline) - Number(!!a.isOnline) || a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Members</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(u => (
            <div key={u.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-center gap-3">
              <Avatar name={u.name} photo={(u as any).profilePictureUrl || (u as any).profilePicture} online={u.isOnline} />
              <div className="flex-1">
                <p className="font-semibold text-text-main dark:text-gray-100">{u.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isOnline ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                {u.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-gray-500 dark:text-gray-400">No members yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
