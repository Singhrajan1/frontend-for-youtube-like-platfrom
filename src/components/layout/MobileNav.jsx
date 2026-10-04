import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Home, MessageSquare, PlusCircle, Users2, User } from "lucide-react";
import { getInitials } from "../../utils/format";

export const MobileNav = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <Home size={22} />
        <span>Home</span>
      </NavLink>

      <NavLink
        to="/subscriptions"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <Users2 size={22} />
        <span>Subs</span>
      </NavLink>

      <NavLink
        to="/upload"
        className="mobile-nav-item mobile-nav-upload"
        aria-label="Upload video"
      >
        <div className="mobile-upload-btn">
          <PlusCircle size={32} />
        </div>
      </NavLink>

      <NavLink
        to="/community"
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        <MessageSquare size={22} />
        <span>Posts</span>
      </NavLink>

      <NavLink
        to={isAuthenticated ? "/settings" : "/login"}
        className={({ isActive }) => `mobile-nav-item ${isActive ? "active" : ""}`}
      >
        {isAuthenticated && user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="avatar avatar-xs"
            style={{ width: "24px", height: "24px" }}
          />
        ) : (
          <User size={22} />
        )}
        <span>{isAuthenticated ? "You" : "Login"}</span>
      </NavLink>
    </nav>
  );
};
