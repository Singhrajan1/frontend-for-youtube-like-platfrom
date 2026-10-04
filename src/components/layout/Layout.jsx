import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export const Layout = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse sidebar on the watch page for better theater view
  const isWatchPage = location.pathname.startsWith("/watch/");

  useEffect(() => {
    if (isWatchPage) {
      setIsSidebarCollapsed(true);
    }
  }, [isWatchPage]);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    // If mobile, toggle mobile drawer; if desktop, toggle collapse
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="app-layout">
      <Navbar
        onToggleSidebar={handleToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      <div className="app-body">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />

        <main
          className={`app-main-content ${
            isSidebarCollapsed ? "sidebar-collapsed-content" : ""
          } ${isWatchPage ? "watch-layout" : ""}`}
        >
          <div className="page-wrapper">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
};
