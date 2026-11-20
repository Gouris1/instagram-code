import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Explore from './pages/Explore';

import { SocketProvider } from './SocketProvider';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/explore" element={<Explore />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;