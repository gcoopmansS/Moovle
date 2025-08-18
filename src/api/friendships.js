// src/api/friendships.js
import { supabase } from "../lib/supabase";
import {
  createFriendRequestNotification,
  createFriendRequestAcceptedNotification,
} from "./notifications";
import { getProfilesByIds } from "./profiles";

// Keep edges canonical to avoid duplicates
function canonical(a, b) {
  return [a, b].sort(); // [user_a, user_b]
}

export async function listFriendships(meId) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`user_a.eq.${meId},user_b.eq.${meId}`);
  if (error) throw error;
  return data ?? [];
}

export async function sendFriendRequest(meId, otherId) {
  console.log("🚀 Sending friend request:", { meId, otherId });

  const [user_a, user_b] = canonical(meId, otherId);
  const { error } = await supabase.from("friendships").insert({
    user_a,
    user_b,
    status: "pending",
    requested_by: meId,
  });

  console.log("📝 Friendship insert result:", { error });

  // ignore unique violation (already requested)
  if (error && error.code !== "23505") throw error;

  // Only create notification if the friendship was actually created (not a duplicate)
  if (!error) {
    try {
      console.log("👤 Getting sender profile...");
      // Get sender's profile to include name in notification
      const senderProfiles = await getProfilesByIds([meId]);
      const senderName = senderProfiles[0]?.display_name || "Someone";

      console.log("📧 Creating notification:", { otherId, meId, senderName });
      // Create notification for the recipient
      await createFriendRequestNotification(otherId, meId, senderName);
      console.log("✅ Notification created successfully");
    } catch (notificationError) {
      console.error(
        "❌ Failed to create friend request notification:",
        notificationError
      );
      // Don't throw error here - the friend request was successful even if notification failed
    }
  } else {
    console.log("⚠️ Friend request not sent (duplicate or error)");
  }
}

export async function acceptFriendRequest(meId, otherId) {
  const [user_a, user_b] = canonical(meId, otherId);
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_a", user_a)
    .eq("user_b", user_b);
  if (error) throw error;

  try {
    // Get acceptor's profile to include name in notification
    const acceptorProfiles = await getProfilesByIds([meId]);
    const acceptorName = acceptorProfiles[0]?.display_name || "Someone";

    // Create notification for the original sender
    await createFriendRequestAcceptedNotification(otherId, meId, acceptorName);
  } catch (notificationError) {
    console.error(
      "Failed to create friend request accepted notification:",
      notificationError
    );
    // Don't throw error here - the acceptance was successful even if notification failed
  }
}

export async function declineFriendRequest(meId, otherId) {
  // Delete the pending request instead of marking as blocked
  // This allows the person to be discovered again in the future
  const [user_a, user_b] = canonical(meId, otherId);

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .eq("status", "pending");

  if (error) throw error;
}

// Optional: Block a user (prevents them from appearing in discovery)
export async function blockUser(meId, otherId) {
  console.log("🚫 Blocking user:", { meId, otherId });

  const [user_a, user_b] = canonical(meId, otherId);

  // First delete any existing relationship
  await supabase
    .from("friendships")
    .delete()
    .eq("user_a", user_a)
    .eq("user_b", user_b);

  // Then create a blocked relationship
  const { error } = await supabase.from("friendships").insert({
    user_a,
    user_b,
    status: "blocked",
    requested_by: meId,
  });

  console.log("🚫 Block result:", { error });
  if (error) throw error;
}
