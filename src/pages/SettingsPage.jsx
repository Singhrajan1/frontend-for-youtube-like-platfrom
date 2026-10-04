import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authApi } from "../api/auth.api";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import {
  User,
  Shield,
  Camera,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { getInitials } from "../utils/format";

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("account");

  // Account Details State
  const [fullname, setFullname] = useState(user?.fullname || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);

  // Avatar & Cover Image State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Handle Account Update
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!fullname.trim() && !email.trim()) {
      toast.error("Please enter a name or email to update");
      return;
    }

    setIsUpdatingAccount(true);
    try {
      const updatedUser = await authApi.updateAccountDetails({
        fullname: fullname.trim(),
        email: email.trim(),
      });
      updateUser(updatedUser);
      toast.success("Account details updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update account");
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  // Handle Avatar Upload
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    setIsUploadingAvatar(true);
    try {
      const updatedUser = await authApi.updateAvatar(avatarFile);
      updateUser(updatedUser);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success("Avatar image updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle Cover Image Upload
  const handleUploadCover = async () => {
    if (!coverFile) return;
    setIsUploadingCover(true);
    try {
      const updatedUser = await authApi.updateCoverImage(coverFile);
      updateUser(updatedUser);
      setCoverFile(null);
      setCoverPreview(null);
      toast.success("Cover banner updated!");
    } catch (err) {
      toast.error(err.message || "Failed to upload cover banner");
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password must be different from old password");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  return (
    <div className="settings-page-container">
      <div className="settings-layout">
        {/* Settings Sidebar Tabs */}
        <aside className="settings-nav-sidebar glass-panel">
          <div className="settings-user-card">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="avatar avatar-md"
              />
            ) : (
              <div className="avatar avatar-md avatar-placeholder">
                {getInitials(user?.fullname || user?.username)}
              </div>
            )}
            <div className="settings-user-meta">
              <span className="settings-name">{user?.fullname}</span>
              <span className="settings-handle">@{user?.username}</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          <nav className="settings-tabs-list">
            <button
              onClick={() => setActiveTab("account")}
              className={`settings-tab-btn ${activeTab === "account" ? "active" : ""}`}
            >
              <User size={18} />
              <span>Account Details</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`settings-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            >
              <Camera size={18} />
              <span>Profile & Branding</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`settings-tab-btn ${activeTab === "security" ? "active" : ""}`}
            >
              <KeyRound size={18} />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="settings-tab-btn settings-logout-btn"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Settings Main Content Area */}
        <div className="settings-main-card glass-panel">
          {/* ACCOUNT DETAILS TAB */}
          {activeTab === "account" && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section-title">Account Details</h2>
              <p className="settings-section-desc">
                Update your account name and email address.
              </p>

              <form onSubmit={handleUpdateAccount}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                    style={{ opacity: 0.6, cursor: "not-allowed" }}
                  />
                  <span className="form-hint">Username cannot be changed.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isUpdatingAccount}
                  style={{ marginTop: "12px" }}
                >
                  {isUpdatingAccount ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          )}

          {/* PROFILE & BRANDING TAB */}
          {activeTab === "profile" && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section-title">Profile & Branding</h2>
              <p className="settings-section-desc">
                Customize your channel avatar and header cover banner.
              </p>

              {/* Avatar Update */}
              <div className="branding-item-card">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>
                  Channel Avatar
                </h3>
                <div className="branding-row">
                  <div className="branding-avatar-preview">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="New Avatar"
                        className="avatar avatar-xl"
                      />
                    ) : user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="avatar avatar-xl"
                      />
                    ) : (
                      <div className="avatar avatar-xl avatar-placeholder">
                        {getInitials(user?.username)}
                      </div>
                    )}
                  </div>

                  <div className="branding-controls">
                    <label className="btn btn-secondary btn-sm">
                      <Camera size={16} />
                      <span>Choose Avatar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{ display: "none" }}
                      />
                    </label>

                    {avatarFile && (
                      <button
                        type="button"
                        onClick={handleUploadAvatar}
                        className="btn btn-primary btn-sm"
                        disabled={isUploadingAvatar}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <Save size={16} />
                        )}
                        <span>Upload Avatar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="dropdown-divider" style={{ margin: "24px 0" }} />

              {/* Cover Banner Update */}
              <div className="branding-item-card">
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>
                  Channel Cover Banner
                </h3>
                <div className="branding-cover-preview-box">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="branding-cover-img"
                    />
                  ) : user?.coverImage ? (
                    <img
                      src={user.coverImage}
                      alt="Channel cover"
                      className="branding-cover-img"
                    />
                  ) : (
                    <div className="channel-cover-placeholder" style={{ height: "130px" }} />
                  )}
                </div>

                <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                  <label className="btn btn-secondary btn-sm">
                    <ImageIcon size={16} />
                    <span>Choose Banner</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCoverFile(file);
                          setCoverPreview(URL.createObjectURL(file));
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>

                  {coverFile && (
                    <button
                      type="button"
                      onClick={handleUploadCover}
                      className="btn btn-primary btn-sm"
                      disabled={isUploadingCover}
                    >
                      {isUploadingCover ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Upload Banner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CHANGE PASSWORD TAB */}
          {activeTab === "security" && (
            <div className="settings-section animate-fade-in">
              <h2 className="settings-section-title">Change Password</h2>
              <p className="settings-section-desc">
                Ensure your account stays secure with a strong password.
              </p>

              <form onSubmit={handleChangePassword} style={{ maxWidth: "420px" }}>
                <div className="form-group">
                  <label className="form-label">Current Password *</label>
                  <input
                    type="password"
                    placeholder="Enter existing password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password *</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={
                    isChangingPassword ||
                    !oldPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  style={{ marginTop: "12px" }}
                >
                  {isChangingPassword ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <KeyRound size={16} />
                  )}
                  <span>Update Password</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <ConfirmModal
          isOpen={isLogoutModalOpen}
          onClose={() => setIsLogoutModalOpen(false)}
          onConfirm={handleConfirmLogout}
          title="Sign Out"
          message="Are you sure you want to log out of your Vortex Stream account?"
          confirmText="Sign Out"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};
