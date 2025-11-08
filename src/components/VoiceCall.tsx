import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface VoiceCallProps {
  sessionId: string;
  userId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export const VoiceCall = ({ sessionId, userId, isOpen, onToggle }: VoiceCallProps) => {
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen && !isInCall) {
      initializeCall();
    }
  }, [isOpen]);

  useEffect(() => {
    const callDocRef = doc(db, 'sessions', sessionId, 'call');

    const unsubscribe = onSnapshot(callDocRef, async (docSnapshot) => {
      if (!docSnapshot.exists()) return;

      const callData = docSnapshot.data();

      if (callData.status === 'ended') {
        endCall();
        return;
      }

      if (callData.initiator !== userId && callData.offer && !peerConnectionRef.current) {
        // Receiving call
        await handleIncomingCall(callData);
      } else if (callData.answer && peerConnectionRef.current) {
        // Receiving answer
        await handleAnswer(callData.answer);
      }
    });

    return () => unsubscribe();
  }, [sessionId, userId]);

  const initializeCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peerConnectionRef.current!.addTrack(track, stream);
      });

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to Firestore
          updateDoc(doc(db, 'sessions', sessionId, 'call'), {
            [`${userId}Ice`]: event.candidate.toJSON()
          });
        }
      };

      // Listen for ICE candidates
      const callDocRef = doc(db, 'sessions', sessionId, 'call');
      const unsubscribeIce = onSnapshot(callDocRef, async (docSnapshot) => {
        if (!docSnapshot.exists()) return;
        const callData = docSnapshot.data();

        const otherUserId = userId === 'requester' ? 'volunteer' : 'requester';
        const iceCandidate = callData[`${otherUserId}Ice`];

        if (iceCandidate && peerConnectionRef.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(iceCandidate));
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
      });

      return () => unsubscribeIce();
    } catch (error) {
      console.error('Error initializing call:', error);
    }
  };

  const startCall = async () => {
    if (!peerConnectionRef.current) return;

    setCallStatus('calling');

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      await setDoc(doc(db, 'sessions', sessionId, 'call'), {
        initiator: userId,
        offer: offer,
        status: 'calling'
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleIncomingCall = async (callData: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(callData.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      await updateDoc(doc(db, 'sessions', sessionId, 'call'), {
        answer: answer,
        status: 'connected'
      });

      setIsInCall(true);
      setCallStatus('connected');
    } catch (error) {
      console.error('Error handling incoming call:', error);
    }
  };

  const handleAnswer = async (answer: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      setIsInCall(true);
      setCallStatus('connected');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const endCall = async () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    await updateDoc(doc(db, 'sessions', sessionId, 'call'), {
      status: 'ended'
    });

    setIsInCall(false);
    setCallStatus('ended');
    onToggle();
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-20 right-4 rounded-full w-12 h-12 p-0 z-50"
        variant="outline"
      >
        <Phone className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-64 bg-card border border-border rounded-lg shadow-lg z-50 p-4">
      <audio ref={remoteAudioRef} autoPlay />

      <div className="text-center mb-4">
        <h3 className="font-semibold mb-2">Voice Call</h3>
        <p className="text-sm text-muted-foreground">
          {callStatus === 'idle' && 'Ready to call'}
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'connected' && 'Connected'}
          {callStatus === 'ended' && 'Call ended'}
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {!isInCall && callStatus === 'idle' && (
          <Button onClick={startCall} className="rounded-full w-12 h-12 p-0">
            <Phone className="w-5 h-5" />
          </Button>
        )}

        {isInCall && (
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            className="rounded-full w-10 h-10 p-0"
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
        )}

        <Button
          onClick={endCall}
          variant="destructive"
          className="rounded-full w-12 h-12 p-0"
        >
          <PhoneOff className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
