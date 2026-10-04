import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { videoApi } from "../api/video.api";
import { likeApi } from "../api/like.api";
import { subscriptionApi } from "../api/subscription.api";
import { commentApi } from "../api/comment.api";
import { authApi } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { VideoPlayer } from "../components/video/VideoPlayer";
import { SaveToPlaylistModal } from "../components/playlist/SaveToPlaylistModal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { ErrorState } from "../components/ui/ErrorState";
import { CommentSkeleton } from "../components/ui/Skeleton";
import {
  formatDuration,
  formatViews,
  formatTimeAgo,
  formatDate,
  formatSubscribers,
  getInitials,
} from "../utils/format";
import {
  ThumbsUp,
  Share2,
  ListPlus,
  Trash2,
  Edit2,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const WatchPage = () => {
  const { videoId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Video State
  const [video, setVideo] = useState(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Like State
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Subscription State
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);

  // Comment Likes & Edit States
  const [commentLikes, setCommentLikes] = useState({}); // { [commentId]: { liked, count } }
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [deleteCommentId, setDeleteCommentId] = useState(null);

  // Related Videos State
  const [relatedVideos, setRelatedVideos] = useState([]);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isDeleteVideoModalOpen, setIsDeleteVideoModalOpen] = useState(false);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  const owner = video?.owner || {};
  const isVideoOwner = user && (user._id === owner._id || user._id === video?.owner);

  // Fetch video details and record watch history
  const loadVideo = useCallback(async () => {
    setIsLoadingVideo(true);
    setVideoError(null);
    try {
      const data = await videoApi.getVideoById(videoId);
      setVideo(data);

      // Record to watch history if authenticated
      if (isAuthenticated) {
        authApi.addToWatchHistory(videoId).catch(() => {});
      }

      // Fetch like count
      likeApi
        .getVideoLikesCount(videoId)
        .then(setLikeCount)
        .catch(() => {});

      // Fetch like status if logged in
      if (isAuthenticated) {
        likeApi
          .isVideoLiked(videoId)
          .then(setIsLiked)
          .catch(() => {});
      }

      // Fetch channel profile / subscriber count
      if (data.owner?._id) {
        subscriptionApi
          .getChannelSubscribers(data.owner._id)
          .then((subData) => {
            const count = Array.isArray(subData) ? subData.length : Number(subData) || 0;
            setSubscriberCount(count);
          })
          .catch(() => {});

        if (isAuthenticated && data.owner?.username) {
          authApi
            .getChannelProfile(data.owner.username)
            .then((prof) => {
              if (prof) setIsSubscribed(!!prof.isSubscribed);
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      setVideoError(err.message || "Failed to load video details.");
    } finally {
      setIsLoadingVideo(false);
    }
  }, [videoId, isAuthenticated]);

  // Fetch comments
  const loadComments = useCallback(
    async (page = 1) => {
      if (page === 1) setIsLoadingComments(true);
      try {
        const data = await commentApi.getVideoComments(videoId, page, 10);
        const fetched = data?.comments || [];
        if (page === 1) {
          setComments(fetched);
        } else {
          setComments((prev) => [...prev, ...fetched]);
        }
        setHasMoreComments(fetched.length === 10);
        setCommentsPage(page);

        // Fetch like statuses and counts for comments
        fetched.forEach(async (c) => {
          try {
            const count = await likeApi.getCommentLikesCount(c._id);
            let liked = false;
            if (isAuthenticated) {
              liked = await likeApi.isCommentLiked(c._id);
            }
            setCommentLikes((prev) => ({
              ...prev,
              [c._id]: { count, liked },
            }));
          } catch {}
        });
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [videoId, isAuthenticated]
  );

  // Fetch related videos
  useEffect(() => {
    videoApi
      .getAllVideos({ limit: 12, sortBy: "views" })
      .then((data) => {
        setRelatedVideos((data?.videos || []).filter((v) => v._id !== videoId));
      })
      .catch(() => {});
  }, [videoId]);

  useEffect(() => {
    loadVideo();
    loadComments(1);
    window.scrollTo(0, 0);
  }, [loadVideo, loadComments]);

  // Handle Video Like Toggle
  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to like videos");
      navigate("/login");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const result = await likeApi.toggleVideoLike(videoId);
      setIsLiked(result?.liked);
      const updatedCount = await likeApi.getVideoLikesCount(videoId);
      setLikeCount(updatedCount);
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error(err.message || "Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Subscription Toggle
  const handleToggleSubscription = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to subscribe to channels");
      navigate("/login");
      return;
    }
    if (!owner._id || isVideoOwner || isSubscribing) return;

    setIsSubscribing(true);
    const prevSubscribed = isSubscribed;
    const prevCount = subscriberCount;
    setIsSubscribed(!prevSubscribed);
    setSubscriberCount(prevSubscribed ? prevCount - 1 : prevCount + 1);

    try {
      const result = await subscriptionApi.toggleSubscription(owner._id);
      setIsSubscribed(result?.subscribed);
      toast.success(
        result?.subscribed
          ? `Subscribed to ${owner.fullname || owner.username}!`
          : `Unsubscribed from ${owner.fullname || owner.username}`
      );
    } catch (err) {
      setIsSubscribed(prevSubscribed);
      setSubscriberCount(prevCount);
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setIsSubscribing(false);
    }
  };

  // Handle Share Video
  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success("Video link copied to clipboard!"))
      .catch(() => toast.error("Could not copy link"));
  };

  // Handle Delete Video
  const handleDeleteVideo = async () => {
    setIsDeletingVideo(true);
    try {
      await videoApi.deleteVideo(videoId);
      toast.success("Video deleted successfully");
      setIsDeleteVideoModalOpen(false);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Failed to delete video");
    } finally {
      setIsDeletingVideo(false);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please sign in to comment");
      navigate("/login");
      return;
    }
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const created = await commentApi.createVideoComment(videoId, commentText.trim());
      // Populate with current user avatar/username for instant display
      const newComment = {
        ...created,
        owner: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [newComment, ...prev]);
      setCommentLikes((prev) => ({
        ...prev,
        [newComment._id]: { count: 0, liked: false },
      }));
      setCommentText("");
      toast.success("Comment posted!");
    } catch (err) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Comment Like Toggle
  const handleToggleCommentLike = async (commentId) => {
    if (!isAuthenticated) {
      toast.info("Please sign in to like comments");
      navigate("/login");
      return;
    }
    const current = commentLikes[commentId] || { count: 0, liked: false };
    const nextLiked = !current.liked;
    const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);

    setCommentLikes((prev) => ({
      ...prev,
      [commentId]: { count: nextCount, liked: nextLiked },
    }));

    try {
      const result = await likeApi.toggleCommentLike(commentId);
      const actualCount = await likeApi.getCommentLikesCount(commentId);
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: { count: actualCount, liked: result?.liked },
      }));
    } catch (err) {
      // Revert on error
      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: current,
      }));
      toast.error("Failed to like comment");
    }
  };

  // Handle Save Edited Comment
  const handleSaveCommentEdit = async (commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      await commentApi.updateComment(commentId, editingCommentText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId ? { ...c, content: editingCommentText.trim() } : c
        )
      );
      setEditingCommentId(null);
      setEditingCommentText("");
      toast.success("Comment updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update comment");
    }
  };

  // Handle Delete Comment
  const handleConfirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    try {
      await commentApi.deleteComment(deleteCommentId);
      setComments((prev) => prev.filter((c) => c._id !== deleteCommentId));
      setDeleteCommentId(null);
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  if (videoError) {
    return (
      <ErrorState
        title="Video unavailable"
        message={videoError}
        onRetry={loadVideo}
      />
    );
  }

  if (isLoadingVideo || !video) {
    return (
      <div className="watch-page-container">
        <div className="skeleton" style={{ width: "100%", aspectRatio: "16/9", borderRadius: "var(--radius-xl)" }} />
        <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="skeleton" style={{ height: "28px", width: "70%" }} />
          <div className="skeleton" style={{ height: "20px", width: "40%" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="watch-page-container">
      {/* Primary Video Column */}
      <div className="watch-main-column">
        {/* Custom Video Player */}
        <VideoPlayer
          src={video.videoFile}
          poster={video.thumbnail}
          title={video.title}
        />

        {/* Video Title */}
        <h1 className="watch-video-title">{video.title}</h1>

        {/* Actions & Creator Bar */}
        <div className="watch-action-bar">
          {/* Creator Profile */}
          <div className="watch-creator-info">
            <Link
              to={owner.username ? `/channel/${owner.username}` : "#"}
              className="watch-creator-avatar"
            >
              {owner.avatar ? (
                <img
                  src={owner.avatar}
                  alt={owner.username}
                  className="avatar avatar-md"
                />
              ) : (
                <div className="avatar avatar-md avatar-placeholder">
                  {getInitials(owner.fullname || owner.username)}
                </div>
              )}
            </Link>

            <div className="watch-creator-meta">
              <Link
                to={owner.username ? `/channel/${owner.username}` : "#"}
                className="watch-creator-name"
              >
                {owner.fullname || owner.username || "Creator"}
              </Link>
              <span className="watch-subscriber-count">
                {formatSubscribers(subscriberCount)}
              </span>
            </div>

            {/* Subscribe Button (if not video owner) */}
            {!isVideoOwner && (
              <button
                onClick={handleToggleSubscription}
                className={`btn btn-sm ${
                  isSubscribed ? "btn-secondary" : "btn-primary"
                }`}
                disabled={isSubscribing}
              >
                {isSubscribed ? "Subscribed" : "Subscribe"}
              </button>
            )}
          </div>

          {/* Video Interaction Buttons */}
          <div className="watch-buttons-group">
            {/* Like Button */}
            <button
              onClick={handleToggleLike}
              className={`btn btn-secondary btn-sm ${isLiked ? "active-like-btn" : ""}`}
              disabled={isLiking}
            >
              <ThumbsUp
                size={18}
                fill={isLiked ? "var(--accent-primary)" : "none"}
                color={isLiked ? "var(--accent-primary)" : "currentColor"}
              />
              <span>{likeCount}</span>
            </button>

            {/* Save to Playlist */}
            <button
              onClick={() => setIsPlaylistModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              <ListPlus size={18} />
              <span>Save</span>
            </button>

            {/* Share */}
            <button onClick={handleShare} className="btn btn-secondary btn-sm">
              <Share2 size={18} />
              <span>Share</span>
            </button>

            {/* Delete (if owner) */}
            {isVideoOwner && (
              <button
                onClick={() => setIsDeleteVideoModalOpen(true)}
                className="btn btn-danger btn-sm"
                title="Delete this video"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Video Description Box */}
        <div className="watch-description-box glass-panel">
          <div className="watch-stats-line">
            <span style={{ fontWeight: 700 }}>{formatViews(video.views)}</span>
            <span className="meta-dot">•</span>
            <span>Uploaded on {formatDate(video.createdAt)}</span>
          </div>

          <p
            className={`watch-description-text ${
              isDescExpanded ? "expanded" : "collapsed"
            }`}
          >
            {video.description || "No description provided for this video."}
          </p>

          {video.description?.length > 150 && (
            <button
              onClick={() => setIsDescExpanded((prev) => !prev)}
              className="btn-ghost btn-sm watch-expand-btn"
            >
              {isDescExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  <span>Show more</span>
                  <ChevronDown size={16} />
                </>
              )}
            </button>
          )}
        </div>

        {/* Comments Section */}
        <div className="watch-comments-section">
          <div className="comments-header">
            <h3>{comments.length} Comments</h3>
          </div>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="add-comment-form">
            <div className="comment-input-avatar">
              {isAuthenticated && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="avatar avatar-sm"
                />
              ) : (
                <div className="avatar avatar-sm avatar-placeholder">
                  {isAuthenticated ? getInitials(user?.username) : "?"}
                </div>
              )}
            </div>

            <div className="comment-input-wrapper">
              <textarea
                placeholder={
                  isAuthenticated
                    ? "Add a public comment..."
                    : "Sign in to join the discussion..."
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!isAuthenticated || isSubmittingComment}
                rows={2}
                className="comment-textarea"
              />
              <div className="comment-form-actions">
                {commentText.trim() && (
                  <button
                    type="button"
                    onClick={() => setCommentText("")}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!commentText.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                  <span>Comment</span>
                </button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <div style={{ marginTop: "16px" }}>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          ) : comments.length === 0 ? (
            <div className="no-comments-msg">
              No comments yet. Be the first to share what you think!
            </div>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => {
                const isCommentAuthor = user && user._id === comment.owner?._id;
                const cLike = commentLikes[comment._id] || { count: 0, liked: false };
                const isEditing = editingCommentId === comment._id;

                return (
                  <div key={comment._id} className="comment-item">
                    <Link
                      to={
                        comment.owner?.username
                          ? `/channel/${comment.owner.username}`
                          : "#"
                      }
                      className="comment-avatar-link"
                    >
                      {comment.owner?.avatar ? (
                        <img
                          src={comment.owner.avatar}
                          alt={comment.owner.username}
                          className="avatar avatar-sm"
                        />
                      ) : (
                        <div className="avatar avatar-sm avatar-placeholder">
                          {getInitials(comment.owner?.username)}
                        </div>
                      )}
                    </Link>

                    <div className="comment-body">
                      <div className="comment-author-line">
                        <Link
                          to={
                            comment.owner?.username
                              ? `/channel/${comment.owner.username}`
                              : "#"
                          }
                          className="comment-author-name"
                        >
                          @{comment.owner?.username || "user"}
                        </Link>
                        <span className="comment-date">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="comment-edit-box">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="comment-textarea"
                            rows={2}
                          />
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <button
                              onClick={() => setEditingCommentId(null)}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveCommentEdit(comment._id)}
                              className="btn btn-primary btn-sm"
                              disabled={!editingCommentText.trim()}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="comment-text">{comment.content}</p>
                      )}

                      {/* Comment Actions: Like & Edit/Delete */}
                      <div className="comment-actions-bar">
                        <button
                          onClick={() => handleToggleCommentLike(comment._id)}
                          className={`comment-like-btn ${cLike.liked ? "liked" : ""}`}
                          aria-label="Like comment"
                        >
                          <ThumbsUp size={14} fill={cLike.liked ? "currentColor" : "none"} />
                          <span>{cLike.count > 0 ? cLike.count : ""}</span>
                        </button>

                        {isCommentAuthor && !isEditing && (
                          <>
                            <button
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditingCommentText(comment.content);
                              }}
                              className="comment-tool-btn"
                              title="Edit comment"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteCommentId(comment._id)}
                              className="comment-tool-btn delete"
                              title="Delete comment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMoreComments && (
                <div style={{ textAlign: "center", marginTop: "16px" }}>
                  <button
                    onClick={() => loadComments(commentsPage + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Load More Comments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Secondary Sidebar Column: Up Next / Related Videos */}
      <div className="watch-sidebar-column">
        <h3 className="related-videos-title">Up Next</h3>
        <div className="related-videos-list">
          {relatedVideos.map((rVideo) => (
            <Link
              key={rVideo._id}
              to={`/watch/${rVideo._id}`}
              className="related-video-card"
            >
              <div className="related-thumbnail-wrapper">
                <img
                  src={rVideo.thumbnail}
                  alt={rVideo.title}
                  className="related-thumbnail"
                  loading="lazy"
                />
                {rVideo.duration > 0 && (
                  <div className="video-duration-badge badge badge-dark">
                    {formatDuration(rVideo.duration)}
                  </div>
                )}
              </div>
              <div className="related-info">
                <h4 className="related-title">{rVideo.title}</h4>
                <div className="related-channel">
                  {rVideo.owner?.fullname || rVideo.owner?.username || "Creator"}
                </div>
                <div className="related-meta">
                  <span>{formatViews(rVideo.views)}</span>
                  <span className="meta-dot">•</span>
                  <span>{formatTimeAgo(rVideo.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Save to Playlist Modal */}
      {isPlaylistModalOpen && (
        <SaveToPlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          videoId={videoId}
        />
      )}

      {/* Delete Video Confirmation Modal */}
      {isDeleteVideoModalOpen && (
        <ConfirmModal
          isOpen={isDeleteVideoModalOpen}
          onClose={() => setIsDeleteVideoModalOpen(false)}
          onConfirm={handleDeleteVideo}
          title="Delete Video"
          message="Are you sure you want to permanently delete this video? All likes, comments, and views will be removed."
          isLoading={isDeletingVideo}
        />
      )}

      {/* Delete Comment Confirmation Modal */}
      {deleteCommentId && (
        <ConfirmModal
          isOpen={!!deleteCommentId}
          onClose={() => setDeleteCommentId(null)}
          onConfirm={handleConfirmDeleteComment}
          title="Delete Comment"
          message="Are you sure you want to delete this comment?"
        />
      )}
    </div>
  );
};
