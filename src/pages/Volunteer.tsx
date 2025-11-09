import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import LiveMap from "@/components/LiveMap";
import { QuickActions } from "@/components/QuickActions";
import { Shield, Star, CheckCircle, Clock, Navigation, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { mockAuth } from "@/lib/mockAuth";

type VolunteerState = "idle" | "request-received" | "navigating" | "helping";

const Volunteer = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [state, setState] = useState<VolunteerState>("idle");
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'volunteer') {
      navigate('/auth');
      return;
    }

    // Update location every 5 seconds for real-time tracking
    const locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mockAuth.updateLocation(user.id, position.coords.latitude, position.coords.longitude);
        },
        (error) => console.error('Location update error:', error)
      );
    }, 5000);

    // Poll for pending help requests
    const pollRequests = async () => {
      try {
        const response = await fetch('https://humanet.onrender.com/api/help-requests/pending');
        const requests = await response.json();
        setPendingRequests(requests);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    pollRequests();
    const requestInterval = setInterval(pollRequests, 5000); // Poll every 5 seconds

    // Listen for help requests (simulated via custom event)
    const handleHelpRequest = (e: CustomEvent) => {
      if (isOnline && state === 'idle') {
        setState('request-received');
        toast.info('New help request received!');
      }
    };

    window.addEventListener('help-request', handleHelpRequest as EventListener);

    return () => {
      clearInterval(locationInterval);
      clearInterval(requestInterval);
      window.removeEventListener('help-request', handleHelpRequest as EventListener);
    };
  }, [user, navigate, isOnline, state]);

  const handleAccept = () => {
    setState("navigating");
    toast.success("Request Accepted", {
      description: "Navigating to the person in need",
    });

    // Simulate arrival after 5 seconds
    setTimeout(() => {
      setState("helping");
      toast.info("You've arrived", {
        description: "Session started",
      });
    }, 5000);
  };

  const handleDecline = () => {
    setState("idle");
    toast.info("Request Declined", {
      description: "Looking for other volunteers nearby",
    });
  };

  const handleComplete = () => {
    setState("idle");
    toast.success("Session Completed", {
      description: "Thank you for helping!",
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold">SafeWalk Volunteer</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium mr-2">{user.name}</div>
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOnline(!isOnline)}
              >
                {isOnline ? "Go Offline" : "Go Online"}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Stats Card - Idle State */}
          {state === "idle" && (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Your Impact</h2>
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">47</div>
                    <div className="text-xs text-muted-foreground">People Helped</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">4.9</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Rating
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">23h</div>
                    <div className="text-xs text-muted-foreground">This Month</div>
                  </div>
                </div>
              </Card>

              <div className="h-96">
                <LiveMap sessionId="session-123" userId="volunteer" />
              </div>

              <Card className="p-6 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Ready to Help</h3>
                <p className="text-sm text-muted-foreground">
                  You'll be notified when someone nearby needs assistance
                </p>
              </Card>
            </>
          )}

          {/* Incoming Request */}
          {state === "request-received" && (
            <>
              <Card className="p-6 border-2 border-warning">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge variant="outline" className="mb-2 border-warning text-warning">
                      New Request
                    </Badge>
                    <h2 className="text-xl font-semibold mb-1">Help Needed Nearby</h2>
                    <p className="text-sm text-muted-foreground">
                      Someone needs assistance 0.8 km away
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-warning">0.8 km</div>
                    <div className="text-xs text-muted-foreground">~5 min walk</div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium mb-2">Reason:</p>
                  <p className="text-sm text-muted-foreground">
                    "Walking alone, feeling unsafe"
                  </p>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                  <p className="text-xs font-medium text-warning mb-2">
                    ⚠️ Safety Guidelines
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Meet in well-lit, public areas only</li>
                    <li>• Keep a safe distance, stay visible</li>
                    <li>• Report any concerns immediately</li>
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={handleAccept} size="lg">
                    Accept Request
                  </Button>
                  <Button variant="outline" onClick={handleDecline} size="lg">
                    Decline
                  </Button>
                </div>
              </Card>

              <div className="h-80">
                <LiveMap sessionId="session-123" userId="volunteer" />
              </div>
            </>
          )}

          {/* Navigating */}
          {state === "navigating" && (
            <>
              <Card className="p-6 border-2 border-primary">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Navigation className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">Navigating</h2>
                    <p className="text-sm text-muted-foreground">0.8 km away • 5 mins</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="bg-primary/5 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium mb-2">Person waiting at:</p>
                  <p className="text-sm text-muted-foreground">
                    Anna Salai, near Metro Station Exit 2
                  </p>
                </div>

                <QuickActions
                  onCall={() => {
                    // In a real app, this would get the requester's phone from the session
                    const requesterPhone = "+1234567890"; // Mock phone for demo
                    window.open(`tel:${requesterPhone}`);
                    toast.success("Calling requester...");
                  }}
                  onMessage={() => {
                    const requesterPhone = "+1234567890"; // Mock phone for demo
                    window.open(`sms:${requesterPhone}`);
                    toast.success("Messaging requester...");
                  }}
                  onShareLocation={() => toast.success("Sharing your live location")}
                />
              </Card>

              <div className="h-96">
                <LiveMap sessionId="session-123" userId="volunteer" />
              </div>
              <Button
                variant="outline"
                className="w-full border-destructive/20 text-destructive"
                onClick={() => setState("idle")}>
                <X className="w-4 h-4 mr-2" />
                Cancel & Report Issue
              </Button>
            </>
          )}

          {/* Helping */}
          {state === "helping" && (
            <>
              <Card className="p-6 border-2 border-accent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-accent/10">
                    <CheckCircle className="w-6 h-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">Session Active</h2>
                    <p className="text-sm text-muted-foreground">Helping Rahul K.</p>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">Live</Badge>
                </div>

                <QuickActions
                  onCall={() => toast.info("Voice call active")}
                  onMessage={() => toast.info("Opening chat...")}
                  onShareLocation={() => toast.success("Location shared")}
                  onReport={() => toast.info("Opening report form...")}
                />
              </Card>

              <div className="h-96">
                <LiveMap sessionId="session-123" userId="volunteer" />
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleComplete}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-destructive/20 text-destructive"
                  onClick={() => setState("idle")}
                >
                  <X className="w-4 h-4 mr-2" />
                  End & Report Issue
                </Button>
              </div>
            </>
          )}

          {/* Pending Requests */}
          {state === "idle" && pendingRequests.length > 0 && (
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-3">Pending Help Requests</h3>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="p-3 bg-background rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Help Request #{request.id.split('-')[1]}</span>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Location: {request.location.lat.toFixed(4)}, {request.location.lng.toFixed(4)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch(`https://humanet.onrender.com/api/help-requests/${request.id}/accept`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ volunteer_id: user.id })
                            });
                            if (response.ok) {
                              setState("navigating");
                              toast.success("Request Accepted", {
                                description: "Navigating to the person in need",
                              });
                              // Remove from pending requests
                              setPendingRequests(prev => prev.filter(r => r.id !== request.id));
                            }
                          } catch (error) {
                            console.error('Error accepting request:', error);
                            toast.error("Failed to accept request");
                          }
                        }}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setPendingRequests(prev => prev.filter(r => r.id !== request.id));
                          toast.info("Request declined");
                        }}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </main>
    </div>
  );
};

export default Volunteer;
