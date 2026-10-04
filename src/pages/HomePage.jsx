import React, { useState, useEffect, useCallback } from "react";
import { videoApi } from "../api/video.api";
import { VideoCard } from "../components/video/VideoCard";
import { VideoGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Film, Sparkles } from "lucide-react";

export const HomePage = () => {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    hasNextPage: false,
    totalPages: 1,
  });

  // Filter Pills (client and server sorting)
  const [activeFilter, setActiveFilter] = useState("all");

  const filterOptions = [
    { id: "all", label: "All", sortBy: "createdAt", sortType: "desc" },
    { id: "popular", label: "Most Viewed", sortBy: "views", sortType: "desc" },
    { id: "latest", label: "Recently Uploaded", sortBy: "createdAt", sortType: "desc" },
    { id: "longest", label: "Long Form", sortBy: "duration", sortType: "desc" },
    { id: "quick", label: "Short Videos", sortBy: "duration", sortType: "asc" },
  ];

  const fetchVideos = useCallback(async (pageNum = 1, filterId = activeFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const activeOpt = filterOptions.find((f) => f.id === filterId) || filterOptions[0];
      const data = await videoApi.getAllVideos({
        page: pageNum,
        limit: 12,
        sortBy: activeOpt.sortBy,
        sortType: activeOpt.sortType,
      });

      if (pageNum === 1) {
        setVideos(data?.videos || []);
      } else {
        setVideos((prev) => [...prev, ...(data?.videos || [])]);
      }

      setPagination({
        hasNextPage: !!data?.hasNextPage,
        totalPages: data?.totalPages || 1,
      });
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Failed to load videos from the server.");
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchVideos(1, activeFilter);
  }, [activeFilter, fetchVideos]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !isLoading) {
      fetchVideos(page + 1, activeFilter);
    }
  };

  return (
    <div className="home-page-container">
      {/* Filter Pills */}
      <div className="filter-pills" role="tablist">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleFilterChange(opt.id)}
            className={`filter-pill ${activeFilter === opt.id ? "active" : ""}`}
            role="tab"
            aria-selected={activeFilter === opt.id}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Videos Section */}
      {error ? (
        <ErrorState
          title="Could not load videos"
          message={error}
          onRetry={() => fetchVideos(1, activeFilter)}
        />
      ) : isLoading && page === 1 ? (
        <div style={{ marginTop: "16px" }}>
          <VideoGridSkeleton count={8} />
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No videos found"
          description="Be the first to share content with the community! Click below to publish a video."
          actionText="Upload a Video"
          onAction={() => (window.location.href = "/upload")}
        />
      ) : (
        <>
          <div
            className="video-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px 16px",
              marginTop: "16px",
            }}
          >
            {videos.map((video) => (
              <VideoCard
                key={video._id}
                video={video}
                onDelete={(deletedId) =>
                  setVideos((prev) => prev.filter((v) => v._id !== deletedId))
                }
              />
            ))}
          </div>

          {/* Load More Button */}
          {pagination.hasNextPage && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: "36px",
                marginBottom: "24px",
              }}
            >
              <button
                onClick={handleLoadMore}
                className="btn btn-secondary btn-lg"
                disabled={isLoading}
              >
                {isLoading ? "Loading more..." : "Load More Videos"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
