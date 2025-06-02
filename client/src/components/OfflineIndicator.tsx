import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { OfflineManager } from "@/lib/offline";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const offlineManager = OfflineManager.getInstance();
    
    const unsubscribe = offlineManager.onStatusChange((online) => {
      setIsOnline(online);
      
      if (!online) {
        setShowOfflineMessage(true);
      } else {
        // Show briefly that we're back online
        setShowOfflineMessage(true);
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${
      isOnline 
        ? 'bg-green-100 text-green-800 border border-green-200' 
        : 'bg-red-100 text-red-800 border border-red-200'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">Working offline</span>
        </>
      )}
    </div>
  );
}