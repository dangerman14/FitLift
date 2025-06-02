// Offline functionality utilities
export class OfflineManager {
  private static instance: OfflineManager;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  // Cache exercise data for offline use
  cacheExercises(exercises: any[]) {
    try {
      localStorage.setItem('cached-exercises', JSON.stringify(exercises));
      localStorage.setItem('exercises-cache-time', Date.now().toString());
    } catch (error) {
      console.error('Failed to cache exercises:', error);
    }
  }

  getCachedExercises(): any[] {
    try {
      const cached = localStorage.getItem('cached-exercises');
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached exercises:', error);
      return [];
    }
  }

  // Store routine data for offline creation
  storeOfflineRoutine(routine: any) {
    try {
      const offlineRoutines = this.getOfflineRoutines();
      const routineWithId = {
        ...routine,
        id: `offline-${Date.now()}`,
        createdOffline: true,
        timestamp: Date.now()
      };
      offlineRoutines.push(routineWithId);
      localStorage.setItem('offline-routines', JSON.stringify(offlineRoutines));
      return routineWithId;
    } catch (error) {
      console.error('Failed to store offline routine:', error);
      return null;
    }
  }

  getOfflineRoutines(): any[] {
    try {
      const stored = localStorage.getItem('offline-routines');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline routines:', error);
      return [];
    }
  }

  // Store workout data for offline recording
  storeOfflineWorkout(workout: any) {
    try {
      const offlineWorkouts = this.getOfflineWorkouts();
      const workoutWithId = {
        ...workout,
        id: `offline-${Date.now()}`,
        createdOffline: true,
        timestamp: Date.now()
      };
      offlineWorkouts.push(workoutWithId);
      localStorage.setItem('offline-workouts', JSON.stringify(offlineWorkouts));
      return workoutWithId;
    } catch (error) {
      console.error('Failed to store offline workout:', error);
      return null;
    }
  }

  getOfflineWorkouts(): any[] {
    try {
      const stored = localStorage.getItem('offline-workouts');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline workouts:', error);
      return [];
    }
  }

  // Queue API requests for when connection returns
  queueRequest(url: string, options: RequestInit) {
    try {
      const queue = this.getRequestQueue();
      const request = {
        id: `req-${Date.now()}`,
        url,
        options,
        timestamp: Date.now()
      };
      queue.push(request);
      localStorage.setItem('request-queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue request:', error);
    }
  }

  private getRequestQueue(): any[] {
    try {
      const stored = localStorage.getItem('request-queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get request queue:', error);
      return [];
    }
  }

  // Sync offline data when connection returns
  async syncOfflineData() {
    if (!this.isOnline) return;

    try {
      // Sync queued requests
      await this.syncQueuedRequests();
      
      // Sync offline routines
      await this.syncOfflineRoutines();
      
      // Sync offline workouts
      await this.syncOfflineWorkouts();
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  private async syncQueuedRequests() {
    const queue = this.getRequestQueue();
    const successfulRequests: string[] = [];

    for (const request of queue) {
      try {
        await fetch(request.url, request.options);
        successfulRequests.push(request.id);
      } catch (error) {
        console.error('Failed to sync request:', error);
      }
    }

    // Remove successful requests from queue
    const remainingQueue = queue.filter(req => !successfulRequests.includes(req.id));
    localStorage.setItem('request-queue', JSON.stringify(remainingQueue));
  }

  private async syncOfflineRoutines() {
    const offlineRoutines = this.getOfflineRoutines();
    const syncedIds: string[] = [];

    for (const routine of offlineRoutines) {
      try {
        const response = await fetch('/api/workout-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: routine.name,
            description: routine.description,
            folderId: routine.folderId,
            exercises: routine.exercises
          })
        });

        if (response.ok) {
          syncedIds.push(routine.id);
        }
      } catch (error) {
        console.error('Failed to sync routine:', error);
      }
    }

    // Remove synced routines
    const remainingRoutines = offlineRoutines.filter(routine => !syncedIds.includes(routine.id));
    localStorage.setItem('offline-routines', JSON.stringify(remainingRoutines));
  }

  private async syncOfflineWorkouts() {
    const offlineWorkouts = this.getOfflineWorkouts();
    const syncedIds: string[] = [];

    for (const workout of offlineWorkouts) {
      try {
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(workout)
        });

        if (response.ok) {
          syncedIds.push(workout.id);
        }
      } catch (error) {
        console.error('Failed to sync workout:', error);
      }
    }

    // Remove synced workouts
    const remainingWorkouts = offlineWorkouts.filter(workout => !syncedIds.includes(workout.id));
    localStorage.setItem('offline-workouts', JSON.stringify(remainingWorkouts));
  }

  // Check if data is stale and needs refresh
  isDataStale(cacheKey: string, maxAge: number = 24 * 60 * 60 * 1000): boolean {
    const timestamp = localStorage.getItem(`${cacheKey}-cache-time`);
    if (!timestamp) return true;
    
    const age = Date.now() - parseInt(timestamp);
    return age > maxAge;
  }

  // Clear all offline data
  clearOfflineData() {
    try {
      localStorage.removeItem('cached-exercises');
      localStorage.removeItem('exercises-cache-time');
      localStorage.removeItem('offline-routines');
      localStorage.removeItem('offline-workouts');
      localStorage.removeItem('request-queue');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}