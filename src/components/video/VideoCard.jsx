import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { formatDuration, formatViews, formatTimeAgo, getInitials } from "../../utils/format";
import { SaveToPlaylistModal } from "../playlist/SaveToPlaylistModal";
import { ConfirmModal } from "../ui/ConfirmModal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { videoApi } from "../../api/video.api";
import { MoreVertical, ListPlus, Share2, Trash2 } from "lucide-react";

export const VideoCard = ({ video, onDelete }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);

  const owner = video?.owner || {};
  const isOwner = user && (user._id === owner._id || user._id === video?.owner);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShare = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const url = `${window.location.origin}/watch/${video._id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Video link copied to clipboard!"))
      .catch(() => toast.error("Could not copy link"));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await videoApi.deleteVideo(video._id);
      toast.success("Video deleted successfully");
      setIsDeleteModalOpen(false);
      if (onDelete) onDelete(video._id);
    } catch (err) {
      toast.error(err.message || "Failed to delete video");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="video-card">
        {/* Thumbnail & Duration */}
        <Link to={`/watch/${video._id}`} className="video-thumbnail-wrapper">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="video-thumbnail"
            loading="lazy"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
            }}
          />
          {video.duration > 0 && (
            <div className="video-duration-badge badge badge-dark">
              {formatDuration(video.duration)}
            </div>
          )}
        </Link>

        {/* Video Info */}
        <div className="video-info">
          {/* Channel Avatar */}
          <Link
            to={owner.username ? `/channel/${owner.username}` : "#"}
            className="video-channel-avatar"
            title={owner.fullname || owner.username}
          >
            {owner.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.fullname || owner.username}
                className="avatar avatar-sm"
              />
            ) : (
              <div className="avatar avatar-sm avatar-placeholder">
                {getInitials(owner.fullname || owner.username)}
              </div>
            )}
          </Link>

          {/* Title & Metadata */}
          <div className="video-details">
            <Link
              to={`/watch/${video._id}`}
              className="video-title"
              title={video.title}
            >
              {video.title}
            </Link>

            <Link
              to={owner.username ? `/channel/${owner.username}` : "#"}
              className="video-channel-name"
            >
              {owner.fullname || owner.username || "Creator"}
            </Link>

            <div className="video-meta">
              <span>{formatViews(video.views)}</span>
              <span className="meta-dot">•</span>
              <span>{formatTimeAgo(video.createdAt)}</span>
            </div>
          </div>

          {/* Action Menu Button */}
          <div className="video-action-menu" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="btn-icon btn-icon-sm btn-ghost"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div className="video-menu-dropdown glass-panel animate-fade-in">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsPlaylistModalOpen(true);
                  }}
                  className="dropdown-menu-item"
                >
                  <ListPlus size={16} />
                  <span>Save to Playlist</span>
                </button>

                <button onClick={handleShare} className="dropdown-menu-item">
                  <Share2 size={16} />
                  <span>Share</span>
                </button>

                {isOwner && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsDeleteModalOpen(true);
                    }}
                    className="dropdown-menu-item dropdown-logout-btn"
                  >
                    <Trash2 size={16} />
                    <span>Delete Video</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save to Playlist Modal */}
      {isPlaylistModalOpen && (
        <SaveToPlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          videoId={video._id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDelete}
          title="Delete Video"
          message={`Are you sure you want to permanently delete "${video.title}"? This action cannot be reversed.`}
          isLoading={isDeleting}
        />
      )}
    </>
  );
};
