import React, { useEffect, useRef } from "react";

interface TimerProps {
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  isActive: boolean;
  onTimeUp: () => void;
  totalTime?: number;
}

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  setTimeRemaining,
  isActive,
  onTimeUp,
  totalTime = 300,
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

  // Calculate percentage for progress bar using total time
  const getTimerPercentage = (): number => {
    return (timeRemaining / totalTime) * 100;
  };

  // Get appropriate color based on time remaining
  const getTimerColor = (): string => {
    const percentageLeft = (timeRemaining / totalTime) * 100;

    if (percentageLeft <= 15) return "bg-red-500"; // Urgent: less than 15% time left
    if (percentageLeft <= 30) return "bg-yellow-500"; // Warning: less than 30% time left
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {timeRemaining <= totalTime * 0.15 && (
        <span className="text-xs text-red-500 font-medium mt-1">
          Time running out!
        </span>
      )}
    </div>
  );
};

export default Timer;
