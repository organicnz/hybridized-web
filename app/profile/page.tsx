"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  User,
  Mail,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  compressImage,
  validateImageFile,
} from "@/lib/utils/image-compression";

function ProfileContent() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Update fullName and check email verification when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    console.log("Profile loaded:", profile);

    // Check if email is verified
    if (user?.email_confirmed_at) {
      setEmailVerified(true);
    }
  }, [profile, user]);

  // Get avatar URL with cache busting (memoized to prevent constant re-renders)
  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;
    const url = `${profile.avatar_url}?t=${Date.now()}`;
    console.log("Avatar URL:", url);
    return url;
  }, [profile?.avatar_url]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploadingAvatar(true);
    setError(null);

    try {
      // Compress image
      const compressedBlob = await compressImage(file, 400, 400, 0.85);

      // Generate file path: avatars/{user_id}/avatar.jpg
      const fileExt = "jpg";
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      console.log("Uploading avatar, public URL:", publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

      console.log("Avatar uploaded successfully");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const { error } = await updateProfile({ full_name: fullName });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setError(null);

    try {
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (err) {
      setError("Failed to sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendingVerification(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to resend verification",
      );
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/home"
            className="text-purple-200/70 hover:text-white transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            Profile Settings
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-200 text-sm">
                Profile updated successfully!
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/30 flex items-center justify-center">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                      unoptimized
                      key={avatarUrl}
                    />
                  ) : (
                    <User className="w-16 h-16 text-purple-300/50" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                  aria-label="Upload avatar"
                >
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                aria-label="Avatar file input"
              />
              <p className="text-xs text-purple-200/50 mt-3 text-center">
                Click camera icon to upload avatar
                <br />
                Max 5MB • JPEG, PNG, or WebP
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-white font-medium mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white/50 cursor-not-allowed"
                />
                {emailVerified && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
                )}
              </div>
              {emailVerified ? (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Email verified
                </p>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-yellow-400 mb-2">
                    Email not verified. Please check your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="text-xs text-purple-400 hover:text-pink-400 hover:underline transition-colors disabled:opacity-50"
                  >
                    {resendingVerification
                      ? "Sending..."
                      : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-white font-medium mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-black/30 border border-purple-500/30 rounded-lg text-white placeholder:text-purple-300/50 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-purple-500/50"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:scale-105 transition-all shadow-lg shadow-purple-500/50 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-purple-500/20">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-full font-semibold hover:bg-red-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
