import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, Trash2 } from 'lucide-react';

interface TestItem {
  id: number;
  title: string;
  description: string;
}

export default function SwipeTest() {
  const [items, setItems] = useState<TestItem[]>([
    { id: 1, title: 'Item 1', description: 'This is the first test item' },
    { id: 2, title: 'Item 2', description: 'This is the second test item' },
    { id: 3, title: 'Item 3', description: 'This is the third test item' },
    { id: 4, title: 'Item 4', description: 'This is the fourth test item' },
  ]);

  const [swipeState, setSwipeState] = useState<{
    itemId: number;
    offset: number;
    startX: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent, itemId: number) => {
    const touch = e.touches[0];
    setSwipeState({
      itemId,
      offset: 0,
      startX: touch.clientX
    });
  };

  const handleTouchMove = (e: React.TouchEvent, itemId: number) => {
    if (!swipeState || swipeState.itemId !== itemId) return;
    
    const touch = e.touches[0];
    const deltaX = swipeState.startX - touch.clientX;
    
    // Only allow left swipes (positive deltaX)
    if (deltaX > 0) {
      const maxSwipe = 100;
      const offset = Math.min(deltaX, maxSwipe);
      
      setSwipeState({
        ...swipeState,
        offset
      });
    }
  };

  const handleTouchEnd = (itemId: number) => {
    if (!swipeState || swipeState.itemId !== itemId) return;
    
    // If swiped more than 60px, delete the item
    if (swipeState.offset > 60) {
      removeItem(itemId);
    }
    
    // Reset swipe state
    setSwipeState(null);
  };

  const removeItem = (itemId: number) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addItem = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    setItems(prev => [...prev, {
      id: newId,
      title: `Item ${newId}`,
      description: `This is test item number ${newId}`
    }]);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Swipe-to-Delete Test</CardTitle>
          <p className="text-sm text-gray-600">
            Swipe left on any item to delete it, or use the X button
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.map(item => {
            const isCurrentSwipe = swipeState?.itemId === item.id;
            const offset = isCurrentSwipe ? swipeState.offset : 0;
            const showDeleteHint = offset > 60;
            
            return (
              <div
                key={item.id}
                className="relative overflow-hidden rounded-lg border"
              >
                {/* Delete background - revealed when swiping */}
                <div 
                  className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4"
                  style={{ opacity: offset / 100 }}
                >
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                
                {/* Main item content */}
                <div
                  className={`relative bg-white p-4 flex items-center justify-between transition-transform duration-200 ${
                    showDeleteHint ? 'bg-red-50' : ''
                  }`}
                  style={{ 
                    transform: `translateX(-${offset}px)`,
                    borderLeft: showDeleteHint ? '3px solid #ef4444' : 'none'
                  }}
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  onTouchMove={(e) => handleTouchMove(e, item.id)}
                  onTouchEnd={() => handleTouchEnd(item.id)}
                >
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  
                  {/* X button for desktop/fallback */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items left. Add some items to test swiping!
            </div>
          )}
          
          <Button onClick={addItem} className="w-full mt-4">
            Add Test Item
          </Button>
        </CardContent>
      </Card>
      
      {/* Debug info */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          <p>Items count: {items.length}</p>
          {swipeState && (
            <>
              <p>Swiping item: {swipeState.itemId}</p>
              <p>Offset: {swipeState.offset}px</p>
              <p>Delete threshold: {swipeState.offset > 60 ? 'REACHED' : 'Not reached'}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}