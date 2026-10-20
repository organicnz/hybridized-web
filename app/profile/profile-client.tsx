"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { getSupabase } from "@/lib/supabase/client";
import { compressImage, validateImageFile } from "@/lib/utils/image-compression";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle,
  LogOut,
  Mail,
  Save,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export function ProfileContent() {
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
  const router = useRouter();

  // Update fullName and check email verification when profile loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }

    // Check if email is verified
    if (user?.email_confirmed_at) {
      setEmailVerified(true);
    }
  }, [profile, user]);

  // Get avatar URL with cache busting (memoized to prevent constant re-renders)
  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;
    const url = `${profile.avatar_url}?t=${Date.now()}`;
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
      const supabase = await getSupabase();
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

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({
        avatar_url: publicUrl,
      });

      if (updateError) {
        console.error("Error updating profile:", updateError);
        throw updateError;
      }

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
      const supabase = await getSupabase();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch {
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
      const supabase = await getSupabase();
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
      setError(err instanceof Error ? err.message : "Failed to resend verification");
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <div className="section-container py-10 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm text-muted-foreground ring-1 ring-border backdrop-blur-md transition-colors hover:text-foreground group"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            Back to Home
          </Link>
        </div>

        <div className="glass rounded-2xl p-6 sm:p-8">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground">
            Profile Settings
          </h1>

          {error && (
            <div
              className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <output className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                aria-hidden="true"
              />
              <p className="text-sm text-foreground">Profile updated successfully!</p>
            </output>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar Upload */}
            <div className="mb-8 flex flex-col items-center">
              <div className="relative group">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-purple-500/20 to-pink-500/20 ring-2 ring-border">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile avatar"
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                      unoptimized
                      key={avatarUrl}
                    />
                  ) : (
                    <User className="h-16 w-16 text-primary/50" aria-hidden="true" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="btn btn-primary absolute bottom-0 right-0 h-10 w-10 rounded-full p-0 shadow-glow"
                  aria-label="Upload avatar"
                >
                  {uploadingAvatar ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  ) : (
                    <Camera className="h-5 w-5" aria-hidden="true" />
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
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Click camera icon to upload avatar
                <br />
                Max 5MB • JPEG, PNG, or WebP
              </p>
            </div>

            <div>
              <label htmlFor="email" className="label mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="input cursor-not-allowed pl-10 opacity-60"
                />
                {emailVerified && (
                  <CheckCircle
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-500"
                    aria-hidden="true"
                  />
                )}
              </div>
              {emailVerified ? (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle className="h-3 w-3" aria-hidden="true" />
                  Email verified
                </p>
              ) : (
                <div className="mt-2">
                  <p className="mb-1.5 text-xs text-amber-500">
                    Email not verified. Please check your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification}
                    className="rounded-md text-xs font-medium text-primary hover:underline disabled:opacity-50"
                  >
                    {resendingVerification ? "Sending..." : "Resend verification email"}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="fullName" className="label mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="input pl-10"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg flex w-full items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" aria-hidden="true" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <div className="mt-8 border-t border-border pt-8">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-outline flex w-full items-center justify-center gap-2 border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-5 w-5" aria-hidden="true" />
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
