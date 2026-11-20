import { useEffect, useState } from 'react';
import { Heart, MessageCircle, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './Notifications.css';

const API = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const getImageUrl = (url) => {
  if (!url || !url.trim()) return null;

  return url.startsWith('http')
    ? url
    : `${SERVER_URL}${url}`;
};
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch(`${API}/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Notifications load nahi hui.');
        }

        setNotifications(data.notifications || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchNotifications();
    } else {
      setError('login first');
      setLoading(false);
    }
  }, [token]);

  async function markAsRead(notificationId) {
    try {
      const response = await fetch(
        `${API}/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Notification update nahi hui.');
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true }
            : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="instagram-layout">
      <Sidebar />

      <main className="notifications-page">
        <h2>Notifications</h2>

        {loading && <p>Loading notifications...</p>}

        {error && <p className="notification-error">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div className="no-notifications">
            <Heart size={45} />
            <h3>No notifications yet</h3>
            <p>Any user post like and comment your post, then display in this page.</p>
          </div>
        )}

        <div className="notifications-list">
          {notifications.map((item) => {
            const sender = item.sender;
            const post = item.post;

            return (
              <div
                className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                key={item._id}
                onClick={() => {
                  if (!item.isRead) markAsRead(item._id);
                }}
              >
               <div className="notification-avatar">
                 {getImageUrl(sender?.profileImage) ? (
                  <img
                     src={getImageUrl(sender.profileImage)}
                     alt={sender?.name || 'User'}
                    />
                    ) : (
                    <UserRound size={25} />
                  )}
               </div>

                <div className="notification-text">
                  <p>
                    <strong>{sender?.name || 'Someone'}</strong>

                    {item.type === 'like'
                      ? ' liked your post.'
                      : item.type === 'comment'
                        ? ' commented on your post.'
                        : ' interacted with your post.'}
                  </p>

                  {item.type === 'comment' && item.commentText && (
                    <span className="notification-comment">
                      "{item.commentText}"
                    </span>
                  )}

                  <small>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : ''}
                  </small>
                </div>

               {getImageUrl(post?.imageUrl) && (
                 <img
                     className="notification-post-image"
                     src={getImageUrl(post.imageUrl)}
                     alt="Post"
                   />
                )}

                {item.type === 'like' && (
                  <Heart className="notification-type-icon" size={21} />
                )}

                {item.type === 'comment' && (
                  <MessageCircle
                    className="notification-type-icon"
                    size={21}
                  />
                )}

                {!item.isRead && (
                  <span className="unread-dot"></span>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Notifications;
