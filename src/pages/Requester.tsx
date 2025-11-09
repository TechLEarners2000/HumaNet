import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SOSButton } from "@/components/SOSButton";
import { StatusCard } from "@/components/StatusCard";
import LiveMap from "@/components/LiveMap";
import { QuickActions } from "@/components/QuickActions";
import { Shield, Battery, Wifi, X, Star, User as UserIcon, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/mockAuth";

type AppState = "safe" | "sos-active" | "helper-found" | "in-session";

const Requester = () => {
  const [appState, setAppState] = useState<AppState>("safe");
  const [countdown, setCountdown] = useState(30);
  const [nearbyVolunteer, setNearbyVolunteer] = useState<User | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [availableVolunteers, setAvailableVolunteers] = useState<User[]>([]);
  const [guardianMode, setGuardianMode] = useState(false);

  useEffect(() => {
    // Get current location on mount
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);

          // Fetch available volunteers
        try {
          const API_BASE = 'https://humanet.onrender.com/api';
          const volResponse = await fetch(`${API_BASE}/users/volunteers`);
          const allVolunteers = await volResponse.json();
          const volunteers = allVolunteers.filter((v: any) => {
            if (!v.location) return false;
            const distance = calculateDistance(location.lat, location.lng, v.location.lat, v.location.lng);
            return distance <= 10; // 10km radius
          });

          // Sort by distance (nearest first)
          volunteers.sort((a: any, b: any) => {
            const distA = calculateDistance(location.lat, location.lng, a.location.lat, a.location.lng);
            const distB = calculateDistance(location.lat, location.lng, b.location.lat, b.location.lng);
            return distA - distB;
          });

          setAvailableVolunteers(volunteers);
        } catch (error) {
          console.error('Error fetching volunteers:', error);
        }
      },
      (error) => console.error('Location error:', error)
    );
  }, []);

  // Update location every 5 seconds for real-time tracking
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Location update error:', error)
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSOSActivate = () => {
    setAppState("sos-active");
    toast.info("SOS Activated - Finding nearby helpers...", {
      description: "Stay calm, help is on the way",
    });

    // Get current location and create help request
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setCurrentLocation(location);

        try {
          // Create help request
          const API_BASE = 'https://humanet.onrender.com/api';
          const requestResponse = await fetch(`${API_BASE}/help-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requester_id: 'anonymous', // In real app, use actual user ID
              location: location
            })
          });

          if (requestResponse.ok) {
            const helpRequest = await requestResponse.json();
            toast.success("Help request sent!", {
              description: "Volunteers in your area have been notified",
            });

            // Poll for accepted requests
            const pollForAcceptance = async () => {
              try {
                const API_BASE = 'https://humanet.onrender.com/api';
                const pendingResponse = await fetch(`${API_BASE}/help-requests/pending`);
                const pendingRequests = await pendingResponse.json();
                const myRequest = pendingRequests.find((r: any) => r.id === helpRequest.id);

                if (!myRequest) {
                  // Request was accepted
                  setAppState("helper-found");
                  toast.success("Helper Found!", {
                    description: "A volunteer is on the way to help you",
                  });
                  return;
                }

                // Continue polling
                setTimeout(pollForAcceptance, 2000);
              } catch (error) {
                console.error('Error polling for acceptance:', error);
              }
            };

            // Start polling after a short delay
            setTimeout(pollForAcceptance, 2000);

            // Also show available volunteers for direct contact
            const API_BASE = 'https://humanet.onrender.com/api';
            const volResponse = await fetch(`${API_BASE}/users/volunteers`);
            const allVolunteers = await volResponse.json();
            const volunteers = allVolunteers.filter((v: any) => {
              if (!v.location) return false;
              const distance = calculateDistance(latitude, longitude, v.location.lat, v.location.lng);
              return distance <= 5; // 5km radius
            });

            // Sort by distance (nearest first)
            volunteers.sort((a: any, b: any) => {
              const distA = calculateDistance(latitude, longitude, a.location.lat, a.location.lng);
              const distB = calculateDistance(latitude, longitude, b.location.lat, b.location.lng);
              return distA - distB;
            });

            setAvailableVolunteers(volunteers);
          } else {
            toast.error("Failed to send help request");
            setAppState("safe");
          }
        } catch (error) {
          console.error('Error creating help request:', error);
          toast.error("Failed to find helpers");
          setAppState("safe");
        }
      },
      (error) => {
        console.error('Location error:', error);
        toast.error("Location access required", {
          description: "Please enable location to find helpers",
        });
        setAppState("safe");
      }
    );
  };

  const handleCancel = () => {
    setAppState("safe");
    toast.info("SOS Cancelled", {
      description: "Glad you're safe!",
    });
  };

  const handleStartSession = () => {
    setAppState("in-session");
    toast.success("Connected", {
      description: "You're now connected with your helper",
    });
  };

  const handleEndSession = async () => {
    // In a real app, we would complete the help request on the backend
    // For now, just reset state
    setAppState("safe");
    toast.success("Session Ended", {
      description: "Thank you for using our service",
    });
  };

  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // For requester, we don't enforce authentication - they can use the app anonymously
      // But if they are logged in, make sure they have the right role
      if (user && user.role !== 'requester') {
        // Allow any logged in user to access requester page
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold">SafeWalk</h1>
            </div>
            <div className="flex items-center gap-3">
              <Battery className="w-4 h-4 text-success" />
              <Wifi className="w-4 h-4 text-success" />
              <Badge variant="outline" className="text-xs">
                {appState === "safe" && "Safe Mode"}
                {appState === "sos-active" && "Active SOS"}
                {appState === "helper-found" && "Helper Found"}
                {appState === "in-session" && "In Session"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24 max-w-2xl">
        <div className="space-y-6">
          {/* Map */}
          <div className="h-80">
            <LiveMap sessionId="session-123" userId="requester" />
          </div>

          {/* Status Card */}
          <StatusCard
            status={appState}
            helperName={nearbyVolunteer?.name}
            distance={nearbyVolunteer ? `${nearbyVolunteer.distance?.toFixed(1)} km` : undefined}
            eta={appState === "helper-found" ? "5 mins" : undefined}
            rating={nearbyVolunteer?.rating}
          />

          {/* SOS Button - Safe State */}
          {appState === "safe" && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <SOSButton onActivate={handleSOSActivate} />
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Press and hold for 1.5 seconds to activate emergency help
                </p>
              </div>

              {/* Available Volunteers */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Available Volunteers</h3>
                <div className="space-y-3">
                  {availableVolunteers.map((volunteer, index) => {
                    const distance = currentLocation ? calculateDistance(
                      currentLocation.lat,
                      currentLocation.lng,
                      volunteer.location?.lat || 0,
                      volunteer.location?.lng || 0
                    ) : 0;

                    return (
                      <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{volunteer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ {volunteer.rating || 'N/A'} • {distance.toFixed(1)} km away
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            if (volunteer.phone) {
                              window.open(`tel:${volunteer.phone}`);
                              toast.success(`Calling ${volunteer.name}...`);
                            } else {
                              toast.error("Phone number not available");
                            }
                          }}>
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            if (volunteer.phone) {
                              window.open(`sms:${volunteer.phone}?body=Hi ${volunteer.name}, I need help with SafeWalk.`);
                              toast.success(`Messaging ${volunteer.name}...`);
                            } else {
                              toast.error("Phone number not available");
                            }
                          }}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {availableVolunteers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Loading available volunteers...
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* SOS Active State */}
          {appState === "sos-active" && (
            <div className="space-y-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/20 mb-4">
                  <span className="text-2xl font-bold text-warning">{countdown}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Finding nearby helpers... Escalating to trusted contacts if no response
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancel}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel SOS
              </Button>
            </div>
          )}

          {/* Helper Found State */}
          {appState === "helper-found" && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Available Helpers ({availableVolunteers.length})</h4>
                <div className="space-y-3">
                  {availableVolunteers.map((volunteer, index) => {
                    const distance = currentLocation ? calculateDistance(
                      currentLocation.lat,
                      currentLocation.lng,
                      volunteer.location?.lat || 0,
                      volunteer.location?.lng || 0
                    ) : 0;

                    return (
                      <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{volunteer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ {volunteer.rating || 'N/A'} • {distance.toFixed(1)} km away
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            if (volunteer.phone) {
                              window.open(`tel:${volunteer.phone}`);
                              toast.success(`Calling ${volunteer.name}...`);
                            } else {
                              toast.error("Phone number not available");
                            }
                          }}>
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            if (volunteer.phone) {
                              window.open(`sms:${volunteer.phone}?body=Hi ${volunteer.name}, I need help with SafeWalk.`);
                              toast.success(`Messaging ${volunteer.name}...`);
                            } else {
                              toast.error("Phone number not available");
                            }
                          }}>
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Safety Tips</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Stay in well-lit, public areas</li>
                  <li>• Share your live location with trusted contacts</li>
                  <li>• Keep your helper visible at all times</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleStartSession}>
                  Start Session
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* In Session State */}
          {appState === "in-session" && (
            <div className="space-y-4">
                <QuickActions
                  onCall={() => {
                    const volunteer = nearbyVolunteer;
                    if (volunteer?.phone) {
                      window.open(`tel:${volunteer.phone}`);
                      toast.success(`Calling ${volunteer.name}...`);
                    } else {
                      toast.error("Volunteer phone number not available");
                    }
                  }}
                  onMessage={() => {
                    const volunteer = nearbyVolunteer;
                    if (volunteer?.phone) {
                      window.open(`sms:${volunteer.phone}`);
                      toast.success(`Messaging ${volunteer.name}...`);
                    } else {
                      toast.error("Volunteer phone number not available");
                    }
                  }}
                  onShareLocation={() =>
                    toast.success("Location shared with trusted contacts")
                  }
                  onReport={() => toast.info("Opening report form...")}
                />
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Quick Messages</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-auto py-2 text-xs">
                    Where are you?
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 text-xs">
                    I'm here
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 text-xs">
                    Thank you
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto py-2 text-xs">
                    Almost there
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-success/20 text-success hover:bg-success/10"
                onClick={handleEndSession}
              >
                <Star className="w-4 h-4 mr-2" />
                End Session & Rate Helper
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Guardian Mode Toggle - Fixed Bottom */}
      {appState === "safe" && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border p-4">
          <div className="container mx-auto max-w-2xl">
            <Button
              variant={guardianMode ? "default" : "outline"}
              className="w-full"
              size="lg"
              onClick={() => {
                setGuardianMode(!guardianMode);
                toast.success(guardianMode ? "Guardian Mode Disabled" : "Guardian Mode Enabled", {
                  description: guardianMode ? "You are no longer in guardian mode" : "Trusted contacts will be notified of your location"
                });
              }}
            >
              <Shield className="w-4 h-4 mr-2" />
              {guardianMode ? "Disable Guardian Mode" : "Enable Guardian Mode"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requester;
