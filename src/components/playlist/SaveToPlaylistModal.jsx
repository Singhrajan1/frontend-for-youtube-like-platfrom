import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { playlistApi } from "../../api/playlist.api";
import { Plus, Check, ListVideo, Loader2 } from "lucide-react";

export const SaveToPlaylistModal = ({ isOpen, onClose, videoId }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [savingPlaylistId, setSavingPlaylistId] = useState(null);

  // Fetch user playlists when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated && user?._id) {
      setIsLoading(true);
      playlistApi
        .getUserPlaylists(user._id)
        .then((data) => {
          setPlaylists(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          toast.error(err.message || "Failed to load playlists");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, isAuthenticated, user, toast]);

  if (!isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Save to Playlist">
        <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
          Please sign in to save videos to your playlists.
        </p>
        <button
          onClick={() => {
            onClose();
            window.location.href = "/login";
          }}
          className="btn btn-primary"
        >
          Sign In
        </button>
      </Modal>
    );
  }

  const handleTogglePlaylist = async (playlist) => {
    const isVideoInPlaylist = playlist.videos?.some(
      (v) => (typeof v === "object" ? v._id : v) === videoId
    );

    setSavingPlaylistId(playlist._id);
    try {
      if (isVideoInPlaylist) {
        await playlistApi.removeVideoFromPlaylist(playlist._id, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? {
                  ...p,
                  videos: p.videos.filter(
                    (v) => (typeof v === "object" ? v._id : v) !== videoId
                  ),
                }
              : p
          )
        );
        toast.info(`Removed from "${playlist.name}"`);
      } else {
        await playlistApi.addVideoToPlaylist(playlist._id, videoId);
        setPlaylists((prev) =>
          prev.map((p) =>
            p._id === playlist._id
              ? { ...p, videos: [...(p.videos || []), videoId] }
              : p
          )
        );
        toast.success(`Saved to "${playlist.name}"`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to update playlist");
    } finally {
      setSavingPlaylistId(null);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const created = await playlistApi.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDesc.trim(),
      });

      // Automatically add the video to newly created playlist
      if (videoId && created?._id) {
        await playlistApi.addVideoToPlaylist(created._id, videoId);
        created.videos = [videoId];
      }

      setPlaylists((prev) => [created, ...prev]);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      toast.success(`Playlist "${created.name}" created!`);
    } catch (err) {
      toast.error(err.message || "Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save video to..."
      footer={
        <button onClick={onClose} className="btn btn-secondary">
          Done
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Playlists List */}
        {isLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px" }}>
            <Loader2 className="animate-spin" size={20} />
            <span style={{ color: "var(--text-secondary)" }}>Loading playlists...</span>
          </div>
        ) : playlists.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            You haven't created any playlists yet. Create your first one below!
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {playlists.map((playlist) => {
              const isInPlaylist = playlist.videos?.some(
                (v) => (typeof v === "object" ? v._id : v) === videoId
              );
              const isWorking = savingPlaylistId === playlist._id;

              return (
                <button
                  key={playlist._id}
                  onClick={() => handleTogglePlaylist(playlist)}
                  disabled={isWorking}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    background: isInPlaylist ? "var(--accent-gradient-subtle)" : "var(--bg-secondary)",
                    border: `1px solid ${isInPlaylist ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      border: `2px solid ${isInPlaylist ? "var(--accent-primary)" : "var(--text-muted)"}`,
                      background: isInPlaylist ? "var(--accent-primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                    }}
                  >
                    {isInPlaylist && <Check size={14} strokeWidth={3} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {playlist.name}
                    </div>
                    {playlist.description && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {playlist.description}
                      </div>
                    )}
                  </div>

                  {isWorking && <Loader2 className="animate-spin" size={16} />}
                </button>
              );
            })}
          </div>
        )}

        <div className="dropdown-divider" />

        {/* Inline Create Form */}
        <form onSubmit={handleCreatePlaylist}>
          <div style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "10px" }}>
            Create new playlist
          </div>
          <div className="form-group" style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: "12px" }}>
            <input
              type="text"
              placeholder="Description (optional)"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!newPlaylistName.trim() || isCreating}
            style={{ width: "100%" }}
          >
            {isCreating ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Plus size={16} />
            )}
            Create & Save
          </button>
        </form>
      </div>
    </Modal>
  );
};
