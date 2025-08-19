// src/api/activityInvitations.js
import { supabase } from "../lib/supabase";

/**
 * Send invitations to specific friends for an activity
 */
export async function sendActivityInvitations(
  activityId,
  invitedUserIds,
  invitedBy
) {
  if (!activityId || !invitedUserIds?.length || !invitedBy) {
    throw new Error("Activity ID, invited users, and inviter are required");
  }

  // Create invitation records for each invited friend
  const invitations = invitedUserIds.map((userId) => ({
    activity_id: activityId,
    invited_user_id: userId,
    invited_by: invitedBy,
    status: "pending",
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("activity_invitations")
    .insert(invitations)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get pending invitations for a user
 */
export async function getUserInvitations(userId) {
  const { data, error } = await supabase
    .from("activity_invitations")
    .select(
      `
      *,
      activity:activities(
        id,
        title,
        description,
        starts_at,
        location_text,
        place_name,
        type,
        distance,
        max_participants,
        creator:profiles!activities_creator_id_fkey(
          id,
          display_name,
          avatar_url
        )
      ),
      inviter:profiles!activity_invitations_invited_by_fkey(
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq("invited_user_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Respond to an activity invitation (accept/decline)
 */
export async function respondToInvitation(invitationId, response, userId) {
  if (!["accepted", "declined"].includes(response)) {
    throw new Error("Response must be 'accepted' or 'declined'");
  }

  // Update invitation status
  const { data: invitation, error: updateError } = await supabase
    .from("activity_invitations")
    .update({
      status: response,
      responded_at: new Date().toISOString(),
    })
    .eq("id", invitationId)
    .eq("invited_user_id", userId) // Ensure user can only update their own invitations
    .select("activity_id")
    .single();

  if (updateError) throw updateError;

  // If accepted, also join the activity
  if (response === "accepted" && invitation) {
    const { error: joinError } = await supabase
      .from("activity_participants")
      .insert({
        activity_id: invitation.activity_id,
        user_id: userId,
        status: "joined",
      });

    // Ignore if already joined (unique constraint violation)
    if (joinError && joinError.code !== "23505") {
      throw joinError;
    }
  }

  return invitation;
}

/**
 * Get invitations sent by a user for a specific activity
 */
export async function getActivityInvitations(activityId, invitedBy) {
  const { data, error } = await supabase
    .from("activity_invitations")
    .select(
      `
      *,
      invited_user:profiles!activity_invitations_invited_user_id_fkey(
        id,
        display_name,
        avatar_url
      )
    `
    )
    .eq("activity_id", activityId)
    .eq("invited_by", invitedBy)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Cancel an invitation (only by the person who sent it)
 */
export async function cancelInvitation(invitationId, invitedBy) {
  const { error } = await supabase
    .from("activity_invitations")
    .delete()
    .eq("id", invitationId)
    .eq("invited_by", invitedBy)
    .eq("status", "pending"); // Only allow cancelling pending invitations

  if (error) throw error;
}
