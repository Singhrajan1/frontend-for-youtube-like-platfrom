import React from "react";

export const VideoCardSkeleton = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        className="skeleton"
        style={{
          width: "100%",
          paddingTop: "56.25%", // 16:9 aspect ratio
          position: "relative",
          borderRadius: "var(--radius-lg)",
        }}
      />
      <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
        <div
          className="skeleton"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-full)",
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="skeleton" style={{ height: "16px", width: "85%" }} />
          <div className="skeleton" style={{ height: "12px", width: "50%" }} />
          <div className="skeleton" style={{ height: "12px", width: "35%" }} />
        </div>
      </div>
    </div>
  );
};

export const VideoGridSkeleton = ({ count = 8 }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "24px",
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const CommentSkeleton = () => {
  return (
    <div style={{ display: "flex", gap: "14px", padding: "12px 0" }}>
      <div
        className="skeleton"
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "var(--radius-full)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className="skeleton" style={{ height: "14px", width: "120px" }} />
        <div className="skeleton" style={{ height: "14px", width: "90%" }} />
        <div className="skeleton" style={{ height: "14px", width: "65%" }} />
      </div>
    </div>
  );
};

export const PostSkeleton = () => {
  return (
    <div
      className="glass-panel"
      style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          className="skeleton"
          style={{ width: "44px", height: "44px", borderRadius: "var(--radius-full)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div className="skeleton" style={{ width: "140px", height: "16px" }} />
          <div className="skeleton" style={{ width: "80px", height: "12px" }} />
        </div>
      </div>
      <div className="skeleton" style={{ width: "100%", height: "60px" }} />
      <div className="skeleton" style={{ width: "100%", height: "240px", borderRadius: "var(--radius-md)" }} />
    </div>
  );
};

export const PlaylistSkeleton = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        className="skeleton"
        style={{
          width: "100%",
          paddingTop: "56.25%",
          borderRadius: "var(--radius-lg)",
        }}
      />
      <div className="skeleton" style={{ height: "16px", width: "75%" }} />
      <div className="skeleton" style={{ height: "12px", width: "40%" }} />
    </div>
  );
};

export const ChannelSkeleton = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        className="skeleton"
        style={{ width: "100%", height: "200px", borderRadius: "var(--radius-xl)" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: "20px", padding: "0 16px" }}>
        <div
          className="skeleton"
          style={{ width: "96px", height: "96px", borderRadius: "var(--radius-full)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="skeleton" style={{ width: "200px", height: "24px" }} />
          <div className="skeleton" style={{ width: "130px", height: "16px" }} />
          <div className="skeleton" style={{ width: "100px", height: "14px" }} />
        </div>
      </div>
    </div>
  );
};
