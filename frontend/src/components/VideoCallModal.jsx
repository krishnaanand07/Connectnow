import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';

const VideoCallModal = ({ 
  localStream, 
  remoteStream, 
  isReceivingCall, 
  caller, 
  onAccept, 
  onReject, 
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleScreenShare,
  isMuted,
  isVideoOff
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (isReceivingCall) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-dark-surface rounded-2xl p-8 flex flex-col items-center shadow-2xl animate-bounce">
          <img src={caller?.avatar || 'https://via.placeholder.com/150'} alt="caller" className="w-24 h-24 rounded-full mb-4 animate-pulse" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{caller?.name || 'Someone'}</h3>
          <p className="text-gray-500 mb-8 blur-none">Incoming Video Call...</p>
          
          <div className="flex space-x-6">
            <button onClick={onReject} className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-transform hover:scale-110">
              <PhoneOff size={24} />
            </button>
            <button onClick={onAccept} className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-transform hover:scale-110">
              <Video size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative w-full h-full bg-gray-900 flex items-center justify-center">
        {remoteStream ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-xl animate-pulse">Connecting...</div>
        )}

        {/* Local Video (Picture in Picture) */}
        <div className="absolute top-4 right-4 w-48 h-64 bg-black rounded-lg overflow-hidden border-2 border-gray-700 shadow-lg">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-gray-900/80 p-4 rounded-2xl backdrop-blur-sm">
          <button 
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button 
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button 
            onClick={onToggleScreenShare}
            className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <MonitorUp size={24} />
          </button>

          <button 
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors ml-4"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
