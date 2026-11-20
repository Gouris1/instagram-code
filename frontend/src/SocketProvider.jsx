
import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import {
  socket,
  connectSocket,
  disconnectSocket
} from './socket';

import {
  useNavigate,
  useLocation
} from 'react-router-dom';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [activeNotification, setActiveNotification] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // SOCKET CONNECTION
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      connectSocket(token);
    }

    function handleReceiveMessage(message) {
      console.log('NEW MESSAGE RECEIVED:', message);
      console.log('SOCKET CONNECTED:', socket.connected);
      
      const sender =
        typeof message.sender === 'object'
          ? message.sender
          : null;

      const senderId = String(
        sender?._id ||
        sender?.id ||
        message.sender ||
        message.senderId ||
        ''
      );

      if (!senderId) return;

      const senderName =
        sender?.name ||
        sender?.fullName ||
        sender?.username ||
        'New message';

      const notification = {
        id: message._id,
        senderId,
        senderName,
        text: message.text,
        createdAt: message.createdAt
      };

      // Notification list update
      setNotifications(previous => [
        notification,
        ...previous
      ]);

      // Unread count update
      setUnreadCounts(previous => ({
        ...previous,
        [senderId]: (previous[senderId] || 0) + 1
      }));

      // Top popup
      setActiveNotification(notification);
    }

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      disconnectSocket();
    };
  }, []);

  // POPUP AUTOMATICALLY HIDE AFTER 5 SECONDS
  useEffect(() => {
    if (!activeNotification) return;

    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeNotification]);

  // OPEN CHAT AND CLEAR THAT USER'S UNREAD COUNT
  useEffect(() => {
    if (location.pathname !== '/messages') return;

    const params = new URLSearchParams(location.search);
    const userId = params.get('userId');

    if (userId) {
      setUnreadCounts(previous => ({
        ...previous,
        [userId]: 0
      }));
    }
  }, [location]);

  // OPEN CHAT FROM NOTIFICATION
  function openNotification(notification) {
    setActiveNotification(null);

    navigate(
      `/messages?userId=${notification.senderId}`
    );
  }

  const totalUnread = Object.values(unreadCounts).reduce(
    (total, count) => total + count,
    0
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        setNotifications,
        unreadCounts,
        setUnreadCounts,
        totalUnread
      }}
    >
      {children}

      {/* TOP MESSAGE NOTIFICATION */}
      {activeNotification && (
        <div
          onClick={() => openNotification(activeNotification)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            width: '320px',
            padding: '15px',
            background: '#ffffff',
            color: '#222222',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#e8e8e8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {activeNotification.senderName
              .charAt(0)
              .toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>
              {activeNotification.senderName}
            </strong>

            <p
              style={{
                margin: '5px 0 0',
                fontSize: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {activeNotification.text}
            </p>
          </div>

          <button
            onClick={event => {
              event.stopPropagation();
              setActiveNotification(null);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}