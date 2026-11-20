import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginApi } from '../services/authApi';
import { connectSocket } from '../socket';

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setLoading(true);

    try {
      // Login API call
      const data = await loginApi({
        email,
        password
      });

      if (data.token) {
        
        localStorage.setItem('token', data.token);

        connectSocket(data.token);

        setMessage('Login successful!');

        navigate('/Home', { replace: true });

      } else {
        setMessage('Token not received.');
      }

    } catch (error) {
      console.error('Login error:', error);
      setMessage(error.message || 'Login failed');

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1>Login</h1>

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Log in'}
          </button>

        </form>

        {message && (
          <p className="message">{message}</p>
        )}

        <div className="switch-form">
          Don't have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </div>

      </div>
    </div>
  );
}

export default Login;
