// src/services/activityService.js
import {
  fetchFeed,
  joinActivity as apiJoinActivity,
  leaveActivity as apiLeaveActivity,
  createActivity as apiCreateActivity,
} from "../api/activities.js";

export class ActivityService {
  /**
   * Join an activity with validation
   */
  static async joinActivity(activityId, userId) {
    if (!activityId || !userId) {
      throw new Error("Activity ID and User ID are required");
    }

    try {
      // Could add business logic here like:
      // - Check if activity is full
      // - Check if user is already joined
      // - Validate user permissions

      const result = await apiJoinActivity({
        activity_id: activityId,
        user_id: userId,
      });
      return result;
    } catch (error) {
      console.error("Failed to join activity:", error);
      throw new Error("Unable to join activity. Please try again.");
    }
  }

  /**
   * Leave an activity with validation
   */
  static async leaveActivity(activityId, userId) {
    if (!activityId || !userId) {
      throw new Error("Activity ID and User ID are required");
    }

    try {
      const result = await apiLeaveActivity({
        activity_id: activityId,
        user_id: userId,
      });
      return result;
    } catch (error) {
      console.error("Failed to leave activity:", error);
      throw new Error("Unable to leave activity. Please try again.");
    }
  }

  /**
   * Get activity feed with business logic
   */
  static async getActivityFeed(options = {}) {
    const { daysAhead = 14, currentUserId } = options;

    try {
      const activities = await fetchFeed({ daysAhead, currentUserId });

      // Business logic: Filter, sort, or enhance activities
      return activities.map((activity) => ({
        ...activity,
        // Add computed properties if needed
        isUpcoming: new Date(activity.date) > new Date(),
        spotsLeft:
          activity.max_participants - (activity.participants?.length || 0),
      }));
    } catch (error) {
      console.error("Failed to fetch activity feed:", error);
      throw new Error("Unable to load activities. Please try again.");
    }
  }

  /**
   * Validate activity data before creation/update
   */
  static validateActivityData(data) {
    const errors = [];

    if (!data.title?.trim()) {
      errors.push("Title is required");
    }

    if (!data.starts_at) {
      errors.push("Date is required");
    } else if (new Date(data.starts_at) < new Date()) {
      errors.push("Date must be in the future");
    }

    if (!data.max_participants || data.max_participants < 2) {
      errors.push("Must allow at least 2 participants");
    }

    if (data.max_participants > 50) {
      errors.push("Maximum 50 participants allowed");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a new activity with validation
   */
  static async createActivity(activityData) {
    // Validate the activity data
    const validation = this.validateActivityData(activityData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    try {
      const result = await apiCreateActivity(activityData);
      return {
        success: true,
        message: "Activity created successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Failed to create activity:", error);
      throw new Error("Unable to create activity. Please try again.");
    }
  }

  /**
   * Utility: Generate initials from name
   */
  static getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Utility: Generate avatar color based on name
   */
  static getAvatarColor(name) {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-teal-500",
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
