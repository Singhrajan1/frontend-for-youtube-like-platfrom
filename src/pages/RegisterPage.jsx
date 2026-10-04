import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  UserPlus,
  Eye,
  EyeOff,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export const RegisterPage = () => {
  const { register, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Files State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Avatar must be an image file");
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Cover must be an image file");
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullname.trim() || !username.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields");
      return;
    }

    if (!avatarFile) {
      setError("Please select a profile avatar image (required by backend)");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("fullname", fullname.trim());
    formData.append("username", username.toLowerCase().trim());
    formData.append("email", email.toLowerCase().trim());
    formData.append("password", password);
    formData.append("avatar", avatarFile);
    if (coverFile) {
      formData.append("coverImage", coverFile);
    }

    try {
      await register(formData);
      toast.success("Account created successfully! Logging you in...");

      // Automatically sign the user in with the credentials
      try {
        await login({
          username: username.toLowerCase().trim(),
          password,
        });
        navigate("/");
      } catch {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your information.");
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card auth-card-wide glass-panel animate-fade-in">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-logo">
            <svg viewBox="0 0 32 32" width="32" height="32">
              <defs>
                <linearGradient id="regGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff3b5c" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#regGrad)" />
              <polygon points="12,9 23,16 12,23" fill="#ffffff" />
            </svg>
            <span className="auth-brand-name">VORTEX.</span>
          </Link>

          <h1 className="auth-title">Create Your Channel</h1>
          <p className="auth-subtitle">
            Join thousands of creators sharing videos, building community, and discovering content
          </p>
        </div>

        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Avatar and Cover Image Upload Row */}
          <div className="register-images-section">
            <div className="register-avatar-picker">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                style={{ display: "none" }}
              />
              <div
                className={`register-avatar-circle ${avatarPreview ? "has-avatar" : ""}`}
                onClick={() => avatarInputRef.current?.click()}
                title="Click to choose profile avatar (Required)"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="register-avatar-img"
                  />
                ) : (
                  <div className="register-avatar-empty">
                    <Camera size={24} />
                    <span>Avatar *</span>
                  </div>
                )}
              </div>
            </div>

            <div className="register-cover-picker">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                style={{ display: "none" }}
              />
              <div
                className="register-cover-box"
                onClick={() => coverInputRef.current?.click()}
                title="Click to choose channel cover banner (Optional)"
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="register-cover-img"
                  />
                ) : (
                  <div className="register-cover-empty">
                    <ImageIcon size={20} />
                    <span>Channel Cover Banner (Optional)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="register-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Alex Mercer"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Username *</label>
              <input
                type="text"
                placeholder="e.g. alexmercer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Creating Account & Uploading Media...</span>
              </>
            ) : (
              <>
                <UserPlus size={20} />
                <span>Create Channel</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
