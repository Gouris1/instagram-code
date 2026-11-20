
import { useEffect, useState } from 'react';
import {
  Search as SearchIcon,
  UserRound
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Sidebar from '../components/Sidebar';
import './Home.css';
import './Search.css';

function Search() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState('');

  // SEARCH USERS
  useEffect(() => {
    const searchUsers = async () => {
      const searchText = query.trim();

      if (!searchText) {
        setUsers([]);
        setError('');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        setError('login first');
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `http://localhost:5000/api/users/search?q=${encodeURIComponent(searchText)}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Search failed.');
        }

        setUsers(data.users || []);

      } catch (err) {
        setUsers([]);
        setError(err.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);

    return () => clearTimeout(timer);
  }, [query]);


  // FOLLOW / UNFOLLOW USER
  const handleFollow = async (user) => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setBusyUserId(user._id);
    setError('');

    try {
      const method = user.isFollowing ? 'DELETE' : 'POST';

      const response = await fetch(
        `http://localhost:5000/api/follow/${user._id}/follow`,
        {
          method,
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Follow action failed.');
      }

      // Update button status
      setUsers((previousUsers) =>
        previousUsers.map((item) =>
          item._id === user._id
            ? {
                ...item,
                isFollowing: !user.isFollowing
              }
            : item
        )
      );

    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusyUserId('');
    }
  };


  // IMAGE URL
  const getImageUrl = (image) => {
    if (!image) return '';

    return image.startsWith('http')
      ? image
      : `http://localhost:5000${image}`;
  };


  // OPEN CHAT
  const openChat = (user) => {
    navigate(`/messages?userId=${user._id}`);
  };


  return (
    <div className="instagram-layout search-layout">

      <Sidebar />

      <main className="search-page">

        <h2>Search</h2>
        <div className="search-input-wrapper">
          <SearchIcon size={20} />

          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}

        </div>
        <h3>Results</h3>

        {loading && <p>Searching users...</p>}

        {!loading && error && (
          <p className="search-error">{error}</p>
        )}

        {!loading && !error && !query.trim() && (
          <p className="search-hint">
            Search users by name or email.
          </p>
        )}

        {!loading && !error && query.trim() && users.length === 0 && (
          <p>No users found.</p>
        )}

        <div className="search-results">

          {users.map((user) => (

            <div className="search-user" key={user._id}>
              <div className="search-user-avatar">

                {user.profileImage ? (
                  <img
                    src={getImageUrl(user.profileImage)}
                    alt={user.name}
                  />
                ) : (
                  <UserRound size={25} />
                )}

              </div>

              <div className="search-user-info">
                <strong>{user.name}</strong>
                <span>Instagram user</span>
              </div>

              <div className="search-user-actions">
                <button
                  type="button"
                  className={
                    user.isFollowing
                      ? 'follow-button following-button'
                      : 'follow-button'
                  }
                  disabled={busyUserId === user._id}
                  onClick={() => handleFollow(user)}
                >
                  {busyUserId === user._id
                    ? 'Please wait...'
                    : user.isFollowing
                      ? 'Following'
                      : 'Follow'}
                </button>


                <button
                  type="button"
                  className="message-button"
                  onClick={() => openChat(user)}
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Search;
                