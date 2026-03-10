import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../services/api';
import { Send, Image, Paperclip, Video as VideoIcon } from 'lucide-react';

const ChatWindow = ({ contact, onStartCall }) => {
  const { user } = useContext(AuthContext);
  const { socket, onlineUsers } = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isOnline = onlineUsers.includes(contact._id);

  useEffect(() => {
    fetchMessages();
    markMessagesAsRead();
    
    // Setup Socket Listeners
    if (socket) {
      socket.on('receive-message', handleReceiveMessage);
      socket.on('typing', handleTyping);
    }

    return () => {
      if (socket) {
        socket.off('receive-message', handleReceiveMessage);
        socket.off('typing', handleTyping);
      }
    };
  }, [contact, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${contact._id}`);
      setMessages(res.data);
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await api.put(`/messages/${contact._id}/read`);
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReceiveMessage = (data) => {
    if (data.sender === contact._id || data.sender._id === contact._id) {
      setMessages((prev) => [...prev, data]);
      markMessagesAsRead();
    }
  };

  const handleTyping = (senderId) => {
    if (senderId === contact._id) {
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { senderId: user._id, receiverId: contact._id });
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !file) || !socket) return;

    try {
      let formData = new FormData();
      formData.append('receiverId', contact._id);
      
      if (file) {
        formData.append('file', file);
        formData.append('content', newMessage || 'File attachment');
        formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');
      } else {
        formData.append('content', newMessage);
        formData.append('type', 'text');
      }

      const res = await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const sentMsg = res.data;
      setMessages((prev) => [...prev, sentMsg]);
      socket.emit('send-message', sentMsg);

      setNewMessage('');
      setFile(null);
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-bg w-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-surface rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
            <p className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onStartCall(contact)}
            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-full transition-colors"
          >
            <VideoIcon size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-dark-bg w-full">
        {messages.map((msg, index) => {
          const isOwn = msg.sender === user._id || msg.sender._id === user._id;
          return (
            <div key={msg._id || index} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                isOwn 
                  ? 'bg-primary-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white border border-gray-100 dark:border-dark-border rounded-tl-none'
              }`}>
                {msg.type === 'image' && msg.fileUrl && (
                  <img src={msg.fileUrl} alt="attachment" className="rounded-md mb-2 max-w-full h-auto" />
                )}
                {msg.type === 'file' && msg.fileUrl && (
                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="underline mb-2 block truncate">
                    📎 Download File
                  </a>
                )}
                <p className="break-words">{msg.content}</p>
                <span className={`text-[10px] block mt-1 text-right opacity-70`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isOwn && (
                    <span className="ml-1">
                      {msg.readStatus ? '✓✓' : '✓'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-dark-surface text-gray-500 rounded-lg rounded-tl-none p-3 shadow-sm flex space-x-1 items-center">
              <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border z-10">
        {file && (
          <div className="mb-2 p-2 bg-gray-100 dark:bg-dark-bg rounded flex items-center justify-between text-sm">
            <span className="truncate dark:text-gray-300">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <label className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer rounded-full transition-colors">
            <Paperclip size={20} />
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-dark-bg border-transparent rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white"
          />
          <button 
            type="submit"
            disabled={(!newMessage.trim() && !file) || !socket}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
