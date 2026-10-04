import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { subscriptionApi } from "../api/subscription.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Users2, Check, UserMinus } from "lucide-react";
import { getInitials } from "../utils/format";

export const SubscriptionsPage = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await subscriptionApi.getSubscribedChannels();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleUnsubscribe = async (channelId, channelName) => {
    setTogglingId(channelId);
    try {
      await subscriptionApi.toggleSubscription(channelId);
      setSubscriptions((prev) => prev.filter((s) => s.channel?._id !== channelId));
      toast.info(`Unsubscribed from ${channelName || "channel"}`);
    } catch (err) {
      toast.error(err.message || "Failed to unsubscribe");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="subscriptions-page-container">
      <div className="subscriptions-header">
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Your Subscriptions</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Channels and creators you actively follow
        </p>
      </div>

      {error ? (
        <ErrorState
          title="Could not load subscriptions"
          message={error}
          onRetry={loadSubscriptions}
        />
      ) : isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px", marginTop: "20px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "160px", borderRadius: "var(--radius-xl)" }} />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No subscriptions yet"
          description="When you subscribe to channels, they will appear here. Find creators and content you love!"
          actionText="Explore Videos"
          onAction={() => (window.location.href = "/")}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          {subscriptions.map((sub) => {
            const channel = sub.channel;
            if (!channel) return null;
            const isToggling = togglingId === channel._id;

            return (
              <div key={sub._id} className="channel-subscriber-card glass-panel">
                <Link
                  to={`/channel/${channel.username}`}
                  className="channel-card-avatar-link"
                >
                  {channel.avatar ? (
                    <img
                      src={channel.avatar}
                      alt={channel.username}
                      className="avatar avatar-lg"
                    />
                  ) : (
                    <div className="avatar avatar-lg avatar-placeholder">
                      {getInitials(channel.fullname || channel.username)}
                    </div>
                  )}
                </Link>

                <div className="channel-card-info">
                  <Link
                    to={`/channel/${channel.username}`}
                    className="channel-card-name"
                  >
                    {channel.fullname}
                  </Link>
                  <span className="channel-card-handle">@{channel.username}</span>
                </div>

                <button
                  onClick={() =>
                    handleUnsubscribe(channel._id, channel.fullname || channel.username)
                  }
                  className="btn btn-secondary btn-sm"
                  disabled={isToggling}
                >
                  <UserMinus size={16} />
                  <span>Unsubscribe</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
