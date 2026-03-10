import { useState, useEffect, useContext, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import VideoCallModal from '../components/VideoCallModal';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const [selectedContact, setSelectedContact] = useState(null);
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);

  // Call State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState(null);
  
  // Media Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peerConnectionRef = useRef(null);
  const activeCallUserIdRef = useRef(null); // the other person

  const STUN_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ]
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('video-call-offer', handleReceiveOffer);
    socket.on('video-call-answer', handleReceiveAnswer);
    socket.on('ice-candidate', handleReceiveIceCandidate);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('video-call-offer', handleReceiveOffer);
      socket.off('video-call-answer', handleReceiveAnswer);
      socket.off('ice-candidate', handleReceiveIceCandidate);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket]);

  // Handle incoming call offer
  const handleReceiveOffer = async (data) => {
    try {
      // Fetch caller info if we don't have it
      if (!caller || caller._id !== data.callerId) {
         // Using the search route hack or a simple logic to find who called, ideally caller info is passed.
         // Let's assume we fetch them temporarily if not passed. In a real app we'd pass their name from backend
         // but for now let's set a placeholder unless it's in our contacts.
      }
      setCaller({ _id: data.callerId, name: 'Incoming Caller' }); 
      setCallData(data);
      setIsReceivingCall(true);
    } catch (e) { console.error(e) }
  };

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices', error);
      alert('Cannot access camera or microphone');
      return null;
    }
  };

  const createPeerConnection = (targetId, stream) => {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', { targetId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peerConnectionRef.current = pc;
    activeCallUserIdRef.current = targetId;
    return pc;
  };

  const handleStartCall = async (contact) => {
    if (!socket) return;
    setIsInCall(true);
    
    const stream = await initLocalStream();
    if (!stream) {
      setIsInCall(false);
      return;
    }

    const pc = createPeerConnection(contact._id, stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit('video-call-offer', {
      receiverId: contact._id,
      callerId: user._id,
      offer
    });
  };

  const acceptCall = async () => {
    setIsReceivingCall(false);
    setIsInCall(true);

    const stream = await initLocalStream();
    if (!stream) {
      handleEndCall();
      return;
    }

    const pc = createPeerConnection(callData.callerId, stream);
    await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('video-call-answer', {
      callerId: callData.callerId,
      answer
    });
  };

  const rejectCall = () => {
    setIsReceivingCall(false);
    if (socket && callData) {
      socket.emit('call-ended', { targetId: callData.callerId });
    }
  };

  const handleReceiveAnswer = async (data) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  };

  const handleReceiveIceCandidate = async (data) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
  };

  const handleCallEnded = () => {
    cleanupCall();
  };

  const handleEndCall = () => {
    if (socket && activeCallUserIdRef.current) {
      socket.emit('call-ended', { targetId: activeCallUserIdRef.current });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsInCall(false);
    setIsReceivingCall(false);
    setCaller(null);
    setCallData(null);
    activeCallUserIdRef.current = null;
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks().find(t => t.kind === 'video');
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        
        // Replace video track in peer connection
        const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        
        // Update local stream state
        setLocalStream(prev => {
          const newStream = new MediaStream([screenTrack, ...prev.getAudioTracks()]);
          return newStream;
        });

        setIsScreenSharing(true);

        // When user clicks "Stop sharing" on the browser strip
        screenTrack.onended = () => {
          revertToCamera();
        };
      } else {
        revertToCamera();
      }
    } catch (error) {
      console.error('Failed to share screen', error);
    }
  };

  const revertToCamera = async () => {
    const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const cameraTrack = cameraStream.getVideoTracks()[0];
    
    const sender = peerConnectionRef.current.getSenders().find(s => s.track.kind === 'video');
    if (sender) sender.replaceTrack(cameraTrack);
    
    setLocalStream(prev => {
      // Find audio track from existing preview to maintain mic state
      const audioTracks = prev ? prev.getAudioTracks() : [];
      return new MediaStream([cameraTrack, ...audioTracks]);
    });
    
    setIsScreenSharing(false);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-bg overflow-hidden relative">
      <Sidebar onSelectContact={setSelectedContact} />
      
      <main className="flex-1 flex flex-col relative w-full h-full">
        {selectedContact ? (
          <ChatWindow 
            contact={selectedContact} 
            onStartCall={handleStartCall} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4 tracking-in-expand">
                <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">ConnectNow Web</h2>
              <p className="text-gray-500 dark:text-gray-400">Select a contact from the sidebar to start messaging and video calling</p>
            </div>
          </div>
        )}
      </main>

      {(isReceivingCall || isInCall) && (
        <VideoCallModal 
          localStream={localStream}
          remoteStream={remoteStream}
          isReceivingCall={isReceivingCall}
          caller={caller}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEndCall={handleEndCall}
          onToggleMute={toggleMute}
          onToggleVideo={toggleVideo}
          onToggleScreenShare={toggleScreenShare}
          isMuted={isMuted}
          isVideoOff={isVideoOff}
        />
      )}
    </div>
  );
};

export default Dashboard;
