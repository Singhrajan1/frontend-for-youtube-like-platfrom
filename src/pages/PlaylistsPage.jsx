import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { playlistApi } from "../api/playlist.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { PlaylistSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Modal } from "../components/ui/Modal";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import {
  ListVideo,
  Plus,
  Play,
  Trash2,
  FolderPlus,
  Loader2,
} from "lucide-react";

export const PlaylistsPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Delete State
  const [deletingPlaylistId, setDeletingPlaylistId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPlaylists = useCallback(async () => {
    if (!user?._id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await playlistApi.getUserPlaylists(user._id);
      setPlaylists(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load playlists");
    } finally {
      setIsLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsCreating(true);
    try {
      const created = await playlistApi.createPlaylist({
        name: newName.trim(),
        description: newDesc.trim(),
      });
      setPlaylists((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewName("");
      setNewDesc("");
      toast.success(`Playlist "${created.name}" created!`);
    } catch (err) {
      toast.error(err.message || "Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlaylistId) return;
    setIsDeleting(true);
    try {
      await playlistApi.deletePlaylist(deletingPlaylistId);
      setPlaylists((prev) => prev.filter((p) => p._id !== deletingPlaylistId));
      setDeletingPlaylistId(null);
      toast.success("Playlist deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="playlists-page-container">
      <div className="playlists-header-bar">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Your Playlists</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Curate and organize your favorite videos
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary btn-sm"
        >
          <Plus size={18} />
          <span>New Playlist</span>
        </button>
      </div>

      {error ? (
        <ErrorState
          title="Could not load playlists"
          message={error}
          onRetry={loadPlaylists}
        />
      ) : isLoading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "24px",
            marginTop: "20px",
          }}
        >
          <PlaylistSkeleton />
          <PlaylistSkeleton />
          <PlaylistSkeleton />
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon={ListVideo}
          title="No playlists yet"
          description="Create your first playlist to organize videos into custom watchlists or collections."
          actionText="Create Playlist"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "24px",
            marginTop: "20px",
          }}
        >
          {playlists.map((playlist) => (
            <div key={playlist._id} className="playlist-card glass-panel">
              <Link
                to={`/playlist/${playlist._id}`}
                className="playlist-card-thumbnail"
              >
                <div className="playlist-icon-cover">
                  <ListVideo size={44} color="var(--accent-primary)" />
                </div>
                <div className="playlist-count-badge badge badge-dark">
                  {playlist.videos?.length || 0} videos
                </div>
              </Link>

              <div className="playlist-info-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link
                    to={`/playlist/${playlist._id}`}
                    className="playlist-title-link"
                  >
                    {playlist.name}
                  </Link>
                  <div className="playlist-meta-desc">
                    {playlist.description || "No description"}
                  </div>
                </div>

                <button
                  onClick={() => setDeletingPlaylistId(playlist._id)}
                  className="btn-icon btn-icon-sm btn-ghost"
                  style={{ color: "var(--status-error)" }}
                  title="Delete playlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Playlist"
        footer={
          <>
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="btn btn-secondary btn-sm"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreatePlaylist}
              className="btn btn-primary btn-sm"
              disabled={!newName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreatePlaylist}>
          <div className="form-group">
            <label className="form-label">Playlist Name *</label>
            <input
              type="text"
              placeholder="e.g. Chill Beats, React Tutorials, Gaming Highlights"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description (optional)</label>
            <textarea
              placeholder="What is this playlist about?"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {deletingPlaylistId && (
        <ConfirmModal
          isOpen={!!deletingPlaylistId}
          onClose={() => setDeletingPlaylistId(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Playlist"
          message="Are you sure you want to delete this playlist? This will not delete the videos themselves."
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};
