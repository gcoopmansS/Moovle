// src/api/notifications.js
import { supabase } from "../lib/supabase";

export async function createNotification(
  userId,
  type,
  title,
  message,
  metadata = {}
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata,
      read: false,
      // Let the database set created_at with its default value
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Test function to debug notification creation
export async function testNotificationCreation() {
  // First check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  console.log("🔐 Auth check:", { user: user?.id, authError });

  if (!user) {
    console.log("❌ No authenticated user");
    return;
  }

  console.log("🧪 Testing notification creation for user:", user.id);

  try {
    const result = await createNotification(
      user.id,
      "test",
      "Test Notification",
      "This is a test notification to debug the system",
      { test: true }
    );
    console.log("✅ Test notification created successfully:", result);
    return result;
  } catch (error) {
    console.error("❌ Test notification failed:", error);
    throw error;
  }
}

// Make test function available globally for debugging
if (typeof window !== "undefined") {
  window.testNotificationCreation = testNotificationCreation;
}

export async function getUserNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(notificationId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
}

export async function getUnreadNotificationCount(userId) {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);

  if (error) throw error;
  return count ?? 0;
}

// Friend request specific notifications
export async function createFriendRequestNotification(
  recipientId,
  senderId,
  senderName
) {
  return createNotification(
    recipientId,
    "friend_request",
    "New Friend Request",
    `${senderName} sent you a friend request`,
    { sender_id: senderId, sender_name: senderName }
  );
}

export async function createFriendRequestAcceptedNotification(
  senderId,
  acceptorId,
  acceptorName
) {
  return createNotification(
    senderId,
    "friend_request_accepted",
    "Friend Request Accepted",
    `${acceptorName} accepted your friend request`,
    { acceptor_id: acceptorId, acceptor_name: acceptorName }
  );
}

// Make test functions available globally for debugging
if (typeof window !== "undefined") {
  window.testNotificationCreation = testNotificationCreation;
  window.createNotification = createNotification;
}
