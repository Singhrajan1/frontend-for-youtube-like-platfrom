import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { videoApi } from "../api/video.api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  UploadCloud,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

export const UploadPage = () => {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Upload Progress & State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [bytesUploaded, setBytesUploaded] = useState({ loaded: 0, total: 0 });
  const [error, setError] = useState(null);

  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file (MP4, WebM, etc.)");
        return;
      }
      setVideoFile(file);
      // Default title to video filename without extension if empty
      if (!title) {
        const defaultTitle = file.name.replace(/\.[^/.]+$/, "");
        setTitle(defaultTitle);
      }
    }
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file (JPG, PNG, WebP)");
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Please select a video file to upload");
      return;
    }
    if (!thumbnailFile) {
      setError("Please select a thumbnail image for your video");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Both title and description are required");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadPercent(0);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("videoFile", videoFile);
    formData.append("thumbnail", thumbnailFile);

    try {
      const createdVideo = await videoApi.publishVideo(
        formData,
        (percent, loaded, total) => {
          setUploadPercent(percent);
          setBytesUploaded({ loaded, total });
        }
      );

      toast.success("Video published successfully!", "Upload Complete");
      if (createdVideo?._id) {
        navigate(`/watch/${createdVideo._id}`);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Failed to upload video to Cloudinary");
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="upload-page-container">
      <div className="upload-card glass-panel animate-fade-in">
        <div className="upload-header">
          <div className="upload-header-icon">
            <UploadCloud size={32} />
          </div>
          <div>
            <h1 className="upload-title">Upload Video</h1>
            <p className="upload-subtitle">
              Publish high quality videos to your channel and reach viewers
            </p>
          </div>
        </div>

        {error && (
          <div className="upload-error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* File Picker Cards */}
          <div className="upload-files-row">
            {/* Video File Picker */}
            <div
              className={`upload-dropzone ${videoFile ? "has-file" : ""}`}
              onClick={() => videoInputRef.current?.click()}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                style={{ display: "none" }}
                disabled={isUploading}
              />
              <Film size={36} className="dropzone-icon" />
              {videoFile ? (
                <div className="dropzone-file-info">
                  <span className="dropzone-filename">{videoFile.name}</span>
                  <span className="dropzone-filesize">
                    {formatBytes(videoFile.size)}
                  </span>
                  <span className="dropzone-change-text">Click to change video</span>
                </div>
              ) : (
                <div className="dropzone-placeholder">
                  <span className="dropzone-main-text">Select Video File</span>
                  <span className="dropzone-sub-text">MP4, WebM, MKV up to 100MB</span>
                </div>
              )}
            </div>

            {/* Thumbnail File Picker */}
            <div
              className={`upload-dropzone thumbnail-dropzone ${
                thumbnailFile ? "has-file" : ""
              }`}
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                style={{ display: "none" }}
                disabled={isUploading}
              />
              {thumbnailPreview ? (
                <div className="thumbnail-preview-wrapper">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail Preview"
                    className="thumbnail-preview-img"
                  />
                  <div className="thumbnail-overlay-badge badge badge-dark">
                    Change Thumbnail
                  </div>
                </div>
              ) : (
                <>
                  <ImageIcon size={36} className="dropzone-icon" />
                  <div className="dropzone-placeholder">
                    <span className="dropzone-main-text">Select Thumbnail</span>
                    <span className="dropzone-sub-text">JPG, PNG 16:9 ratio</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Video Metadata Inputs */}
          <div className="form-group">
            <label className="form-label">Video Title *</label>
            <input
              type="text"
              placeholder="Give your video a catchy, descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              placeholder="Tell viewers what your video is about, include timestamps, links or credits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              rows={4}
              required
            />
          </div>

          {/* Real-time Upload Progress Bar */}
          {isUploading && (
            <div className="upload-progress-container animate-fade-in">
              <div className="progress-label-row">
                <span className="progress-status-text">
                  {uploadPercent < 100 ? "Uploading to Cloudinary..." : "Processing video details..."}
                </span>
                <span className="progress-percent-text">{uploadPercent}%</span>
              </div>

              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${uploadPercent}%` }}
                />
              </div>

              {bytesUploaded.total > 0 && (
                <div className="progress-bytes-text">
                  {formatBytes(bytesUploaded.loaded)} of {formatBytes(bytesUploaded.total)} uploaded
                </div>
              )}
            </div>
          )}

          {/* Submit Actions */}
          <div className="upload-form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={isUploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isUploading || !videoFile || !thumbnailFile || !title.trim()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={20} />
                  <span>Publish Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
