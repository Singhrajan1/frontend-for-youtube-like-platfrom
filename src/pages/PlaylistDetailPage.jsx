import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { playlistApi } from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ErrorState } from "../components/ui/ErrorState";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Modal } from "../components/ui/Modal";
import {
  formatDuration,
  formatViews,
  formatTimeAgo,
  getInitials,
} from "../utils/format";
import {
  ListVideo,
  Play,
  Trash2,
  Edit2,
  X,
  Share2,
  Loader2,
} from "lucide-react";

export const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const owner = playlist?.owner || {};
  const isOwner = user && (user._id === owner._id || user._id === playlist?.owner);

  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await playlistApi.getPlaylistById(playlistId);
      setPlaylist(data);
      setEditName(data.name || "");
      setEditDesc(data.description || "");
    } catch (err) {
      setError(err.message || "Failed to load playlist");
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  // Handle Edit Playlist
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsUpdating(true);
    try {
      const updated = await playlistApi.updatePlaylist(playlistId, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setPlaylist((prev) => ({ ...prev, ...updated }));
      setIsEditModalOpen(false);
      toast.success("Playlist details updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update playlist");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Delete Playlist
  const handleDeletePlaylist = async () => {
    setIsDeleting(true);
    try {
      await playlistApi.deletePlaylist(playlistId);
      toast.success("Playlist deleted");
      navigate("/playlists");
    } catch (err) {
      toast.error(err.message || "Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Remove Video from Playlist
  const handleRemoveVideo = async (videoId) => {
    try {
      await playlistApi.removeVideoFromPlaylist(playlistId, videoId);
      setPlaylist((prev) => ({
        ...prev,
        videos: prev.videos.filter((v) => (typeof v === "object" ? v._id : v) !== videoId),
      }));
      toast.success("Video removed from playlist");
    } catch (err) {
      toast.error(err.message || "Failed to remove video");
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Playlist Not Found"
        message={error}
        onRetry={loadPlaylist}
      />
    );
  }

  if (isLoading || !playlist) {
    return (
      <div style={{ display: "flex", gap: "24px", padding: "20px 0" }}>
        <div className="skeleton" style={{ width: "340px", height: "420px", borderRadius: "var(--radius-xl)" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="skeleton" style={{ height: "40px", width: "60%" }} />
          <div className="skeleton" style={{ height: "80px", width: "100%" }} />
          <div className="skeleton" style={{ height: "80px", width: "100%" }} />
        </div>
      </div>
    );
  }

  const videosList = playlist.videos || [];
  const firstVideo = videosList[0];

  return (
    <div className="playlist-detail-page">
      {/* Left Sidebar: Playlist Info Panel */}
      <div className="playlist-detail-panel glass-panel">
        <div className="playlist-detail-cover-wrapper">
          {firstVideo?.thumbnail ? (
            <img
              src={firstVideo.thumbnail}
              alt={playlist.name}
              className="playlist-detail-cover"
            />
          ) : (
            <div className="playlist-detail-placeholder">
              <ListVideo size={64} color="var(--accent-primary)" />
            </div>
          )}
          <div className="playlist-badge badge badge-dark">
            {videosList.length} {videosList.length === 1 ? "video" : "videos"}
          </div>
        </div>

        <h1 className="playlist-detail-title">{playlist.name}</h1>

        <div className="playlist-detail-owner">
          <Link
            to={owner.username ? `/channel/${owner.username}` : "#"}
            className="playlist-owner-link"
          >
            {owner.avatar ? (
              <img
                src={owner.avatar}
                alt={owner.username}
                className="avatar avatar-xs"
              />
            ) : (
              <div className="avatar avatar-xs avatar-placeholder">
                {getInitials(owner.fullname || owner.username)}
              </div>
            )}
            <span>{owner.fullname || owner.username || "Creator"}</span>
          </Link>
        </div>

        {playlist.description && (
          <p className="playlist-detail-desc">{playlist.description}</p>
        )}

        {/* Playlist Actions */}
        <div className="playlist-detail-actions">
          {firstVideo && (
            <Link
              to={`/watch/${firstVideo._id}`}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Play size={18} fill="#ffffff" />
              <span>Play All</span>
            </Link>
          )}

          {isOwner && (
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Edit2 size={16} />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="btn btn-danger btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right List: Playlist Videos */}
      <div className="playlist-videos-list">
        {videosList.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px dashed var(--border-default)",
            }}
          >
            <ListVideo size={48} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "6px" }}>
              This playlist is empty
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Explore videos across Vortex Stream and click "Save" to add them to this playlist.
            </p>
          </div>
        ) : (
          videosList.map((vid, index) => {
            if (!vid || typeof vid !== "object") return null;
            return (
              <div key={vid._id} className="playlist-video-item glass-panel">
                <span className="playlist-video-index">{index + 1}</span>

                <Link
                  to={`/watch/${vid._id}`}
                  className="playlist-item-thumbnail-wrapper"
                >
                  <img
                    src={vid.thumbnail}
                    alt={vid.title}
                    className="playlist-item-thumbnail"
                  />
                  {vid.duration > 0 && (
                    <div className="video-duration-badge badge badge-dark">
                      {formatDuration(vid.duration)}
                    </div>
                  )}
                </Link>

                <div className="playlist-item-info">
                  <Link to={`/watch/${vid._id}`} className="playlist-item-title">
                    {vid.title}
                  </Link>

                  <div className="playlist-item-meta">
                    <span>{formatViews(vid.views)}</span>
                    <span className="meta-dot">•</span>
                    <span>{formatTimeAgo(vid.createdAt)}</span>
                  </div>
                </div>

                {isOwner && (
                  <button
                    onClick={() => handleRemoveVideo(vid._id)}
                    className="btn-icon btn-icon-sm btn-ghost playlist-remove-btn"
                    title="Remove from playlist"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Playlist Details"
          footer={
            <>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary btn-sm"
                disabled={!editName.trim() || isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label">Playlist Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeletePlaylist}
          title="Delete Playlist"
          message={`Are you sure you want to delete "${playlist.name}"?`}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
