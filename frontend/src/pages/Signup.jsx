import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupApi } from '../services/authApi';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = await signupApi({
        name,
        email,
        password,
      });

      setMessage(data.message || 'Signup successful!');

      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      setMessage(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Signup</h1>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required/>

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : 'Sign up'}
          </button>
        </form>

        {message && <p className="message">{message}</p>}

        <div className="switch-form">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;