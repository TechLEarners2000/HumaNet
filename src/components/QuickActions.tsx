import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Users, AlertTriangle } from "lucide-react";

interface QuickActionsProps {
  onCall?: () => void;
  onMessage?: () => void;
  onShareLocation?: () => void;
  onReport?: () => void;
  disabled?: boolean;
}

export const QuickActions = ({
  onCall,
  onMessage,
  onShareLocation,
  onReport,
  disabled = false,
}: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      {onCall && (
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={onCall}
          disabled={disabled}
        >
          <Phone className="w-5 h-5" />
          <span className="text-sm">Voice Call</span>
        </Button>
      )}
      
      {onMessage && (
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={onMessage}
          disabled={disabled}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">Message</span>
        </Button>
      )}
      
      {onShareLocation && (
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          onClick={onShareLocation}
          disabled={disabled}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm">Share Location</span>
        </Button>
      )}
      
      {onReport && (
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
          onClick={onReport}
          disabled={disabled}
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm">Report</span>
        </Button>
      )}
    </div>
  );
};
