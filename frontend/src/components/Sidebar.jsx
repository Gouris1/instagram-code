
import {
  Home,
  Search,
  Compass,
  Clapperboard,
  Send,
  Heart,
  PlusSquare,
  Menu,
  Camera,
  LogOut,
  UserRound
} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../SocketProvider';
import './Sidebar.css';

function Sidebar({ onCreate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const { totalUnread } = useSocket();

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/Home' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    { label: 'Reels', icon: Clapperboard },
    { label: 'Messages', icon: Send, path: '/messages' },
    { label: 'Notifications', icon: Heart, path: '/notifications' }
  ];

  return (
    <aside className="insta-sidebar">

      <div className="insta-logo">
        <Camera size={30} />
        <span>Instagram</span>
      </div>

      <nav className="insta-navigation">

        {navItems.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            className={`insta-nav-item ${
              path &&
              location.pathname.toLowerCase() === path.toLowerCase()
                ? 'active'
                : ''
            }`}
            onClick={() => {
              if (path) {
                navigate(path);
              } else {
                alert(`${label} feature not add.`);
              }
            }}
          >

            <span className="sidebar-icon-wrapper">
              <Icon size={25} strokeWidth={1.8} />

              {label === 'Messages' && totalUnread > 0 && (
                <span className="sidebar-unread-badge">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
            </span>

            <span>{label}</span>

          </button>
        ))}

        <button
          className="insta-nav-item"
          onClick={() => onCreate ? onCreate() : navigate('/Home')}
        >
          <PlusSquare size={25} />
          <span>Create</span>
        </button>

        <button
          className={`insta-nav-item ${
            location.pathname === '/profile' ? 'active' : ''
          }`}
          onClick={() => navigate('/profile')}
        >
          <UserRound size={25} />
          <span>Profile</span>
        </button>

        <button
          className="insta-nav-item logout-item"
          onClick={logout}
        >
          <LogOut size={24} />
          <span>Logout</span>
        </button>

      </nav>

      <button
        className="insta-nav-item more-item"
        onClick={() => alert('More options')}
      >
        <Menu size={25} />
        <span>More</span>
      </button>

    </aside>
  );
}

export default Sidebar;