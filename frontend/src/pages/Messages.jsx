import { useEffect, useState } from 'react';
import { Send, UserRound } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { socket } from '../socket';
import { useSocket } from '../SocketProvider';

import './Messages.css';

const API = 'http://localhost:5000/api';

function getCurrentUserId(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return String(
      decoded.id ||
      decoded._id ||
      decoded.userId ||
      decoded.sub ||
      decoded.user?.id ||
      decoded.user?._id ||
      ''
    );
  } catch (error) {
    console.error('Token decode error:', error);
    return '';
  }
}

function getSenderId(message) {
  const sender =
    message.sender ||
    message.senderId ||
    message.from;
  if (typeof sender === 'object' && sender !== null) {
    return String(sender._id || sender.id || '');
  }
  return String(sender || '');
}

function getUserName(user) {
  return (
    user?.name ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    'User'
  );
}

function Messages() {
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('token');
  const currentUserId = token ? getCurrentUserId(token) : '';
  const { setUnreadCounts } = useSocket();

  // LOAD ALL USERS
  useEffect(() => {
    async function loadUsers() {
      try {
        const response = await fetch(`${API}/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Users are not load.');
        }

        setUsers(
          (data.users || []).filter(
            user => String(user._id) !== currentUserId
          )
        );

      } catch (err) {
        setError(err.message);
      }
    }

    if (token) {
      loadUsers();
    } else {
      setError('Please login.');
    }
  }, [token, currentUserId]);
  async function loadConversations() {
    try {
      const response = await fetch(`${API}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Conversations load nahi hui.'
        );
      }

      setConversations(data.conversations || []);
      const counts = {};

      (data.conversations || []).forEach(conversation => {
        if (conversation.unreadCount > 0) {
          counts[String(conversation.user._id)] =
            conversation.unreadCount;
        }
      });

      setUnreadCounts(counts);

    } catch (err) {
      console.error('Conversation error:', err);
    }
  }


  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);

  useEffect(() => {
    const userId = searchParams.get('userId');

    if (userId && users.length > 0) {
      const user = users.find(
        item => String(item._id) === String(userId)
      );
      if (user) {
        setSelectedUser(user);
      }
    }
  }, [searchParams, users]);

  async function markMessagesRead(userId) {
    try {
      const response = await fetch(
        `${API}/messages/${userId}/read`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Read status are not update.');
      }

      setConversations(previous =>
        previous.map(conversation =>
          String(conversation.user._id) === String(userId)
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );

      setUnreadCounts(previous => ({
        ...previous,
        [String(userId)]: 0
      }));

    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  useEffect(() => {
    if (!selectedUser || !token) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    async function loadMessages() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${API}/messages/${selectedUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Messages are not load.');
        }

        if (!cancelled) {
          setMessages(data.messages || []);
          await markMessagesRead(selectedUser._id);
          await loadConversations();
        }

      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedUser, token]);

  useEffect(() => {
    async function handleReceiveMessage(newMessage) {
      const senderId = getSenderId(newMessage);
      if (!senderId) return;
      setConversations(previous => {
        const existing = previous.find(
          item => String(item.user._id) === senderId
        );
        if (!existing) {
          return previous;
        }
        return previous.map(item => {
          if (String(item.user._id) !== senderId) {
            return item;
          }
          return {
            ...item,
            lastMessage: newMessage,
            unreadCount:
              selectedUser &&
              String(selectedUser._id) === senderId
                ? 0
                : (item.unreadCount || 0) + 1
          };
        });
      });
      if (
        selectedUser &&
        String(selectedUser._id) === senderId
      ) {
        setMessages(previous => {
          const exists = previous.some(
            item => String(item._id) === String(newMessage._id)
          );
          return exists ? previous : [...previous, newMessage];
        });
        await markMessagesRead(senderId);
      }
      await loadConversations();
    }
    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [selectedUser, token]);
  async function sendMessage(event) {
    event.preventDefault();
    if (!selectedUser || !text.trim()) return;
    try {
      const messageText = text.trim();
      const response = await fetch(`${API}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser._id,
          text: messageText
        })
      });
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Message send nahi hua.');
      }
      const newMessage = data.data || data.message;
      if (newMessage && typeof newMessage === 'object') {
        setMessages(previous => {
          const exists = previous.some(
            item => String(item._id) === String(newMessage._id)
          );
          return exists ? previous : [...previous, newMessage];
        });
      }
      setText('');
      setError('');
      await loadConversations();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatTime(date) {
    if (!date) return '';
    const messageDate = new Date(date);
    if (Number.isNaN(messageDate.getTime())) return '';
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  const sortedUsers = [...users].sort((a, b) => {
    const conversationA = conversations.find(
      item => String(item.user._id) === String(a._id)
    );

    const conversationB = conversations.find(
      item => String(item.user._id) === String(b._id)
    );

    const timeA = conversationA?.lastMessage?.createdAt
      ? new Date(conversationA.lastMessage.createdAt).getTime()
      : 0;

    const timeB = conversationB?.lastMessage?.createdAt
      ? new Date(conversationB.lastMessage.createdAt).getTime()
      : 0;

    return timeB - timeA;
  });

  return (
    <div className="instagram-layout">
      <Sidebar />
      <main className="messages-page">
        <h2>Messages</h2>
        <div className="messages-container">
          <section className="messages-users">
            <h3>Messages</h3>
            {sortedUsers.map(user => {
              const conversation = conversations.find(
                item => String(item.user._id) === String(user._id)
              );
              const unreadCount = conversation?.unreadCount || 0;
              return (
                <button
                  key={user._id}
                  type="button"
                  className={`message-user ${
                    selectedUser?._id === user._id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <UserRound size={26} />
                  <div className="message-user-info">
                    <strong>{getUserName(user)}</strong>
                    <small>
                      {conversation?.lastMessage?.text ||
                        'Start a conversation'}
                    </small>
                  </div>
                  <div className="message-user-right">
                    {conversation?.lastMessage?.createdAt && (
                      <small className="chat-list-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </small>
                    )}
                    {unreadCount > 0 && (
                      <span className="unread-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            {users.length === 0 && (
              <p>No other users found.</p>
            )}
          </section>
          <section className="chat-window">
            {selectedUser ? (
              <>
                <header className="chat-header">
                  <UserRound size={25} />
                  <strong>{getUserName(selectedUser)}</strong>
                </header>
                <div className="chat-messages">
                  {loading && <p>Loading messages...</p>}
                  {!loading && messages.length === 0 && (
                    <p className="no-messages">
                      No messages yet. Start a conversation!
                    </p>
                  )}
                  {messages.map(message => {
                    const senderId = getSenderId(message);
                    const isSent =
                      currentUserId &&
                      senderId === currentUserId;
                    return (
                      <div
                        key={message._id}
                        className={`chat-message-row ${
                          isSent ? 'sent-row' : 'received-row'
                        }`}
                      >
                        <div
                          className={`chat-bubble ${
                            isSent ? 'sent' : 'received'
                          }`}
                        >
                          <p>{message.text}</p>
                          <span className="message-time">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form
                  className="chat-input"
                  onSubmit={sendMessage}
                >
                  <input
                    type="text"
                    value={text}
                    onChange={event => setText(event.target.value)}
                    placeholder="Message..."
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                  >
                    <Send size={20} />
                  </button>
                </form>
              </>
            ) : (
              <div className="empty-chat">
                <Send size={40} />
                <h3>Your messages</h3>
                <p>Select a user to start chatting.</p>
              </div>
            )}
          </section>
        </div>
        {error && (
          <p className="message-error">{error}</p>
        )}
      </main>
    </div>
  );
}

export default Messages;