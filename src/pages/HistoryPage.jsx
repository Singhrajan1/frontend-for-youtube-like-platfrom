import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { VideoGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { formatDuration, formatViews, formatTimeAgo, getInitials } from "../utils/format";
import { History, Play } from "lucide-react";

export const HistoryPage = () => {
  const [historyVideos, setHistoryVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.getWatchHistory();
      setHistoryVideos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load watch history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="history-page-container">
      <div className="history-header">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Watch History</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Videos you have recently watched on Vortex Stream
        </p>
      </div>

      {error ? (
        <ErrorState
          title="Could not load history"
          message={error}
          onRetry={loadHistory}
        />
      ) : isLoading ? (
        <div style={{ marginTop: "20px" }}>
          <VideoGridSkeleton count={6} />
        </div>
      ) : historyVideos.length === 0 ? (
        <EmptyState
          icon={History}
          title="No watch history yet"
          description="Videos you watch will show up here so you can easily pick up where you left off."
          actionText="Watch Some Videos"
          onAction={() => (window.location.href = "/")}
        />
      ) : (
        <div className="history-videos-list">
          {historyVideos.map((video) => {
            if (!video) return null;
            const owner = video.owner || {};

            return (
              <div key={video._id} className="history-video-card glass-panel">
                <Link
                  to={`/watch/${video._id}`}
                  className="history-thumbnail-wrapper"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="history-thumbnail"
                  />
                  {video.duration > 0 && (
                    <div className="video-duration-badge badge badge-dark">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </Link>

                <div className="history-details">
                  <Link to={`/watch/${video._id}`} className="history-title">
                    {video.title}
                  </Link>

                  <div className="history-meta">
                    <Link
                      to={owner.username ? `/channel/${owner.username}` : "#"}
                      className="history-channel-name"
                    >
                      {owner.fullname || owner.username || "Creator"}
                    </Link>
                    <span className="meta-dot">•</span>
                    <span>{formatViews(video.views)}</span>
                    <span className="meta-dot">•</span>
                    <span>{formatTimeAgo(video.createdAt)}</span>
                  </div>

                  {video.description && (
                    <p className="history-desc-snippet">{video.description}</p>
                  )}
                </div>

                <Link
                  to={`/watch/${video._id}`}
                  className="btn btn-secondary btn-sm history-play-btn"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Watch</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
