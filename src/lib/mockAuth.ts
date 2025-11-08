// Mock authentication system using localStorage
import volunteersData from './volunteers.json';
import adminsData from './admins.json';
import requestersData from './requesters.json';

export type UserRole = 'admin' | 'volunteer' | 'requester';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  verified?: boolean;
  rating?: number;
  distance?: number;
  location?: {
    lat: number;
    lng: number;
    lastUpdated: number;
  };
}

interface AdminData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  verified: boolean;
  phone: string;
  location: any;
}

interface VolunteerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  location?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
  rating: number;
  verified: boolean;
  available: boolean;
}

interface RequesterData {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  verified: boolean;
  phone: string;
  location?: {
    lat: number;
    lng: number;
    lastUpdated: string;
  };
}

// Load users from localStorage or JSON files
const loadUsersFromStorage = (): User[] => {
  const storedVolunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
  const storedAdmins = JSON.parse(localStorage.getItem('admins') || '[]');

  return [
    // Load from JSON files (initial data)
    ...adminsData.map((a: any) => ({
      id: a.id,
      email: a.email,
      password: a.password,
      role: 'admin' as UserRole,
      name: a.name,
      phone: a.phone,
      verified: a.verified,
      location: a.location ? {
        lat: a.location.lat,
        lng: a.location.lng,
        lastUpdated: new Date(a.location.lastUpdated).getTime()
      } : undefined
    })),
    ...volunteersData.map((v: any) => ({
      id: v.id,
      email: v.email,
      password: 'vol123',
      role: 'volunteer' as UserRole,
      name: v.name,
      phone: v.phone,
      verified: v.verified,
      rating: v.rating,
      location: v.location ? {
        lat: v.location.lat,
        lng: v.location.lng,
        lastUpdated: new Date(v.location.lastUpdated).getTime()
      } : undefined
    })),
    ...requestersData.map((r: any) => ({
      id: r.id,
      email: r.email,
      password: r.password,
      role: 'requester' as UserRole,
      name: r.name,
      phone: r.phone,
      verified: r.verified,
      location: r.location ? {
        lat: r.location.lat,
        lng: r.location.lng,
        lastUpdated: new Date(r.location.lastUpdated).getTime()
      } : undefined
    })),
    // Load from localStorage (newly registered users)
    ...storedAdmins.map((a: any) => ({
      id: a.id,
      email: a.email,
      password: a.password,
      role: 'admin' as UserRole,
      name: a.name,
      phone: a.phone,
      verified: a.verified,
      location: a.location ? {
        lat: a.location.lat,
        lng: a.location.lng,
        lastUpdated: new Date(a.location.lastUpdated).getTime()
      } : undefined
    })),
    ...storedVolunteers.map((v: any) => ({
      id: v.id,
      email: v.email,
      password: 'vol123',
      role: 'volunteer' as UserRole,
      name: v.name,
      phone: v.phone,
      verified: v.verified,
      rating: v.rating || 0,
      location: v.location ? {
        lat: v.location.lat,
        lng: v.location.lng,
        lastUpdated: new Date(v.location.lastUpdated).getTime()
      } : undefined
    })),
  ];
};

// Mock users database (in real app, this would be a JSON file on server)
const MOCK_USERS: User[] = loadUsersFromStorage();

export const mockAuth = {
  login: async (email: string, password: string): Promise<User | null> => {
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      return userWithoutPassword as User;
    }
    return null;
  },

  signup: async (email: string, password: string, name: string, role: UserRole, phone?: string): Promise<User | null> => {
    const exists = MOCK_USERS.find(u => u.email === email);
    if (exists) return null;

    const newUser: User = {
      id: `${role}-${Date.now()}`,
      email,
      password,
      name,
      phone,
      role,
      verified: role === 'volunteer' ? false : true,
    };

    // Add to appropriate JSON file
    if (role === 'volunteer') {
      const volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
      volunteers.push({
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        location: null,
        rating: 0,
        verified: newUser.verified,
        available: true
      });
      localStorage.setItem('volunteers', JSON.stringify(volunteers));
    } else if (role === 'admin') {
      const admins = JSON.parse(localStorage.getItem('admins') || '[]');
      admins.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        verified: newUser.verified,
        phone: newUser.phone,
        location: null
      });
      localStorage.setItem('admins', JSON.stringify(admins));
    }

    // Add to MOCK_USERS array for immediate use
    MOCK_USERS.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
    return userWithoutPassword as User;
  },

  logout: () => {
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  getAllVolunteers: (): User[] => {
    return MOCK_USERS.filter(u => u.role === 'volunteer' && u.verified);
  },

  getAllRequesters: (): User[] => {
    return MOCK_USERS.filter(u => u.role === 'requester');
  },

  getAllAdmins: (): User[] => {
    return MOCK_USERS.filter(u => u.role === 'admin');
  },

  updateLocation: (userId: string, lat: number, lng: number) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) {
      user.location = { lat, lng, lastUpdated: Date.now() };
    }
  },

  findNearbyVolunteers: (lat: number, lng: number, radiusKm: number = 5): User[] => {
    const volunteers = MOCK_USERS.filter(u => u.role === 'volunteer' && u.verified && u.location);
    
    return volunteers
      .map(v => {
        if (!v.location) return null;
        const distance = calculateDistance(lat, lng, v.location.lat, v.location.lng);
        return { ...v, distance };
      })
      .filter(v => v && v.distance <= radiusKm)
      .sort((a, b) => a!.distance - b!.distance) as User[];
  },
};

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
