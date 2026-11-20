
import { useEffect, useState } from 'react';
import { Search, Heart, MessageCircle, X, Send, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './Explore.css';

const API = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

function Explore() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const imageUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${SERVER_URL}${url}`;
  };

  async function loadPosts() {
    try {
      const response = await fetch(`${API}/posts`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Posts are not load .');
      }

      setPosts(data.posts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const query = search.toLowerCase();
    return (
      (post.user?.name || '').toLowerCase().includes(query) ||
      (post.caption || '').toLowerCase().includes(query)
    );
  });

  async function handleLike(postId) {
    if (!token) {
      setError('login first.');
      return;
    }

    try {
      const response = await fetch(`${API}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No like.');
      }

      await loadPosts();

      setSelectedPost((current) =>
        current?._id === postId
          ? {
              ...current,
              likes: data.liked
                ? [...(current.likes || []), 'current-user']
                : (current.likes || []).slice(0, -1)
            }
          : current
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComment(event) {
    event.preventDefault();

    if (!selectedPost || !commentText.trim() || !token) return;

    try {
      const response = await fetch(
        `${API}/posts/${selectedPost._id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ text: commentText.trim() })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No 3Comment.');
      }

      setCommentText('');
      await loadPosts();

      const updated = await fetch(`${API}/posts`);
      const updatedData = await updated.json();
      const refreshedPost = updatedData.posts?.find(
        (post) => post._id === selectedPost._id
      );

      if (refreshedPost) setSelectedPost(refreshedPost);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="instagram-layout">
      <Sidebar />

      <main className="explore-page">
        <h2>Explore</h2>

        <div className="explore-search">
          <Search size={20} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people or captions..."
          />
        </div>

        {error && <p className="explore-error">{error}</p>}

        {loading ? (
          <p>Loading posts...</p>
        ) : filteredPosts.length === 0 ? (
          <p className="explore-empty">No posts found.</p>
        ) : (
          <div className="explore-grid">
            {filteredPosts.map((post) => (
              <button
                className="explore-grid-item"
                key={post._id}
                onClick={() => setSelectedPost(post)}
              >
                {imageUrl(post.imageUrl) ? (
                  <img src={imageUrl(post.imageUrl)} alt={post.caption || 'Post'} />
                ) : (
                  <div className="explore-no-image">No image</div>
                )}
                <span className="explore-hover">
                  <Heart size={20} fill="white" />
                  {post.likes?.length || post.likesCount || 0}
                  <MessageCircle size={20} />
                  {post.comments?.length || post.commentsCount || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      {selectedPost && (
        <div className="explore-modal-overlay" onClick={() => setSelectedPost(null)}>
          <button
            className="explore-close"
            onClick={() => setSelectedPost(null)}
            aria-label="Close"
          >
            <X size={28} />
          </button>

          <section
            className="explore-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="explore-modal-image">
              <img
                src={imageUrl(selectedPost.imageUrl)}
                alt={selectedPost.caption || 'Post'}
              />
            </div>

            <div className="explore-modal-details">
              <header className="explore-modal-header">
                {selectedPost.user?.profileImage ? (
                  <img
                    src={imageUrl(selectedPost.user.profileImage)}
                    alt={selectedPost.user.name}
                  />
                ) : (
                  <UserRound size={28} />
                )}
                <strong>{selectedPost.user?.name || 'User'}</strong>
              </header>

              <div className="explore-modal-caption">
                <strong>{selectedPost.user?.name || 'User'}</strong>{' '}
                {selectedPost.caption}
              </div>

              <div className="explore-modal-comments">
                {(selectedPost.comments || []).map((comment, index) => (
                  <p key={comment._id || index}>
                    <strong>{comment.user?.name || 'User'}</strong>{' '}
                    {comment.text}
                  </p>
                ))}
              </div>

              <div className="explore-modal-actions">
                <button onClick={() => handleLike(selectedPost._id)}>
                  <Heart size={25} />
                </button>
                <span>
                  {selectedPost.likesCount ?? selectedPost.likes?.length ?? 0} likes
                </span>
              </div>
 
              <form className="explore-comment-form" onSubmit={handleComment}>
                <input
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  placeholder="Add a comment..."
                />
                <button type="submit" disabled={!commentText.trim()}>
                  <Send size={20} />
                </button>
              </form>
            </div>
          </section>
        </div>                 
      )}
    </div>
  );
}

export default Explore; 