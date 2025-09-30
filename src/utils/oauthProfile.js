// src/utils/oauthProfile.js
import { supabase } from "../lib/supabase";

/**
 * Extract OAuth profile data from user metadata
 */
export function extractOAuthProfileData(user) {
  if (!user) return { displayName: null, avatarUrl: null, provider: null };

  const provider = user.app_metadata?.provider;
  
  // Extract display name from various OAuth providers
  const displayName = 
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name ||
    null;

  // Extract avatar URL from various OAuth providers
  const avatarUrl = 
    user.user_metadata?.avatar_url || 
    user.user_metadata?.picture ||
    user.user_metadata?.photo ||
    user.user_metadata?.image ||
    null;

  return {
    displayName,
    avatarUrl,
    provider
  };
}

/**
 * Ensure user profile exists with OAuth data
 * This should be called after OAuth login to make sure profile is created/updated
 */
export async function ensureOAuthProfile(user) {
  if (!user?.id) {
    console.log("ensureOAuthProfile: No user provided");
    return;
  }

  try {
    const { displayName, avatarUrl, provider } = extractOAuthProfileData(user);
    
    console.log(`OAuth Profile Sync (${provider || 'unknown'}):`, {
      displayName,
      hasAvatar: !!avatarUrl
    });

    // Check if profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching existing profile:", fetchError);
      return;
    }

    const fallbackName = displayName || user.email?.split("@")[0] || "User";

    // Always update with OAuth data if available
    const updateData = {
      id: user.id,
      display_name: displayName || existingProfile?.display_name || fallbackName,
    };

    // Always try to update avatar if we have one from OAuth
    if (avatarUrl) {
      updateData.avatar_url = avatarUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert(updateData, { onConflict: "id" });

    if (error) {
      console.error("Failed to update OAuth profile:", error);
    } else {
      console.log("OAuth profile updated successfully");
    }

  } catch (error) {
    console.error("Error ensuring OAuth profile:", error);
  }
}
