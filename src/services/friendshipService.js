// src/services/friendshipService.js
import {
  sendFriendRequest as apiSendFriendRequest,
  acceptFriendRequest as apiAcceptFriendRequest,
  declineFriendRequest as apiDeclineFriendRequest,
  listFriendships,
} from "../api/friendships.js";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/app.js";

export class FriendshipService {
  /**
   * Send a friend request with validation
   */
  static async sendFriendRequest(fromUserId, toUserId) {
    if (!fromUserId || !toUserId) {
      throw new Error("Both user IDs are required");
    }

    if (fromUserId === toUserId) {
      throw new Error("You cannot send a friend request to yourself");
    }

    try {
      // Business logic: Check if request already exists
      // Could add rate limiting, spam prevention, etc.

      const result = await apiSendFriendRequest(fromUserId, toUserId);
      return {
        success: true,
        message: "Friend request sent successfully!",
        data: result,
      };
    } catch (error) {
      console.error("Failed to send friend request:", error);
      throw new Error("Unable to send friend request. Please try again.");
    }
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(requestId, userId) {
    if (!requestId || !userId) {
      throw new Error("Request ID and User ID are required");
    }

    try {
      const result = await apiAcceptFriendRequest(requestId, userId);
      return {
        success: true,
        message:
          SUCCESS_MESSAGES.FRIEND_REQUEST_ACCEPTED ||
          "Friend request accepted!",
        data: result,
      };
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      throw new Error("Unable to accept friend request. Please try again.");
    }
  }

  /**
   * Decline a friend request
   */
  static async declineFriendRequest(requestId, userId) {
    if (!requestId || !userId) {
      throw new Error("Request ID and User ID are required");
    }

    try {
      const result = await apiDeclineFriendRequest(requestId, userId);
      return {
        success: true,
        message: "Friend request declined.",
        data: result,
      };
    } catch (error) {
      console.error("Failed to decline friend request:", error);
      throw new Error("Unable to decline friend request. Please try again.");
    }
  }

  /**
   * Get user's friends with enhanced data
   */
  static async getFriends(userId) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    try {
      const friends = await listFriendships(userId);

      // Business logic: Add computed properties, sort, filter
      return friends
        .map((friend) => ({
          ...friend,
          initials: this.getInitials(friend.display_name || friend.name || "U"),
          isOnline: friend.last_seen
            ? this.isRecentlyActive(friend.last_seen)
            : false,
          mutualFriends: friend.mutual_friends_count || 0,
        }))
        .sort((a, b) => {
          // Sort online friends first, then alphabetically
          if (a.isOnline !== b.isOnline) {
            return b.isOnline - a.isOnline;
          }
          return (a.display_name || a.name || "").localeCompare(
            b.display_name || b.name || ""
          );
        });
    } catch (error) {
      console.error("Failed to fetch friends:", error);
      throw new Error("Unable to load friends. Please try again.");
    }
  }

  /**
   * Check friendship status between two users
   */
  static async getFriendshipStatus(userId1, userId2) {
    try {
      // This would need a corresponding API function
      // Could return: 'friends', 'pending_sent', 'pending_received', 'none'

      const friends = await this.getFriends(userId1);
      const isFriend = friends.some((friend) => friend.id === userId2);

      if (isFriend) return "friends";

      // Note: Friend request status checking would need additional API endpoints
      // For now, we can only check if users are already friends
      return "none";
    } catch (error) {
      console.error("Failed to check friendship status:", error);
      return "unknown";
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
   * Utility: Check if user was recently active (within last 15 minutes)
   */
  static isRecentlyActive(lastSeen) {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return new Date(lastSeen) > fifteenMinutesAgo;
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
