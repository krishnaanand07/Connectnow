import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { ThemeContext } from '../context/ThemeContext';
import { Search, UserPlus, LogOut, Settings, Moon, Sun } from 'lucide-react';

const Sidebar = ({ onSelectContact }) => {
  const { user, logout } = useContext(AuthContext);
  const { onlineUsers } = useContext(SocketContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/users/contacts');
      setContacts(res.data);
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      try {
        const res = await api.get(`/users/search?q=${query}`);
        setSearchResults(res.data);
      } catch (error) {
        console.error('Search failed', error);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      await api.post('/users/contacts', { contactId });
      setSearchQuery('');
      setIsSearching(false);
      fetchContacts();
    } catch (error) {
      console.error('Failed to add contact', error);
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col h-full">
      {/* User Profile Header */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full object-cover" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{user?.name}</h3>
            <span className="text-xs text-green-500">Online</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTheme} className="text-gray-500 hover:text-primary-500 transition-colors">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={logout} className="text-gray-500 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-dark-bg border-transparent rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {/* Contacts / Search Results */}
      <div className="flex-1 overflow-y-auto">
        {isSearching ? (
          <div className="px-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Search Results</h4>
            {searchResults.map((result) => (
              <div key={result._id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-lg cursor-pointer">
                <div className="flex items-center space-x-3">
                  <img src={result.avatar} alt={result.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{result.name}</h4>
                  </div>
                </div>
                <button 
                  onClick={() => handleAddContact(result._id)}
                  className="text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 p-2 rounded-full"
                >
                  <UserPlus size={18} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-2">
             <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Contacts</h4>
             {contacts.length === 0 ? (
               <p className="text-sm text-gray-500 px-2 text-center mt-4">No contacts yet. Search to add someone!</p>
             ) : (
               contacts.map((contact) => {
                 const isOnline = onlineUsers.includes(contact._id);
                 return (
                   <div 
                     key={contact._id} 
                     onClick={() => onSelectContact(contact)}
                     className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-dark-bg rounded-lg cursor-pointer transition-colors"
                   >
                     <div className="relative">
                       <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                       {isOnline && (
                         <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-surface rounded-full"></span>
                       )}
                     </div>
                     <div>
                       <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                       <span className="text-xs text-gray-500">{isOnline ? 'Online' : 'Offline'}</span>
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
