import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { OfflineManager } from "@/lib/offline";

export function useOfflineQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  cacheKey?: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  const offlineManager = OfflineManager.getInstance();
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const result = await queryFn();
        
        // Cache successful results for offline use
        if (cacheKey && result) {
          localStorage.setItem(`cached-${cacheKey}`, JSON.stringify(result));
          localStorage.setItem(`${cacheKey}-cache-time`, Date.now().toString());
        }
        
        return result;
      } catch (error) {
        // If offline and we have cached data, return it
        if (!offlineManager.getStatus() && cacheKey) {
          const cached = localStorage.getItem(`cached-${cacheKey}`);
          if (cached) {
            return JSON.parse(cached);
          }
        }
        throw error;
      }
    },
    ...options
  });
}