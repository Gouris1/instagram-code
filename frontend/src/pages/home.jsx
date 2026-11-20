import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Bookmark, MoreHorizontal, Send, Heart, PlusSquare, X, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './Home.css';

const API_URL = 'http://localhost:5000/api';
const stories = [
  {
    name: 'your_story',
    own: true
  }
];

function getLoggedInUserId() {
  try {
    const token = localStorage.getItem('token');

    if (!token) return null;

    const payload = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = JSON.parse(atob(payload));

    return decoded.id || decoded._id;
  } catch {
    return null;
  }
}

function Home() {
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  const [savedPosts, setSavedPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  


  const getImageUrl = (url) => {
    if (!url || typeof url !== 'string') return null;

    if (url.startsWith('http')) return url;

    return `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  // Check login
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Fetch all posts
  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Posts not loaded');
      }

      const loggedInUserId = getLoggedInUserId();

      const dbPosts = (data.posts || []).map((post) => ({
        id: post._id,
        username:
          post.user?.username ||
          post.user?.name ||
          post.user?.fullName ||
          'user',
        avatar: getImageUrl(
          post.user?.profileImage || post.user?.avatarUrl
        ),
        location: 'India',
        image: getImageUrl(post.imageUrl),
        caption: post.caption || '',
        likes: post.likesCount ?? post.likes?.length ?? 0,
        comments:
          post.commentsCount ?? post.comments?.length ?? 0,
        liked: (post.likes || []).some((like) => {
          const likeId =
            typeof like === 'object' ? like._id : like;

          return String(likeId) === String(loggedInUserId);
        })
      }));

      setPosts(dbPosts);
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggested users
 // Fetch suggested users
const fetchSuggestedUsers = async () => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const response = await fetch(`${API_URL}/users`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Suggested users not loaded');
    }

    setSuggestedUsers(data.users || []);

  } catch (error) {
    console.error('Suggested users error:', error);
  } finally {
    setSuggestionsLoading(false);
  }
};


// Follow / Unfollow user
const handleFollowToggle = async (user) => {
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const isFollowing = user.isFollowing;

    const response = await fetch(
      `${API_URL}/follow/${user._id}/follow`,
      {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Follow/Unfollow failed');
    }

    setSuggestedUsers((prevUsers) =>
      prevUsers.map((item) =>
        item._id === user._id
          ? { ...item, isFollowing: !isFollowing }
          : item
      )
    );

  } catch (error) {
    console.error('Follow/Unfollow error:', error);
    alert(error.message);
  }
};

  // Load posts and suggestions
  useEffect(() => {
    fetchPosts();
    fetchSuggestedUsers();
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  // Like / Unlike post
  const toggleLike = async (id) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(
        `${API_URL}/posts/${id}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Like failed');
      }

      await fetchPosts();
    } catch (error) {
      console.error('Like error:', error);
      alert(error.message);
    }
  };

  // Save / Unsave post
  const toggleSave = (id) => {
    setSavedPosts((current) =>
      current.includes(id)
        ? current.filter((postId) => postId !== id)
        : [...current, id]
    );
  };

  // Close create post modal
  const closeCreate = () => {
    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setShowCreate(false);
    setSelectedImage(null);
    setImagePreview('');
    setCaption('');
    setMessage('');
    setUploading(false);
  };

  // Select image
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Please select a valid image.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('Image size must be below 10 MB.');
      event.target.value = '';
      return;
    }

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedImage(file);
    setImagePreview(previewUrl);
    setMessage('');
  };

  // Create post
  const createPost = async () => {
    if (!selectedImage) {
      setMessage('Please choose an image.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setUploading(true);
      setMessage('');

      const formData = new FormData();

      formData.append('image', selectedImage);
      formData.append('caption', caption);

      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Post upload failed');
      }

      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }

      setShowCreate(false);
      setSelectedImage(null);
      setImagePreview('');
      setCaption('');
      setMessage('');

      await fetchPosts();
    } catch (error) {
      console.error('Create post error:', error);
      setMessage(error.message || 'Post upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Share post
  const sharePost = (post) => {
    if (navigator.share) {
      navigator.share({
        title: post.username,
        text: post.caption,
        url: post.image
      }).catch(() => {});
    } else if (navigator.clipboard && post.image) {
      navigator.clipboard.writeText(post.image)
        .then(() => alert('Image link copied.'))
        .catch(() => alert('Link could not be copied.'));
    }
  };

  return (
    <div className="instagram-layout">

      {/* Sidebar */}
      <div className="fixed-sidebar">
           <Sidebar onCreate={() => setShowCreate(true)} />
      </div>

      <div className="home-content">    
        <main className="insta-main">

          <section className="stories">
            {stories.map((story) => (
              <button
                className="story"
                key={story.name}
                onClick={() => setShowCreate(true)}
              >
                <div className="story-ring own-story">
                  <UserRound size={35} />
                  {story.own && (
                    <span className="story-plus">+</span>
                  )}
                </div>

                <span>{story.name}</span>
              </button>
            ))}
          </section>

          <section className="insta-feed">

            {loading ? (
              <p className="profile-message">
                Posts loading...
              </p>
            ) : posts.length === 0 ? (
              <p className="profile-message">
                No posts available. Create your first post!
              </p>
            ) : (
              posts.map((post) => (
                <article className="insta-post" key={post.id}>
                  <div className="post-header">
                    {post.avatar ? (
                      <img
                        className="post-avatar"
                        src={post.avatar}
                        alt={post.username}
                      />
                    ) : (
                      <UserRound size={35} />
                    )}

                    <div className="post-user-info">
                      <strong>{post.username}</strong>
                      <span>{post.location}</span>
                    </div>

                    <button
                      className="icon-button"
                      aria-label="More options"
                      onClick={() => alert('No post options available')}
                    >
                      <MoreHorizontal size={24} />
                    </button>

                  </div>
                  {post.image && (
                    <img
                      className="post-image"
                      src={post.image}
                      alt={post.caption || 'Instagram post'}
                    />
                  )}

                  <div className="post-actions">
                    <div className="post-actions-left">
                      <button
                        className={`icon-button ${
                          post.liked ? 'liked' : ''
                        }`}
                        aria-label="Like post"
                        onClick={() => toggleLike(post.id)}
                      >
                        <Heart
                          size={26}
                          fill={post.liked ? 'currentColor' : 'none'}
                        />
                      </button>

                      <button
                        className="icon-button"
                        aria-label="Comment"
                        onClick={() => alert('Comment feature coming soon')}
                      >
                        <MessageCircle size={26} />
                      </button>

                      <button
                        className="icon-button"
                        aria-label="Share"
                        onClick={() => sharePost(post)}
                      >
                        <Send size={25} />
                      </button>

                    </div>

                    <button
                      className={`icon-button ${
                        savedPosts.includes(post.id) ? 'saved' : ''
                      }`}
                      aria-label="Save post"
                      onClick={() => toggleSave(post.id)}
                    >
                      <Bookmark
                        size={25}
                        fill={
                          savedPosts.includes(post.id)
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  </div>

                  <div className="post-details">
                    <strong>
                      {post.likes.toLocaleString('en-IN')} likes
                    </strong>

                    <p>
                      <strong>{post.username}</strong>{' '}
                      {post.caption}
                    </p>

                    <button
                      className="view-comments"
                      onClick={() => alert('Comment feature coming soon')}
                    >
                      View all {post.comments} comments
                    </button>

                    <form
                      className="comment-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        alert('Comment feature coming soon');
                      }}
                    >
                      <input
                        placeholder="Add a comment..."
                        aria-label="Add a comment"
                      />
                    </form>
                  </div>
                </article>
              ))
            )}
          </section>
        </main>

        <aside className="suggestions-panel">
          <div className="suggestions-heading">
            <h3>Suggested for you</h3>
          </div>

          {suggestionsLoading ? (
            <p className="suggestions-message">
              Loading users...
            </p>
          ) : suggestedUsers.length === 0 ? (
            <p className="suggestions-message">
              No users available
            </p>
          ) : (
            <div className="suggestions-list">

              {suggestedUsers.map((user) => (
                <div
                  className="suggested-user"
                  key={user._id}
                >

                  <div className="suggested-user-info">

                    {getImageUrl(
                      user.profileImage || user.avatarUrl
                    ) ? (
                      <img
                        src={getImageUrl(
                          user.profileImage || user.avatarUrl
                        )}
                        alt={
                          user.username ||
                          user.name ||
                          user.fullName
                        }
                      />
                    ) : (
                      <div className="suggested-default-avatar">
                        <UserRound size={25} />
                      </div>
                    )}

                    <div className="suggested-user-details">
                      <strong>
                        {user.username ||
                          user.name ||
                          user.fullName ||
                          'User'}
                      </strong>
                      <p>Suggested for you</p>
                    </div>
                  </div>

                 <button
                   className="follow-button"
                   onClick={() => handleFollowToggle(user)}
                  >
                    {user.isFollowing ? 'Unfollow' : 'Follow'}
                 </button>
                </div>
              ))}
            </div>
          )}
          <p className="suggestions-footer">
            About · Help · Privacy · Terms
          </p>
        </aside>
      </div>
      {showCreate && (
        <div
          className="create-overlay"
          onClick={closeCreate}
        >
          <div
            className="create-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="create-modal-header">

              <button
                type="button"
                onClick={closeCreate}
                aria-label="Close"
              >
                <X size={24} />
              </button>
              <strong>Create new post</strong>

              <button
                className="top-share-button"
                type="button"
                onClick={createPost}
                disabled={!selectedImage || uploading}
              >
                {uploading ? 'Sharing...' : 'Share'}
              </button>
            </div>

            <div className="create-modal-body">
              {imagePreview ? (
                <div className="preview-container">
                  <img
                    src={imagePreview}
                    alt="Selected photo preview"
                    className="selected-image-preview"
                  />
                </div>
              ) : (
                <div className="empty-photo-area">
                  <PlusSquare size={58} strokeWidth={1.8} />
                  <h3>Create your post</h3>
                  <p>
                    Select a photo to share with your friends.
                  </p>
                </div>
              )}
              <label className="choose-image-button">
                {imagePreview ? 'Change Photo' : 'Choose Photo'}

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageChange}
                />
              </label>
              <textarea
                placeholder="Write a caption..."
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={2200}
              />

              {message && (
                <p className="create-error">{message}</p>
              )}

              <button
                type="button"
                className="share-post-button"
                onClick={createPost}
                disabled={!selectedImage || uploading}
              >
                {uploading ? 'Uploading...' : 'Share Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Home;
