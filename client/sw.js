// Service Worker for offline functionality
const CACHE_NAME = 'fitness-app-v1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => {
          // Return the cached index page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses for certain endpoints
    if (response.ok && shouldCacheResponse(request.url)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return cached response if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for specific endpoints
    return getOfflineFallback(request.url);
  }
}

function shouldCacheResponse(url) {
  return url.includes('/api/exercises') || 
         url.includes('/api/auth/user') ||
         url.includes('/api/routine-folders');
}

function getOfflineFallback(url) {
  if (url.includes('/api/exercises')) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (url.includes('/api/auth/user')) {
    const offlineUser = localStorage.getItem('offline-user');
    return new Response(offlineUser || JSON.stringify({ id: 'offline-user', email: 'offline@local' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('{"error": "Offline"}', {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offline-data') || '[]');
    
    for (const data of offlineData) {
      try {
        await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        // Remove from offline storage after successful sync
        const updatedData = offlineData.filter(item => item.id !== data.id);
        localStorage.setItem('offline-data', JSON.stringify(updatedData));
      } catch (error) {
        console.log('Failed to sync:', error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}