import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { videoApi } from "../api/video.api";
import { playlistApi } from "../api/playlist.api";
import { postApi } from "../api/post.api";
import { subscriptionApi } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { VideoCard } from "../components/video/VideoCard";
import { ChannelSkeleton, VideoGridSkeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import {
  formatSubscribers,
  formatTimeAgo,
  getInitials,
} from "../utils/format";
import {
  Settings,
  Film,
  ListVideo,
  MessageSquare,
  Info,
  Calendar,
  Users2,
  Tv,
} from "lucide-react";

export const ChannelPage = () => {
  const { username } = useParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(true);
  const [error, setError] = useState(null);

  // Active tab: 'videos' | 'playlists' | 'community' | 'about'
  const [activeTab, setActiveTab] = useState("videos");

  // Tab Data States
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoadingTab, setIsLoadingTab] = useState(false);

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const isOwnChannel = user && user.username?.toLowerCase() === username?.toLowerCase();

  // Load channel profile
  const loadChannel = useCallback(async () => {
    setIsLoadingChannel(true);
    setError(null);
    try {
      const data = await authApi.getChannelProfile(username);
      setChannel(data);
      setIsSubscribed(!!data.isSubscribed);
      setSubscriberCount(data.subscribersCount || 0);
    } catch (err) {
      setError(err.message || "Channel not found");
    } finally {
      setIsLoadingChannel(false);
    }
  }, [username]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  // Load content for active tab when channel is loaded
  useEffect(() => {
    if (!channel?._id) return;

    let isMounted = true;
    setIsLoadingTab(true);

    if (activeTab === "videos") {
      videoApi
        .getAllVideos({ userId: channel._id, limit: 30 })
        .then((data) => {
          if (isMounted) setVideos(data?.videos || []);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingTab(false);
        });
    } else if (activeTab === "playlists") {
      playlistApi
        .getUserPlaylists(channel._id)
        .then((data) => {
          if (isMounted) setPlaylists(Array.isArray(data) ? data : []);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingTab(false);
        });
    } else if (activeTab === "community") {
      postApi
        .getUserPosts(channel._id)
        .then((data) => {
          if (isMounted) setPosts(Array.isArray(data) ? data : []);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingTab(false);
        });
    } else {
      setIsLoadingTab(false);
    }

    return () => {
      isMounted = false;
    };
  }, [activeTab, channel?._id]);

  // Toggle subscription
  const handleToggleSubscription = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to subscribe");
      navigate("/login");
      return;
    }
    if (isOwnChannel || isSubscribing || !channel?._id) return;

    setIsSubscribing(true);
    const prevSub = isSubscribed;
    const prevCount = subscriberCount;
    setIsSubscribed(!prevSub);
    setSubscriberCount(prevSub ? prevCount - 1 : prevCount + 1);

    try {
      const result = await subscriptionApi.toggleSubscription(channel._id);
      setIsSubscribed(result?.subscribed);
      toast.success(
        result?.subscribed
          ? `Subscribed to ${channel.fullname || channel.username}!`
          : `Unsubscribed from ${channel.fullname || channel.username}`
      );
    } catch (err) {
      setIsSubscribed(prevSub);
      setSubscriberCount(prevCount);
      toast.error(err.message || "Failed to update subscription");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (error) {
    return (
      <ErrorState
        title="Channel Not Found"
        message={error}
        onRetry={loadChannel}
      />
    );
  }

  if (isLoadingChannel || !channel) {
    return (
      <div style={{ padding: "20px 0" }}>
        <ChannelSkeleton />
      </div>
    );
  }

  return (
    <div className="channel-page-container">
      {/* Cover Image Banner */}
      <div className="channel-cover-banner">
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt="Cover banner"
            className="channel-cover-image"
          />
        ) : (
          <div className="channel-cover-placeholder" />
        )}
      </div>

      {/* Channel Info Header */}
      <div className="channel-header-section">
        <div className="channel-avatar-wrapper">
          {channel.avatar ? (
            <img
              src={channel.avatar}
              alt={channel.username}
              className="avatar avatar-xl channel-avatar-img"
            />
          ) : (
            <div className="avatar avatar-xl avatar-placeholder">
              {getInitials(channel.fullname || channel.username)}
            </div>
          )}
        </div>

        <div className="channel-meta-content">
          <div className="channel-names">
            <h1 className="channel-title-fullname">{channel.fullname}</h1>
            <span className="channel-username-tag">@{channel.username}</span>
          </div>

          <div className="channel-stats-row">
            <span>{formatSubscribers(subscriberCount)}</span>
            <span className="meta-dot">•</span>
            <span>{channel.channelsSubscribedToCount || 0} subscriptions</span>
          </div>

          <div className="channel-cta-buttons">
            {isOwnChannel ? (
              <Link to="/settings" className="btn btn-secondary btn-sm">
                <Settings size={16} />
                <span>Customize Channel</span>
              </Link>
            ) : (
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
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="tabs-bar" role="tablist">
        {[
          { id: "videos", label: "Videos", icon: Film },
          { id: "playlists", label: "Playlists", icon: ListVideo },
          { id: "community", label: "Community", icon: MessageSquare },
          { id: "about", label: "About", icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              role="tab"
              aria-selected={activeTab === tab.id}
            >
              <Icon size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "middle" }} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="channel-tab-content">
        {/* VIDEOS TAB */}
        {activeTab === "videos" && (
          <div>
            {isLoadingTab ? (
              <VideoGridSkeleton count={6} />
            ) : videos.length === 0 ? (
              <EmptyState
                icon={Film}
                title="No videos uploaded yet"
                description={
                  isOwnChannel
                    ? "Upload your first video to share with your audience."
                    : `${channel.fullname || channel.username} hasn't uploaded any videos yet.`
                }
                actionText={isOwnChannel ? "Upload Video" : undefined}
                onAction={isOwnChannel ? () => navigate("/upload") : undefined}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px 16px",
                  marginTop: "16px",
                }}
              >
                {videos.map((vid) => (
                  <VideoCard
                    key={vid._id}
                    video={{ ...vid, owner: channel }}
                    onDelete={(deletedId) =>
                      setVideos((prev) => prev.filter((v) => v._id !== deletedId))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLAYLISTS TAB */}
        {activeTab === "playlists" && (
          <div>
            {isLoadingTab ? (
              <VideoGridSkeleton count={4} />
            ) : playlists.length === 0 ? (
              <EmptyState
                icon={ListVideo}
                title="No public playlists"
                description={`${channel.fullname || channel.username} doesn't have any playlists yet.`}
              />
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "16px",
                }}
              >
                {playlists.map((pl) => (
                  <Link
                    key={pl._id}
                    to={`/playlist/${pl._id}`}
                    className="playlist-grid-card glass-panel"
                  >
                    <div className="playlist-card-cover">
                      <ListVideo size={36} color="var(--accent-primary)" />
                      <div className="playlist-video-count-badge badge badge-dark">
                        {pl.videos?.length || 0} videos
                      </div>
                    </div>
                    <div className="playlist-card-info">
                      <h4 className="playlist-card-name">{pl.name}</h4>
                      {pl.description && (
                        <p className="playlist-card-desc">{pl.description}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY TAB */}
        {activeTab === "community" && (
          <div style={{ maxWidth: "680px", margin: "16px auto 0" }}>
            {isLoadingTab ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="skeleton" style={{ height: "120px" }} />
                <div className="skeleton" style={{ height: "120px" }} />
              </div>
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No community posts"
                description={`${channel.fullname || channel.username} hasn't shared any community posts yet.`}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {posts.map((post) => (
                  <div key={post._id} className="community-post-card glass-panel">
                    <div className="post-header">
                      {channel.avatar ? (
                        <img
                          src={channel.avatar}
                          alt={channel.username}
                          className="avatar avatar-sm"
                        />
                      ) : (
                        <div className="avatar avatar-sm avatar-placeholder">
                          {getInitials(channel.username)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>
                          {channel.fullname || channel.username}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {formatTimeAgo(post.createdAt)}
                        </div>
                      </div>
                    </div>

                    <p className="post-content-text">{post.content}</p>

                    {post.image?.url && (
                      <div className="post-image-wrapper">
                        <img
                          src={post.image.url}
                          alt="Post attachment"
                          className="post-image"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABOUT TAB */}
        {activeTab === "about" && (
          <div className="channel-about-container glass-panel">
            <h3 style={{ fontSize: "1.125rem", marginBottom: "16px", fontWeight: 700 }}>
              Channel Details
            </h3>
            <div className="about-details-list">
              <div className="about-item">
                <Users2 size={20} color="var(--accent-primary)" />
                <div>
                  <div className="about-label">Subscribers</div>
                  <div className="about-value">{formatSubscribers(subscriberCount)}</div>
                </div>
              </div>

              <div className="about-item">
                <Tv size={20} color="var(--accent-secondary)" />
                <div>
                  <div className="about-label">Subscribed to</div>
                  <div className="about-value">
                    {channel.channelsSubscribedToCount || 0} channels
                  </div>
                </div>
              </div>

              <div className="about-item">
                <Calendar size={20} color="var(--text-muted)" />
                <div>
                  <div className="about-label">Channel URL</div>
                  <div className="about-value">
                    {window.location.origin}/channel/{channel.username}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
