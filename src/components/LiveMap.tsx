import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LiveMapProps {
  sessionId: string;
  userId: string;
}

const LiveMap = ({ sessionId, userId }: LiveMapProps) => {
  const [userLocation, setUserLocation] = useState<LatLngExpression | null>(null);
  const [otherUserLocation, setOtherUserLocation] = useState<LatLngExpression | null>(null);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: LatLngExpression = [position.coords.latitude, position.coords.longitude];
        setUserLocation(newLocation);
        const userDocRef = doc(db, 'sessions', sessionId, 'users', userId);
        setDoc(userDocRef, { location: newLocation });
      },
      (error) => {
        console.error('Error getting user location:', error);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [sessionId, userId]);

  useEffect(() => {
    const otherUserId = userId === 'requester' ? 'volunteer' : 'requester';
    const otherUserDocRef = doc(db, 'sessions', sessionId, 'users', otherUserId);

    const unsubscribe = onSnapshot(otherUserDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.location) {
          setOtherUserLocation(data.location);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionId, userId]);

  if (!userLocation) {
    return <div>Getting your location...</div>;
  }

  return (
    <MapContainer center={userLocation} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {userLocation && (
        <Marker position={userLocation}>
          <Popup>Your Location</Popup>
        </Marker>
      )}
      {otherUserLocation && (
        <Marker position={otherUserLocation}>
          <Popup>Other User's Location</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default LiveMap;
