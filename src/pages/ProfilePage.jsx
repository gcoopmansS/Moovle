import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { supabase } from "../lib/supabase";
import { Camera, Save, User, LogOut } from "lucide-react";
import LocationInput from "../components/LocationInput";

export default function ProfilePage({ onProfileUpdate }) {
  const { user, signOut } = useSupabaseAuth();
  const [profile, setProfile] = useState({
    display_name: "",
    avatar_url: "",
    location: null, // Will be { place_name, lat, lng } or null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const fileRef = useRef(null);

  // Helper to detect OAuth provider
  const getOAuthProvider = () => {
    if (user?.app_metadata?.provider === "google") return "Google";
    if (user?.app_metadata?.provider === "facebook") return "Facebook";
    return null;
  };

  // Helper to check if avatar is from OAuth
  const isOAuthAvatar = () => {
    const oauthAvatar =
      user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
    return profile.avatar_url === oauthAvatar;
  };

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "display_name, avatar_url, location, location_lat, location_lng"
        )
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        // Convert location data to LocationInput format
        let locationObj = null;
        if (data.location) {
          locationObj = {
            place_name: data.location,
            lat: data.location_lat || null,
            lng: data.location_lng || null,
          };
        }

        // Get OAuth data for fallbacks
        const oauthDisplayName =
          user.user_metadata?.full_name || user.user_metadata?.name;
        const oauthAvatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture;

        setProfile({
          display_name: data.display_name || oauthDisplayName || "",
          avatar_url: data.avatar_url || oauthAvatar || "",
          location: locationObj,
        });
      } else {
        // No profile exists - create one with OAuth data if available
        const oauthDisplayName =
          user.user_metadata?.full_name || user.user_metadata?.name;
        const oauthAvatar =
          user.user_metadata?.avatar_url || user.user_metadata?.picture;
        const fallbackName =
          oauthDisplayName || user.email?.split("@")[0] || "User";

        await supabase.from("profiles").upsert(
          {
            id: user.id,
            display_name: fallbackName,
            avatar_url: oauthAvatar || null,
          },
          { onConflict: "id" }
        );
        setProfile((p) => ({
          ...p,
          display_name: fallbackName,
          avatar_url: oauthAvatar || "",
        }));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadProfile();
  }, [user, loadProfile]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!profile.display_name.trim()) {
      setMessage("Display name is required");
      return;
    }

    try {
      setSaving(true);
      setMessage("");
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          display_name: profile.display_name.trim(),
          avatar_url: profile.avatar_url || null,
          location: profile.location?.place_name || null,
          location_lat: profile.location?.lat || null,
          location_lng: profile.location?.lng || null,
        },
        { onConflict: "id" }
      );
      if (error) throw error;
      setMessage("Profile saved successfully!");

      // Notify parent component to refresh the user profile
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      setMessage(
        "Error saving profile: " + (error?.message || "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  }

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic validation
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setMessage("Please choose an image (png, jpg, webp, gif).");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setMessage("Max image size is 3MB.");
      return;
    }

    setUploading(true);
    setMessage("");
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar.${ext}`;

      // Upload (overwrite previous)
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadErr) throw uploadErr;

      // If bucket is PRIVATE, use signed URL instead:
      const { data: signed, error: signErr } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signErr) throw signErr;
      const publicUrl = signed.signedUrl;

      console.log("Generated signed avatar URL:", publicUrl);
      console.log("Upload path:", path);

      // If bucket is PUBLIC:
      // const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      // const publicUrl = pub?.publicUrl;

      // Persist on profile
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (upErr) throw upErr;

      // Update UI
      setProfile((p) => ({ ...p, avatar_url: publicUrl }));
      setMessage("Avatar updated!");

      // Notify parent component to refresh the user profile
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (err) {
      console.error(err);
      setMessage("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
      // reset the input so picking the same file again re-triggers change
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
        <p className="text-gray-600">Update your personal information</p>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6">
        <form onSubmit={saveProfile} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-gray-200 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-gray-200 bg-gray-100 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors disabled:opacity-60"
                disabled={uploading}
                title="Change photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              {/* hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickFile}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {uploading
                ? "Uploading…"
                : isOAuthAvatar() && getOAuthProvider()
                ? `Using ${getOAuthProvider()} profile photo - click camera to change`
                : "Click the camera to change photo"}
            </p>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            {/* OAuth Provider Info */}
            {getOAuthProvider() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">
                    Connected via {getOAuthProvider()}
                  </span>
                  {(user?.user_metadata?.full_name ||
                    user?.user_metadata?.name) &&
                    " - Profile information has been pre-filled from your account"}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your display name"
                value={profile.display_name}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div>
              <LocationInput
                value={profile.location}
                onChange={(locationData) =>
                  setProfile((prev) => ({
                    ...prev,
                    location: locationData,
                  }))
                }
                required={false}
                label="Location"
                placeholder="Where are you from? (e.g., New York, Berlin, Tokyo)"
              />
              <p className="text-xs text-gray-500 mt-1">
                Help other sports buddies find you nearby
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                value={user?.email || ""}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-500 text-white p-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Profile"}
          </button>

          {/* Message */}
          {message && (
            <div
              className={`text-center text-sm ${
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("updated")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </div>
          )}
        </form>

        {/* Sign Out */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={signOut}
            className="w-full bg-gray-200 text-gray-700 p-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
