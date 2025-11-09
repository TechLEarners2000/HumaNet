import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, AlertCircle, LogOut, MapPin, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { mockAuth, User } from '@/lib/mockAuth';
import LiveMap from '@/components/LiveMap';

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeRequests, setActiveRequests] = useState<any[]>([]);
  const [activeVolunteers, setActiveVolunteers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  const [volunteers, setVolunteers] = useState([]);
  const [requesters, setRequesters] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [volRes, reqRes] = await Promise.all([
          fetch('https://humanet.onrender.com/api/users/volunteers'),
          fetch('https://humanet.onrender.com/api/users/requesters')
        ]);
        const volData = await volRes.json();
        const reqData = await reqRes.json();
        setVolunteers(volData);
        setRequesters(reqData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Active requests and active volunteers (in real app, this would come from backend)
  useEffect(() => {
    const mockRequests = requesters.slice(0, 2).map(r => ({
      ...r,
      requestTime: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
      status: Math.random() > 0.5 ? 'active' : 'pending'
    }));
    setActiveRequests(mockRequests);

    const activeVols = volunteers.filter(v => Math.random() > 0.5).slice(0, 2);
    setActiveVolunteers(activeVols);
  }, [volunteers, requesters]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-lg font-bold">SafeWalk Admin</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Welcome, {user.name}</h2>
          <p className="text-muted-foreground">Manage volunteers and monitor system activity</p>
        </div>

        <div className="grid gap-6 md:grid-cols-4 mb-6">
          <Card className="p-6">
            <Users className="w-8 h-8 text-primary mb-2" />
            <div className="text-2xl font-bold">{volunteers.length}</div>
            <div className="text-sm text-muted-foreground">Total Volunteers</div>
          </Card>
          <Card className="p-6">
            <Users className="w-8 h-8 text-success mb-2" />
            <div className="text-2xl font-bold">{activeVolunteers.length}</div>
            <div className="text-sm text-muted-foreground">Active Volunteers</div>
          </Card>
          <Card className="p-6">
            <AlertCircle className="w-8 h-8 text-warning mb-2" />
            <div className="text-2xl font-bold">{activeRequests.length}</div>
            <div className="text-sm text-muted-foreground">Active Requests</div>
          </Card>
          <Card className="p-6">
            <Shield className="w-8 h-8 text-accent mb-2" />
            <div className="text-2xl font-bold">100%</div>
            <div className="text-sm text-muted-foreground">Response Rate</div>
          </Card>
        </div>

        {/* Live Map */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Live Activity Map</h3>
          <div className="h-96">
            <LiveMap sessionId="admin-dashboard" userId="admin" />
          </div>
        </Card>

        {/* Active Requests */}
        {activeRequests.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Active Requests</h3>
            <div className="space-y-3">
              {activeRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {request.requestTime?.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={request.status === 'active' ? 'default' : 'secondary'}>
                      {request.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (request.phone) {
                        window.open(`tel:${request.phone}`);
                        toast.success(`Calling ${request.name}...`);
                      } else {
                        toast.error("Phone number not available");
                      }
                    }}>
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (request.phone) {
                        window.open(`sms:${request.phone}`);
                        toast.success(`Messaging ${request.name}...`);
                      } else {
                        toast.error("Phone number not available");
                      }
                    }}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Active Volunteers */}
        {activeVolunteers.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Active Volunteers</h3>
            <div className="space-y-3">
              {activeVolunteers.map((volunteer) => (
                <div key={volunteer.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="font-medium">{volunteer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Currently helping • ⭐ {volunteer.rating || 'N/A'}
                      </div>
                      {volunteer.location && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Last updated: {new Date(volunteer.location.lastUpdated).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success text-success-foreground">
                      Active
                    </Badge>
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
                        window.open(`sms:${volunteer.phone}`);
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
              ))}
            </div>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Volunteers</h3>
          <div className="space-y-3">
            {volunteers.map((vol) => (
              <div key={vol.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{vol.name}</div>
                    <div className="text-sm text-muted-foreground">{vol.email}</div>
                    {vol.location && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Last seen: {new Date(vol.location.lastUpdated).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    ⭐ {vol.rating || 'N/A'}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${vol.verified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                    {vol.verified ? 'Verified' : 'Pending'}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => {
                    if (vol.phone) {
                      window.open(`tel:${vol.phone}`);
                      toast.success(`Calling ${vol.name}...`);
                    } else {
                      toast.error("Phone number not available");
                    }
                  }}>
                    <Phone className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
