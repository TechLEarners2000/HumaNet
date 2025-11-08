import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  status: "safe" | "sos-active" | "helper-found" | "in-session";
  helperName?: string;
  distance?: string;
  eta?: string;
  rating?: number;
}

export const StatusCard = ({
  status,
  helperName,
  distance,
  eta,
  rating,
}: StatusCardProps) => {
  const statusConfig = {
    safe: {
      color: "bg-safe/10 text-safe border-safe/20",
      title: "You're Safe",
      icon: Shield,
      description: "Guardian mode is active",
    },
    "sos-active": {
      color: "bg-warning/10 text-warning border-warning/20",
      title: "Finding Help",
      icon: Clock,
      description: "Searching for nearby helpers...",
    },
    "helper-found": {
      color: "bg-primary/10 text-primary border-primary/20",
      title: "Helper Found",
      icon: Shield,
      description: helperName ? `${helperName} is on the way` : "Helper assigned",
    },
    "in-session": {
      color: "bg-accent/10 text-accent border-accent/20",
      title: "Help In Progress",
      icon: MapPin,
      description: "Stay connected with your helper",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={cn("p-6 border-2 transition-all duration-300", config.color)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-current/10">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold">{config.title}</h3>
          </div>
          <p className="text-sm opacity-80">{config.description}</p>

          {helperName && (
            <div className="mt-4 pt-4 border-t border-current/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{helperName}</p>
                  {rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs">⭐</span>
                      <span className="text-sm">{rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {distance && (
                    <p className="text-sm font-medium">{distance} away</p>
                  )}
                  {eta && (
                    <p className="text-xs opacity-70">ETA: {eta}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <Badge variant="secondary" className="ml-2">
          {status === "safe" && "Active"}
          {status === "sos-active" && "Searching"}
          {status === "helper-found" && "Matched"}
          {status === "in-session" && "Live"}
        </Badge>
      </div>
    </Card>
  );
};
