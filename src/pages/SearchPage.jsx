import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { videoApi } from "../api/video.api";
import { VideoGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { formatDuration, formatViews, formatTimeAgo, getInitials } from "../utils/format";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [videos, setVideos] = useState([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortType, setSortType] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await videoApi.getAllVideos({
        query: query.trim(),
        sortBy,
        sortType,
        limit: 25,
      });

      setVideos(data?.videos || []);
      setTotalVideos(data?.totalVideos || 0);
    } catch (err) {
      setError(err.message || "Failed to search videos.");
    } finally {
      setIsLoading(false);
    }
  }, [query, sortBy, sortType]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <div className="search-page-container">
      {/* Search Header */}
      <div className="search-header-bar">
        <div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700 }}>
            {query ? `Results for "${query}"` : "Search Videos"}
          </h2>
          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            {totalVideos} {totalVideos === 1 ? "video" : "videos"} found
          </span>
        </div>

        <button
          onClick={() => setShowFilters((prev) => !prev)}
          className={`btn btn-secondary btn-sm ${showFilters ? "active" : ""}`}
        >
          <SlidersHorizontal size={16} />
          <span>Filters</span>
        </button>
      </div>

      {/* Filter Drawer */}
      {showFilters && (
        <div className="search-filters-drawer glass-panel animate-fade-in">
          <div className="filter-group">
            <span className="filter-title">Sort By</span>
            <div className="filter-chips">
              {[
                { label: "Upload Date", val: "createdAt" },
                { label: "View Count", val: "views" },
                { label: "Title", val: "title" },
                { label: "Duration", val: "duration" },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setSortBy(item.val)}
                  className={`filter-chip ${sortBy === item.val ? "active" : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-title">Order</span>
            <div className="filter-chips">
              <button
                onClick={() => setSortType("desc")}
                className={`filter-chip ${sortType === "desc" ? "active" : ""}`}
              >
                Descending (Highest / Newest)
              </button>
              <button
                onClick={() => setSortType("asc")}
                className={`filter-chip ${sortType === "asc" ? "active" : ""}`}
              >
                Ascending (Lowest / Oldest)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {error ? (
        <ErrorState
          title="Search Failed"
          message={error}
          onRetry={performSearch}
        />
      ) : isLoading ? (
        <div style={{ marginTop: "20px" }}>
          <VideoGridSkeleton count={6} />
        </div>
      ) : !query.trim() ? (
        <EmptyState
          icon={Search}
          title="Search Vortex Stream"
          description="Type in the search bar above to discover videos, tutorials, music, and creators."
        />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`No videos matched your query "${query}". Try different search terms or check spelling.`}
        />
      ) : (
        <div className="search-results-list">
          {videos.map((video) => {
            const owner = video.owner || {};
            return (
              <div key={video._id} className="search-video-card glass-panel">
                <Link
                  to={`/watch/${video._id}`}
                  className="search-thumbnail-wrapper"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="search-thumbnail"
                    loading="lazy"
                  />
                  {video.duration > 0 && (
                    <div className="video-duration-badge badge badge-dark">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </Link>

                <div className="search-details">
                  <Link to={`/watch/${video._id}`} className="search-title">
                    {video.title}
                  </Link>

                  <div className="search-meta">
                    <span>{formatViews(video.views)}</span>
                    <span className="meta-dot">•</span>
                    <span>{formatTimeAgo(video.createdAt)}</span>
                  </div>

                  <Link
                    to={owner.username ? `/channel/${owner.username}` : "#"}
                    className="search-channel-info"
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
                    <span className="search-channel-name">
                      {owner.fullname || owner.username || "Creator"}
                    </span>
                  </Link>

                  {video.description && (
                    <p className="search-description">{video.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
