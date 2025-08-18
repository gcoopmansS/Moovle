// src/utils/validation.js
import { APP_CONFIG, ERROR_MESSAGES } from "../constants/app.js";

/**
 * Validate activity data
 */
export const validateActivity = (data) => {
  const errors = [];
  const { VALIDATION } = APP_CONFIG;

  // Title validation
  if (!data.title?.trim()) {
    errors.push("Title is required");
  } else if (data.title.trim().length < VALIDATION.MIN_TITLE_LENGTH) {
    errors.push(
      `Title must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters`
    );
  } else if (data.title.trim().length > VALIDATION.MAX_TITLE_LENGTH) {
    errors.push(
      `Title must be less than ${VALIDATION.MAX_TITLE_LENGTH} characters`
    );
  }

  // Date validation
  if (!data.date) {
    errors.push("Date is required");
  } else if (new Date(data.date) < new Date()) {
    errors.push("Date must be in the future");
  }

  // Participants validation
  if (!data.max_participants) {
    errors.push("Maximum participants is required");
  } else if (data.max_participants < APP_CONFIG.MIN_PARTICIPANTS) {
    errors.push(
      `Must allow at least ${APP_CONFIG.MIN_PARTICIPANTS} participants`
    );
  } else if (data.max_participants > APP_CONFIG.MAX_PARTICIPANTS) {
    errors.push(`Maximum ${APP_CONFIG.MAX_PARTICIPANTS} participants allowed`);
  }

  // Location validation
  if (data.location && data.location.length > VALIDATION.MAX_LOCATION_LENGTH) {
    errors.push(
      `Location must be less than ${VALIDATION.MAX_LOCATION_LENGTH} characters`
    );
  }

  // Description validation
  if (
    data.description &&
    data.description.length > VALIDATION.MAX_DESCRIPTION_LENGTH
  ) {
    errors.push(
      `Description must be less than ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`
    );
  }

  // Activity type validation
  if (
    data.activity_type &&
    !APP_CONFIG.ACTIVITY_TYPES.includes(data.activity_type)
  ) {
    errors.push("Invalid activity type");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate profile data
 */
export const validateProfile = (data) => {
  const errors = [];

  if (!data.display_name?.trim()) {
    errors.push("Display name is required");
  } else if (data.display_name.trim().length < 2) {
    errors.push("Display name must be at least 2 characters");
  } else if (data.display_name.trim().length > 50) {
    errors.push("Display name must be less than 50 characters");
  }

  // Email validation (basic)
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Please enter a valid email address");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML
    .slice(0, 1000); // Limit length
};

/**
 * Validate date is in future
 */
export const isValidFutureDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate > now;
};

/**
 * Check if user can join activity
 */
export const canJoinActivity = (activity, currentUserId) => {
  const errors = [];

  if (!currentUserId) {
    errors.push("You must be logged in to join activities");
    return { canJoin: false, errors };
  }

  if (activity.creator_id === currentUserId) {
    errors.push("You cannot join your own activity");
  }

  if (activity.participants?.some((p) => p.user_id === currentUserId)) {
    errors.push("You are already joined to this activity");
  }

  if (activity.participants?.length >= activity.max_participants) {
    errors.push("This activity is full");
  }

  if (!isValidFutureDate(activity.date)) {
    errors.push("This activity has already passed");
  }

  return {
    canJoin: errors.length === 0,
    errors,
  };
};

/**
 * Check if user can leave activity
 */
export const canLeaveActivity = (activity, currentUserId) => {
  const errors = [];

  if (!currentUserId) {
    errors.push("You must be logged in");
    return { canLeave: false, errors };
  }

  if (activity.creator_id === currentUserId) {
    errors.push("Activity creators cannot leave their own activity");
  }

  if (!activity.participants?.some((p) => p.user_id === currentUserId)) {
    errors.push("You are not joined to this activity");
  }

  return {
    canLeave: errors.length === 0,
    errors,
  };
};
