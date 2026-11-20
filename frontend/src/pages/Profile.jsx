
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Grid3X3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './Home.css';
import './Profile.css';

const API = 'http://localhost:5000/api';

function getUserId(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    return (
      payload.id ||
      payload._id ||
      payload.userId ||
      payload.sub ||
      payload.user?.id ||
      payload.user?._id
    );
  } catch {
    return null;
  }
}

function Profile() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('your_username');
  const [avatar, setAvatar] = useState('');
  const [posts, setPosts] = useState([]);

  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          navigate('/login', { replace: true });
          return;
        }

        const userId = getUserId(token);

        if (!userId) {
          throw new Error('Login user ID nahi mili.');
        }

        // 1. FETCH USER PROFILE DETAILS
        const profileResponse = await fetch(
          `${API}/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const profileData = await profileResponse.json();

        if (!profileResponse.ok || !profileData.success) {
          throw new Error(
            profileData.message || 'Profile details load nahi hui.'
          );
        }

        const user = profileData.user;

        setUsername(user.name || 'User');
        setAvatar(user.profileImage || '');

        setFollowersCount(user.followersCount || 0);
        setFollowingCount(user.followingCount || 0);

        // 2. FETCH MY POSTS
        const postsResponse = await fetch(
          `${API}/posts/my-posts`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const postsData = await postsResponse.json();

        if (!postsResponse.ok || !postsData.success) {
          throw new Error(
            postsData.message || 'Profile posts load nahi hui.'
          );
        }

        setPosts(postsData.posts || []);

      } catch (err) {
        console.error('Profile error:', err);
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';

    return imageUrl.startsWith('http')
      ? imageUrl
      : `http://localhost:5000${imageUrl}`;
  };

  return (
    <div className="instagram-layout">

      <Sidebar />

      <main className="insta-main profile-main">

        {/* PROFILE HEADER */}
        <section className="profile-header">

          <div className="profile-avatar">

            {avatar ? (
              <img
                src={getImageUrl(avatar)}
                alt="Profile"
              />
            ) : (
              <UserRound size={55} strokeWidth={1.5} />
            )}

          </div>

          <div className="profile-info">

            <h2>{username}</h2>

            {/* PROFILE COUNTS */}
            <div className="profile-stats">

              <div>
                <strong>{posts.length}</strong>
                <span>Posts</span>
              </div>

              <div>
                <strong>{followersCount}</strong>
                <span>Followers</span>
              </div>

              <div>
                <strong>{followingCount}</strong>
                <span>Following</span>
              </div>

            </div>

          </div>

        </section>


        {/* POSTS SECTION */}
        <section className="profile-posts-section">

          <div className="profile-tabs">
            <Grid3X3 size={22} />
            <strong>Posts</strong>
          </div>

          {loading ? (
            <p className="profile-message">
              Loading profile...
            </p>
          ) : error ? (
            <div className="empty-profile">
              <h3>Profile load nahi hui</h3>
              <p>{error}</p>

              <button
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="empty-profile">
              <h3>No posts yet</h3>
              <p>Your uploaded photos will appear here.</p>

              <button
                onClick={() => navigate('/Home')}
              >
                Share your first photo
              </button>
            </div>
          ) : (
            <div className="profile-posts-grid">

              {posts.map(post => (
                <div
                  className="profile-post"
                  key={post._id}
                >
                  <img
                    src={getImageUrl(post.imageUrl)}
                    alt={post.caption || 'My post'}
                  />
                </div>
              ))}

            </div>
          )}

        </section>

      </main>

    </div>
  );
}

export default Profile;
