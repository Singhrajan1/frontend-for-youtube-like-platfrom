import React, { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscriptionApi } from "../../api/subscription.api";
import {
  Home,
  Compass,
  Users2,
  History,
  ListVideo,
  MessageSquare,
  Upload,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { getInitials } from "../../utils/format";

export const Sidebar = ({ isCollapsed, isMobileOpen, onCloseMobile }) => {
  const { isAuthenticated, user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);

  // Fetch quick subscribed channels list if authenticated
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      subscriptionApi
        .getSubscribedChannels()
        .then((data) => {
          if (isMounted) setSubscriptions(Array.isArray(data) ? data.slice(0, 6) : []);
        })
        .catch(() => {});
    } else {
      setSubscriptions([]);
    }
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/subscriptions", icon: Users2, label: "Subscriptions", requiresAuth: true },
    { to: "/history", icon: History, label: "History", requiresAuth: true },
    { to: "/playlists", icon: ListVideo, label: "Playlists", requiresAuth: true },
    { to: "/community", icon: MessageSquare, label: "Community" },
    { to: "/upload", icon: Upload, label: "Upload Video", requiresAuth: true },
    { to: "/settings", icon: Settings, label: "Settings", requiresAuth: true },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar-container ${isCollapsed ? "sidebar-collapsed" : ""} ${
          isMobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-inner">
          {/* Main Navigation Group */}
          <div className="sidebar-group">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="sidebar-icon">
                    <Icon size={20} />
                  </span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Subscriptions Section (Only when not collapsed and authenticated) */}
          {!isCollapsed && isAuthenticated && subscriptions.length > 0 && (
            <div className="sidebar-group sidebar-subscriptions-group">
              <div className="sidebar-group-title">
                <span>Subscribed Channels</span>
              </div>
              {subscriptions.map((sub) => {
                const channel = sub.channel;
                if (!channel) return null;
                return (
                  <Link
                    key={sub._id}
                    to={`/channel/${channel.username}`}
                    onClick={handleLinkClick}
                    className="sidebar-link sidebar-sub-link"
                  >
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt={channel.fullname || channel.username}
                        className="avatar avatar-xs"
                      />
                    ) : (
                      <div className="avatar avatar-xs avatar-placeholder">
                        {getInitials(channel.fullname || channel.username)}
                      </div>
                    )}
                    <span className="sidebar-label">{channel.fullname || channel.username}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Guest Sign-in Promo (when not authenticated & expanded) */}
          {!isCollapsed && !isAuthenticated && (
            <div className="sidebar-guest-card glass-panel">
              <div className="guest-card-title">Join Vortex Stream</div>
              <p className="guest-card-desc">
                Sign in to like videos, leave comments, and subscribe to creators.
              </p>
              <Link
                to="/login"
                onClick={handleLinkClick}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Footer Info (Expanded desktop only) */}
          {!isCollapsed && (
            <div className="sidebar-footer">
              <p>© 2026 Vortex Stream Inc.</p>
              <p>Crafted for Creator Communities</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
