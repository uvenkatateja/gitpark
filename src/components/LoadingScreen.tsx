/**
 * Loading Screen Component
 * Shows fun loading messages with animation
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getContextualLoadingMessage, getLoadingSequence } from '@/lib/loadingMessages';

interface LoadingScreenProps {
  context?: {
    isLoadingUser?: boolean;
    isLoadingRepos?: boolean;
    isBuilding3D?: boolean;
    isFunny?: boolean;
  };
  fullScreen?: boolean;
  showSequence?: boolean;
}

export default function LoadingScreen({
  context = {},
  fullScreen = false,
  showSequence = false,
}: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(() => 
    getContextualLoadingMessage(context)
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const [sequence] = useState(() => showSequence ? getLoadingSequence(5) : []);

  useEffect(() => {
    if (showSequence && sequence.length > 0) {
      // Rotate through sequence
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % sequence.length);
      }, 2000);
      
      return () => clearInterval(interval);
    } else {
      // Change message every 3 seconds
      const interval = setInterval(() => {
        setCurrentMessage(getContextualLoadingMessage(context));
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [context, showSequence, sequence]);

  const message = showSequence && sequence.length > 0 
    ? sequence[messageIndex] 
    : currentMessage;

  const containerClass = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="flex justify-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>

        {/* Message */}
        <div className="space-y-2 animate-in fade-in duration-500" key={message.id}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl animate-bounce">{message.icon}</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            {message.text}
          </p>
        </div>

        {/* Progress dots (optional) */}
        {showSequence && sequence.length > 0 && (
          <div className="flex justify-center gap-1.5 pt-2">
            {sequence.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  index === messageIndex
                    ? 'bg-primary w-4'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
