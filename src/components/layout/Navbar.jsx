import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import {
  Search,
  PlusSquare,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  Settings,
  History,
  ListVideo,
  LogOut,
  Sparkles,
} from "lucide-react";
import { getInitials } from "../../utils/format";

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Sync search input if URL already has ?q=
  useEffect(() => {
    if (location.pathname === "/search") {
      const params = new URLSearchParams(location.search);
      setSearchQuery(params.get("q") || "");
    }
  }, [location]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileMenuOpen(false);
      toast.info("Logged out successfully");
      navigate("/");
    } catch {
      toast.error("Logout encountered an issue");
    }
  };

  return (
    <header className="navbar-container">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="navbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn-icon btn-ghost sidebar-toggle-btn"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={22} />
        </button>

        <Link to="/" className="navbar-brand">
          <div className="brand-logo-icon">
            <svg viewBox="0 0 32 32" width="26" height="26">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff3b5c" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#logoGrad)" />
              <polygon points="12,9 23,16 12,23" fill="#ffffff" />
            </svg>
          </div>
          <span className="brand-name">
            VORTEX<span className="brand-name-accent">.</span>
          </span>
        </Link>
      </div>

      {/* Center: Search Bar */}
      <div className="navbar-center">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search videos, creators, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="search-clear-btn"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button type="submit" className="search-submit-btn" aria-label="Search">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Right: Actions & User Menu */}
      <div className="navbar-right">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon btn-ghost theme-toggle-btn"
          aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Upload Button */}
        <Link
          to="/upload"
          className="btn btn-secondary btn-sm upload-nav-btn"
          title="Upload Video"
        >
          <PlusSquare size={18} />
          <span className="upload-nav-text">Upload</span>
        </Link>

        {/* Auth / Profile Area */}
        {isAuthenticated && user ? (
          <div className="profile-dropdown-wrapper" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="avatar-btn"
              aria-label="User menu"
              aria-expanded={isProfileMenuOpen}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullname || user.username}
                  className="avatar avatar-sm"
                />
              ) : (
                <div className="avatar avatar-sm avatar-placeholder">
                  {getInitials(user.fullname || user.username)}
                </div>
              )}
            </button>

            {isProfileMenuOpen && (
              <div className="profile-dropdown-menu animate-fade-in">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-avatar">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullname || user.username}
                        className="avatar avatar-md"
                      />
                    ) : (
                      <div className="avatar avatar-md avatar-placeholder">
                        {getInitials(user.fullname || user.username)}
                      </div>
                    )}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{user.fullname}</div>
                    <div className="dropdown-user-handle">@{user.username}</div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <Link
                  to={`/channel/${user.username}`}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="dropdown-menu-item"
                >
                  <UserIcon size={18} />
                  <span>Your Channel</span>
                </Link>

                <Link
                  to="/playlists"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="dropdown-menu-item"
                >
                  <ListVideo size={18} />
                  <span>Playlists</span>
                </Link>

                <Link
                  to="/history"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="dropdown-menu-item"
                >
                  <History size={18} />
                  <span>Watch History</span>
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="dropdown-menu-item"
                >
                  <Settings size={18} />
                  <span>Settings & Profile</span>
                </Link>

                <div className="dropdown-divider" />

                <button
                  onClick={handleLogout}
                  className="dropdown-menu-item dropdown-logout-btn"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons-wrapper">
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
