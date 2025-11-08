import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPlaceholderProps {
  showUserPin?: boolean;
  showHelperPin?: boolean;
  className?: string;
}

export const MapPlaceholder = ({
  showUserPin = true,
  showHelperPin = false,
  className,
}: MapPlaceholderProps) => {
  return (
    <div
      className={cn(
        "relative w-full h-64 rounded-lg overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5",
        className
      )}
    >
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Street lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-0 right-0 h-8 bg-foreground/20 transform -skew-y-2" />
        <div className="absolute bottom-1/3 left-0 right-0 h-6 bg-foreground/20 transform skew-y-1" />
        <div className="absolute top-0 bottom-0 left-1/3 w-6 bg-foreground/20 transform -skew-x-2" />
      </div>

      {/* Pins */}
      {showUserPin && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="absolute inset-0 animate-ping">
              <div className="w-12 h-12 rounded-full bg-primary/30" />
            </div>
            <div className="relative">
              <MapPin className="w-12 h-12 text-primary fill-primary/20" />
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
            </div>
          </div>
          <p className="text-xs text-center mt-1 font-medium text-primary">You</p>
        </div>
      )}

      {showHelperPin && (
        <div className="absolute top-1/3 right-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <Navigation className="w-10 h-10 text-accent fill-accent/20" />
          </div>
          <p className="text-xs text-center mt-1 font-medium text-accent">Helper</p>
        </div>
      )}

      {/* Location indicator */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-md">
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">Live Location</span>
        </div>
      </div>
    </div>
  );
};
