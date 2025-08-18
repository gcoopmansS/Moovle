// src/constants/app.js

export const APP_CONFIG = {
  // Activity Configuration
  MAX_PARTICIPANTS: 50,
  MIN_PARTICIPANTS: 2,
  DEFAULT_DAYS_AHEAD: 14,
  MAX_DAYS_AHEAD: 30,

  // Activity Types
  ACTIVITY_TYPES: [
    "running",
    "cycling",
    "tennis",
    "football",
    "basketball",
    "swimming",
    "hiking",
    "yoga",
    "gym",
    "other",
  ],

  // UI Configuration
  COLORS: {
    AVATAR_COLORS: [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-cyan-500",
    ],
    PRIMARY: "#3b82f6",
    SUCCESS: "#10b981",
    WARNING: "#f59e0b",
    ERROR: "#ef4444",
  },

  // Validation Rules
  VALIDATION: {
    MIN_TITLE_LENGTH: 3,
    MAX_TITLE_LENGTH: 100,
    MIN_DESCRIPTION_LENGTH: 0,
    MAX_DESCRIPTION_LENGTH: 500,
    MIN_LOCATION_LENGTH: 2,
    MAX_LOCATION_LENGTH: 100,
  },

  // Date/Time
  DATE_FORMATS: {
    DISPLAY: "MMM dd, yyyy",
    TIME: "HH:mm",
    FULL: "MMM dd, yyyy HH:mm",
  },

  // API Configuration
  API: {
    RETRY_ATTEMPTS: 3,
    TIMEOUT: 10000, // 10 seconds
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  },

  // Mobile/PWA
  PWA: {
    THEME_COLOR: "#3b82f6",
    BACKGROUND_COLOR: "#ffffff",
    DISPLAY: "standalone",
  },
};

export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection.",
  UNAUTHORIZED: "You need to be logged in to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  GENERIC: "Something went wrong. Please try again.",
};

export const SUCCESS_MESSAGES = {
  ACTIVITY_JOINED: "Successfully joined the activity!",
  ACTIVITY_LEFT: "Successfully left the activity.",
  ACTIVITY_CREATED: "Activity created successfully!",
  ACTIVITY_UPDATED: "Activity updated successfully!",
  PROFILE_UPDATED: "Profile updated successfully!",
  FRIEND_REQUEST_SENT: "Friend request sent successfully!",
  FRIEND_REQUEST_ACCEPTED: "Friend request accepted!",
  FRIEND_REQUEST_DECLINED: "Friend request declined.",
  FRIEND_REMOVED: "Friend removed successfully.",
};

// Utility functions for constants
export const getAvatarColor = (name) => {
  const colors = APP_CONFIG.COLORS.AVATAR_COLORS;
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index];
};

export const getInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
