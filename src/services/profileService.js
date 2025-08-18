// src/services/profileService.js
import {
  getProfilesByIds,
  searchProfiles,
  updateProfileAvatar,
} from "../api/profiles.js";
import { validateProfile, sanitizeInput } from "../utils/validation.js";
import { SUCCESS_MESSAGES } from "../constants/app.js";

export class ProfileService {
  /**
   * Get multiple user profiles by IDs
   */
  static async getProfilesByIds(userIds) {
    if (!userIds || userIds.length === 0) {
      throw new Error("User IDs are required");
    }

    try {
      const profiles = await getProfilesByIds(userIds);

      // Business logic: Add computed properties
      return profiles.map((profile) => ({
        ...profile,
        initials: this.getInitials(profile.display_name || profile.name || "U"),
        hasAvatar: !!profile.avatar_url,
      }));
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      throw new Error("Unable to load profiles. Please try again.");
    }
  }

  /**
   * Search for profiles
   */
  static async searchProfiles(query, excludeIds = [], limit = 10) {
    if (!query || query.trim().length < 2) {
      throw new Error("Search query must be at least 2 characters");
    }

    try {
      const profiles = await searchProfiles(query.trim(), excludeIds, limit);

      // Business logic: Add computed properties
      return profiles.map((profile) => ({
        ...profile,
        initials: this.getInitials(profile.display_name || profile.name || "U"),
        hasAvatar: !!profile.avatar_url,
      }));
    } catch (error) {
      console.error("Failed to search profiles:", error);
      throw new Error("Unable to search profiles. Please try again.");
    }
  }

  /**
   * Update user avatar
   */
  static async updateAvatar(avatarUrl) {
    if (!avatarUrl) {
      throw new Error("Avatar URL is required");
    }

    try {
      const result = await updateProfileAvatar(avatarUrl);
      return {
        success: true,
        message: "Avatar updated successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Failed to update avatar:", error);
      throw new Error("Unable to update avatar. Please try again.");
    }
  }

  /**
   * Validate profile data
   */
  static validateProfileData(profileData) {
    return validateProfile(profileData);
  }

  /**
   * Sanitize profile input
   */
  static sanitizeProfileData(profileData) {
    return {
      ...profileData,
      display_name: sanitizeInput(profileData.display_name || ""),
      bio: sanitizeInput(profileData.bio || ""),
      location: sanitizeInput(profileData.location || ""),
    };
  }

  /**
   * Utility: Generate initials from name
   */
  static getInitials(name) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Utility: Get human-readable time difference
   */
  static getTimeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return past.toLocaleDateString();
  }
}
