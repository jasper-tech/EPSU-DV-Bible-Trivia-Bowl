// src/components/Timer.tsx
import React, { useEffect, useRef } from "react";
import { TimerProps } from "../types/quiz";

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  setTimeRemaining,
  isActive,
  onTimeUp,
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate percentage for progress bar
  const getTimerPercentage = (): number => {
    // We don't know the original time, so we can't calculate percentage directly
    // Assuming 100% of timer is a reasonable default max time (e.g. 60 seconds)
    return (timeRemaining / 60) * 100;
  };

  // Get appropriate color based on time remaining
  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return "bg-red-500"; // Urgent: less than 10 seconds
    if (timeRemaining <= 30) return "bg-yellow-500"; // Warning: less than 30 seconds
    return "bg-green-500"; // Plenty of time
  };

  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Setup new timer if active
    if (isActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up
            if (timerRef.current) clearInterval(timerRef.current);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, setTimeRemaining, onTimeUp]);

  return (
    <div className="flex flex-col items-end">
      <div className="font-mono text-xl font-bold">
        {formatTime(timeRemaining)}
      </div>

      {/* Timer progress bar */}
      <div className="w-32 h-2 bg-gray-600 rounded-full mt-1">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getTimerColor()}`}
          style={{ width: `${getTimerPercentage()}%` }}
        ></div>
      </div>

      {/* Optional: Text indicator */}
      {timeRemaining <= 10 && (
        <span className="text-xs text-red-500 font-medium mt-1">
          Time running out!
        </span>
      )}
    </div>
  );
};

export default Timer;
