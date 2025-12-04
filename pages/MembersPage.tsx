import React, { useMemo, useState } from 'react';
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
  const [query, setQuery] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const list = useMemo(() => {
    const base = Array.isArray(users) ? [...users] : [];
    const q = query.trim().toLowerCase();
    const filtered = base.filter(u => {
      if (onlineOnly && !u.isOnline) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
    filtered.sort((a, b) => Number(!!b.isOnline) - Number(!!a.isOnline) || a.name.localeCompare(b.name));
    return filtered;
  }, [users, query, onlineOnly]);

  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const getGroupKey = (name: string) => {
    if (!name) return '#';
    const c = name.trim().charAt(0).toUpperCase();
    return ALPHA.includes(c) ? c : '#';
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof list>();
    list.forEach(u => {
      const key = getGroupKey(u.name);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(u);
    });
    // Ensure each group's items are sorted by name
    map.forEach(arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
    return map;
  }, [list]);

  const availableKeys = useMemo(() => {
    const keys = Array.from(grouped.keys()).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });
    return keys;
  }, [grouped]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 pr-10 sm:pr-14 py-6">
        <h1 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Members</h1>
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-text-main dark:text-gray-200 outline-none focus:ring-2 focus:ring-secondary"
          />
          <label className="inline-flex items-center gap-2 text-sm text-text-main dark:text-gray-200">
            <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} />
            Online only
          </label>
        </div>
        {/* Grouped sections with anchors */}
        <div className="relative">
          <div className="space-y-6">
            {availableKeys.map(key => (
              <div key={key} id={`letter-${key}`}>
                <div className="sticky top-0 z-10 backdrop-blur-sm">
                  <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 px-1 py-1">{key}</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {(grouped.get(key) || []).map(u => (
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
                  {(grouped.get(key) || []).length === 0 && (
                    <div className="text-gray-400 text-sm">No entries</div>
                  )}
                </div>
              </div>
            ))}
            {availableKeys.length === 0 && (
              <div className="text-gray-500 dark:text-gray-400">No members yet.</div>
            )}
          </div>

          {/* Alphabet index on the right (always visible) */}
          <div className="flex flex-col gap-0.5 sm:gap-1 items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 select-none z-30"
               style={{ position: 'fixed', right: '10px', top: '30%', transform: 'translateY(-50%)' }}>
            {['#', ...ALPHA].map(letter => {
              const enabled = letter === '#' ? availableKeys.includes('#') : availableKeys.includes(letter);
              return (
                <button
                  key={letter}
                  onClick={() => {
                    const el = document.getElementById(`letter-${letter}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  disabled={!enabled}
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center ${enabled ? 'bg-white/70 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-700 cursor-pointer' : 'opacity-40 cursor-default'} shadow-sm border border-gray-200/60 dark:border-gray-700/60`}
                  aria-label={`Jump to ${letter}`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersPage;
