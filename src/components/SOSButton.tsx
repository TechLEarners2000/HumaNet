import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface SOSButtonProps {
  onActivate: () => void;
  disabled?: boolean;
}

export const SOSButton = ({ onActivate, disabled }: SOSButtonProps) => {
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);

  let pressTimer: NodeJS.Timeout;
  let progressInterval: NodeJS.Timeout;

  const handlePressStart = () => {
    if (disabled) return;
    setPressing(true);
    setProgress(0);

    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 6.67; // 100% in 1.5 seconds (15 intervals)
      });
    }, 100);

    pressTimer = setTimeout(() => {
      onActivate();
      setPressing(false);
      setProgress(0);
    }, 1500);
  };

  const handlePressEnd = () => {
    clearTimeout(pressTimer);
    clearInterval(progressInterval);
    setPressing(false);
    setProgress(0);
  };

  return (
    <div className="relative">
      <Button
        size="lg"
        disabled={disabled}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className="w-48 h-48 rounded-full bg-emergency text-emergency-foreground hover:bg-emergency/90 shadow-[0_8px_24px_var(--emergency-glow)] transition-all duration-300 active:scale-95 disabled:opacity-50 relative overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="w-12 h-12" />
            <span className="text-lg font-bold">Need Help</span>
            {pressing && (
              <span className="text-xs opacity-80">Hold...</span>
            )}
          </div>
        </div>
        {pressing && (
          <div
            className="absolute inset-0 bg-white/20 transition-all duration-100"
            style={{
              clipPath: `circle(${progress}% at 50% 50%)`,
            }}
          />
        )}
      </Button>
      <div className="absolute -inset-4 bg-emergency/20 rounded-full animate-pulse -z-10" />
    </div>
  );
};
