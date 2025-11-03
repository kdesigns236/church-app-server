# Clear Duplicate Data

Your localStorage has duplicate items with the same IDs. Follow these steps to clean it up:

## Option 1: Clear All Data (Recommended)
Open browser console (F12) and run:
```javascript
// Clear all duplicate data
localStorage.removeItem('announcements');
localStorage.removeItem('events');
localStorage.removeItem('sermons');
localStorage.removeItem('prayerRequests');
localStorage.removeItem('chatMessages');
location.reload();
```

## Option 2: Remove Only Duplicates
Open browser console (F12) and run:
```javascript
// Function to remove duplicates
function removeDuplicates(key) {
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  const seen = new Set();
  const unique = data.filter(item => {
    if (seen.has(item.id)) {
      console.log(`Removing duplicate ${key} with id:`, item.id);
      return false;
    }
    seen.add(item.id);
    return true;
  });
  localStorage.setItem(key, JSON.stringify(unique));
  console.log(`${key}: Removed ${data.length - unique.length} duplicates`);
}

// Clean all data types
removeDuplicates('announcements');
removeDuplicates('events');
removeDuplicates('sermons');
removeDuplicates('prayerRequests');
removeDuplicates('chatMessages');

console.log('✅ All duplicates removed! Reloading...');
location.reload();
```

## Why This Happened
Before the fix, when you added items:
1. Item added to state ✅
2. Pushed to server ✅
3. Server broadcast back ✅
4. **Same item added AGAIN** ❌

The fix in `AppContext.tsx` prevents **new** duplicates, but doesn't remove **existing** ones from localStorage.

## After Cleanup
- ✅ No more duplicate key warnings
- ✅ All items appear only once
- ✅ Real-time sync works correctly
- ✅ Future items won't duplicate
