import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  FastForward,
  Settings,
  PictureInPicture,
} from "lucide-react";
import { formatDuration } from "../../utils/format";

export const VideoPlayer = ({ src, poster, title, autoPlay = true }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, []);

  // Seek handler
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  // Volume handler
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  // Speed change
  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  // Controls auto-hide
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 2500);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in input or textarea
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;

      if (e.code === "Space" || e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime -= 5;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (videoRef.current) videoRef.current.currentTime += 5;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`player-container ${isFullscreen ? "player-fullscreen" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="player-video"
        playsInline
        autoPlay={autoPlay}
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="player-buffering-overlay">
          <div className="player-spinner" />
        </div>
      )}

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="player-big-play-btn animate-fade-in"
          aria-label="Play video"
        >
          <Play size={36} fill="#ffffff" />
        </button>
      )}

      {/* Controls Overlay */}
      <div
        className={`player-controls-overlay ${
          showControls || !isPlaying ? "player-controls-visible" : "player-controls-hidden"
        }`}
      >
        {/* Progress Bar */}
        <div className="player-progress-bar-container">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="player-progress-slider"
            style={{
              background: `linear-gradient(to right, var(--accent-primary) ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%)`,
            }}
            aria-label="Seek video"
          />
        </div>

        {/* Bottom Control Bar */}
        <div className="player-controls-bar">
          {/* Left Controls: Play, Volume, Time */}
          <div className="player-controls-left">
            <button
              onClick={togglePlay}
              className="player-btn"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>

            {/* Volume */}
            <div className="player-volume-group">
              <button
                onClick={toggleMute}
                className="player-btn"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : volume < 0.5 ? (
                  <Volume1 size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="player-volume-slider"
                aria-label="Volume"
              />
            </div>

            {/* Time Stamp */}
            <div className="player-time-display">
              <span>{formatDuration(currentTime)}</span>
              <span className="player-time-separator">/</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed, PiP, Fullscreen */}
          <div className="player-controls-right">
            {/* Speed Selector */}
            <div className="player-speed-menu-wrapper">
              <button
                onClick={() => setShowSpeedMenu((prev) => !prev)}
                className="player-btn player-speed-btn"
                aria-label="Playback speed"
              >
                <span>{playbackRate === 1 ? "1x" : `${playbackRate}x`}</span>
              </button>

              {showSpeedMenu && (
                <div className="player-speed-dropdown glass-panel animate-fade-in">
                  <div className="player-speed-title">Playback Speed</div>
                  {speedOptions.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`player-speed-option ${playbackRate === speed ? "active" : ""}`}
                    >
                      {speed === 1 ? "Normal (1x)" : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            {"pictureInPictureEnabled" in document && (
              <button
                onClick={togglePiP}
                className="player-btn"
                aria-label="Picture in Picture"
                title="Picture in Picture"
              >
                <PictureInPicture size={18} />
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="player-btn"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              title="Fullscreen (f)"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
