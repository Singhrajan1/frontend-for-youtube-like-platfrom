import React, { useState, useEffect, useCallback } from "react";
import { postApi } from "../api/post.api";
import { likeApi } from "../api/like.api";
import { commentApi } from "../api/comment.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PostSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Modal } from "../components/ui/Modal";
import { formatTimeAgo, getInitials } from "../utils/format";
import {
  MessageSquare,
  ThumbsUp,
  Image as ImageIcon,
  Send,
  Trash2,
  Edit2,
  X,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const CommunityPage = () => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Post State
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  // Post Likes State { [postId]: { count, liked } }
  const [postLikes, setPostLikes] = useState({});

  // Post Comments State { [postId]: { open: boolean, comments: [], loading: boolean, text: string } }
  const [postComments, setPostComments] = useState({});

  // Edit Post Modal State
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  // Delete Post State
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Fetch all posts
  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await postApi.getAllPosts();
      setPosts(Array.isArray(data) ? data : []);

      // Fetch like statuses for all posts
      (Array.isArray(data) ? data : []).forEach(async (post) => {
        try {
          const count = await likeApi.getPostLikesCount(post._id);
          let liked = false;
          if (isAuthenticated) {
            liked = await likeApi.isPostLiked(post._id);
          }
          setPostLikes((prev) => ({
            ...prev,
            [post._id]: { count, liked },
          }));
        } catch {}
      });
    } catch (err) {
      setError(err.message || "Failed to load community posts");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Handle New Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImage(file);
      setNewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setNewImage(null);
    if (newImagePreview) URL.revokeObjectURL(newImagePreview);
    setNewImagePreview(null);
  };

  // Create Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please sign in to post");
      navigate("/login");
      return;
    }
    if (!newContent.trim()) return;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", newContent.trim());
      if (newImage) {
        formData.append("image", newImage);
      }

      const created = await postApi.createPost(formData);
      const postWithUser = {
        ...created,
        owner: user,
      };

      setPosts((prev) => [postWithUser, ...prev]);
      setPostLikes((prev) => ({
        ...prev,
        [created._id]: { count: 0, liked: false },
      }));

      setNewContent("");
      handleClearImage();
      toast.success("Post published to community!");
    } catch (err) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  // Like Post
  const handleToggleLike = async (postId) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to like posts");
      navigate("/login");
      return;
    }

    const current = postLikes[postId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    setPostLikes((prev) => ({
      ...prev,
      [postId]: { count: nextCount, liked: nextLiked },
    }));

    try {
      const result = await likeApi.togglePostLike(postId);
      const actualCount = await likeApi.getPostLikesCount(postId);
      setPostLikes((prev) => ({
        ...prev,
        [postId]: { count: actualCount, liked: result?.liked },
      }));
    } catch (err) {
      setPostLikes((prev) => ({
        ...prev,
        [postId]: current,
      }));
      toast.error("Failed to update like");
    }
  };

  // Toggle Post Comments Accordion
  const handleToggleComments = async (postId) => {
    const current = postComments[postId] || {
      open: false,
      comments: [],
      loading: false,
      text: "",
    };

    if (current.open) {
      setPostComments((prev) => ({
        ...prev,
        [postId]: { ...current, open: false },
      }));
      return;
    }

    // Open & Load comments
    setPostComments((prev) => ({
      ...prev,
      [postId]: { ...current, open: true, loading: true },
    }));

    try {
      const data = await commentApi.getPostComments(postId, 1, 20);
      setPostComments((prev) => ({
        ...prev,
        [postId]: {
          ...current,
          open: true,
          loading: false,
          comments: data?.comments || [],
        },
      }));
    } catch (err) {
      setPostComments((prev) => ({
        ...prev,
        [postId]: { ...current, open: true, loading: false },
      }));
    }
  };

  // Add Comment on Post
  const handleAddPostComment = async (postId) => {
    const commentState = postComments[postId];
    if (!commentState?.text?.trim()) return;

    try {
      const created = await commentApi.createPostComment(
        postId,
        commentState.text.trim()
      );
      const newComment = {
        ...created,
        owner: user,
      };

      setPostComments((prev) => ({
        ...prev,
        [postId]: {
          ...commentState,
          text: "",
          comments: [newComment, ...(commentState.comments || [])],
        },
      }));
      toast.success("Comment added!");
    } catch (err) {
      toast.error(err.message || "Failed to add comment");
    }
  };

  // Delete Post
  const handleConfirmDeletePost = async () => {
    if (!deletingPostId) return;
    setIsDeletingPost(true);
    try {
      await postApi.deletePost(deletingPostId);
      setPosts((prev) => prev.filter((p) => p._id !== deletingPostId));
      setDeletingPostId(null);
      toast.success("Post deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete post");
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Save Edit Post
  const handleSaveEditPost = async (e) => {
    e.preventDefault();
    if (!editingPost || !editContent.trim()) return;

    setIsUpdatingPost(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent.trim());
      if (editImage) {
        formData.append("image", editImage);
      }

      const updated = await postApi.updatePost(editingPost._id, formData);
      setPosts((prev) =>
        prev.map((p) => (p._id === editingPost._id ? { ...p, ...updated } : p))
      );
      setEditingPost(null);
      toast.success("Post updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update post");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  return (
    <div className="community-page-container">
      <div className="community-content-wrapper">
        {/* Create Post Box */}
        {isAuthenticated ? (
          <div className="create-post-card glass-panel animate-fade-in">
            <div className="create-post-header">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="avatar avatar-sm"
                />
              ) : (
                <div className="avatar avatar-sm avatar-placeholder">
                  {getInitials(user?.username)}
                </div>
              )}
              <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                Share an update with your community
              </span>
            </div>

            <form onSubmit={handleCreatePost}>
              <textarea
                placeholder="What's happening? Share thoughts, announcements, or ask a question..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
                className="create-post-textarea"
                required
              />

              {/* Image Preview */}
              {newImagePreview && (
                <div className="post-preview-image-container">
                  <img
                    src={newImagePreview}
                    alt="Preview"
                    className="post-preview-image"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="post-preview-clear-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="create-post-actions-row">
                <label className="btn btn-secondary btn-sm upload-image-label">
                  <ImageIcon size={18} />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />
                </label>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newContent.trim() || isPosting}
                >
                  {isPosting ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="community-guest-banner glass-panel">
            <MessageSquare size={28} color="var(--accent-primary)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700 }}>Join the Discussion</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                Sign in to post updates, share pictures, and interact with creators.
              </p>
            </div>
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          </div>
        )}

        {/* Community Feed */}
        {error ? (
          <ErrorState
            title="Failed to load feed"
            message={error}
            onRetry={loadPosts}
          />
        ) : isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No community posts yet"
            description="Be the first to create a post and start a conversation with the community!"
          />
        ) : (
          <div className="community-feed-list">
            {posts.map((post) => {
              const isAuthor = user && user._id === (post.owner?._id || post.owner);
              const postLike = postLikes[post._id] || { count: 0, liked: false };
              const postCommentState = postComments[post._id] || {
                open: false,
                comments: [],
                loading: false,
                text: "",
              };

              return (
                <div key={post._id} className="community-post-card glass-panel">
                  {/* Post Header */}
                  <div className="post-header">
                    <Link
                      to={
                        post.owner?.username
                          ? `/channel/${post.owner.username}`
                          : "#"
                      }
                      className="post-author-link"
                    >
                      {post.owner?.avatar ? (
                        <img
                          src={post.owner.avatar}
                          alt={post.owner.username}
                          className="avatar avatar-md"
                        />
                      ) : (
                        <div className="avatar avatar-md avatar-placeholder">
                          {getInitials(post.owner?.username)}
                        </div>
                      )}
                    </Link>

                    <div className="post-header-info">
                      <Link
                        to={
                          post.owner?.username
                            ? `/channel/${post.owner.username}`
                            : "#"
                        }
                        className="post-author-name"
                      >
                        {post.owner?.fullname || post.owner?.username || "Creator"}
                      </Link>
                      <div className="post-header-meta">
                        <span>@{post.owner?.username}</span>
                        <span className="meta-dot">•</span>
                        <span>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>

                    {/* Author Tools */}
                    {isAuthor && (
                      <div className="post-header-tools">
                        <button
                          onClick={() => {
                            setEditingPost(post);
                            setEditContent(post.content);
                            setEditImage(null);
                            setEditImagePreview(post.image?.url || null);
                          }}
                          className="btn-icon btn-icon-sm btn-ghost"
                          title="Edit post"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingPostId(post._id)}
                          className="btn-icon btn-icon-sm btn-ghost"
                          style={{ color: "var(--status-error)" }}
                          title="Delete post"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <p className="post-content-text">{post.content}</p>

                  {/* Post Attached Image */}
                  {post.image?.url && (
                    <div className="post-image-wrapper">
                      <img
                        src={post.image.url}
                        alt="Post media"
                        className="post-image"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Action Bar: Like & Comments */}
                  <div className="post-actions-bar">
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      className={`post-action-btn ${postLike.liked ? "liked" : ""}`}
                    >
                      <ThumbsUp
                        size={18}
                        fill={postLike.liked ? "currentColor" : "none"}
                      />
                      <span>{postLike.count}</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(post._id)}
                      className="post-action-btn"
                    >
                      <MessageCircle size={18} />
                      <span>
                        {postCommentState.open ? "Hide Comments" : "Comments"}
                      </span>
                    </button>
                  </div>

                  {/* Expandable Comments Drawer */}
                  {postCommentState.open && (
                    <div className="post-comments-container animate-fade-in">
                      {/* Add comment on post */}
                      {isAuthenticated && (
                        <div className="post-add-comment-row">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={postCommentState.text || ""}
                            onChange={(e) =>
                              setPostComments((prev) => ({
                                ...prev,
                                [post._id]: {
                                  ...postCommentState,
                                  text: e.target.value,
                                },
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddPostComment(post._id);
                            }}
                            className="post-comment-input"
                          />
                          <button
                            onClick={() => handleAddPostComment(post._id)}
                            className="btn btn-primary btn-sm"
                            disabled={!postCommentState.text?.trim()}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}

                      {/* Comments List */}
                      {postCommentState.loading ? (
                        <div style={{ padding: "10px", textAlign: "center" }}>
                          <Loader2 className="animate-spin" size={18} />
                        </div>
                      ) : postCommentState.comments?.length === 0 ? (
                        <div className="no-post-comments-msg">
                          No comments on this post yet.
                        </div>
                      ) : (
                        <div className="post-comments-list">
                          {postCommentState.comments.map((cm) => (
                            <div key={cm._id} className="post-comment-item">
                              {cm.owner?.avatar ? (
                                <img
                                  src={cm.owner.avatar}
                                  alt={cm.owner.username}
                                  className="avatar avatar-xs"
                                />
                              ) : (
                                <div className="avatar avatar-xs avatar-placeholder">
                                  {getInitials(cm.owner?.username)}
                                </div>
                              )}
                              <div className="post-comment-bubble">
                                <div className="post-comment-author">
                                  @{cm.owner?.username}
                                </div>
                                <div className="post-comment-body">
                                  {cm.content}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Post Modal */}
      {deletingPostId && (
        <ConfirmModal
          isOpen={!!deletingPostId}
          onClose={() => setDeletingPostId(null)}
          onConfirm={handleConfirmDeletePost}
          title="Delete Post"
          message="Are you sure you want to delete this community post? This cannot be undone."
          isLoading={isDeletingPost}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <Modal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          title="Edit Post"
          footer={
            <>
              <button
                onClick={() => setEditingPost(null)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditPost}
                className="btn btn-primary btn-sm"
                disabled={!editContent.trim() || isUpdatingPost}
              >
                {isUpdatingPost ? "Saving..." : "Save Changes"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEditPost}>
            <div className="form-group">
              <label className="form-label">Post Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Optional Image Update */}
            <div className="form-group">
              <label className="form-label">Attached Image (optional)</label>
              {editImagePreview && (
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <img
                    src={editImagePreview}
                    alt="Edit preview"
                    style={{
                      maxHeight: "180px",
                      borderRadius: "var(--radius-md)",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditImage(null);
                      setEditImagePreview(null);
                    }}
                    className="post-preview-clear-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setEditImage(file);
                    setEditImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
