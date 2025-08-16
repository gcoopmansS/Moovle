import { supabase } from "../lib/supabase";

export async function fetchFeed({ daysAhead = 14, currentUserId } = {}) {
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 3600 * 1000
  ).toISOString();

  // Get activities excluding the current user's own activities
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", now)
    .lte("starts_at", future)
    .neq("creator_id", currentUserId) // Exclude current user's activities
    .order("starts_at", { ascending: true });
  if (error) throw error;

  if (!activities || activities.length === 0) {
    return [];
  }

  // Get unique creator IDs
  const creatorIds = [...new Set(activities.map((a) => a.creator_id))];

  // Fetch creator profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", creatorIds);
  if (profilesError) throw profilesError;

  // Create a map of profiles by ID
  const profilesMap =
    profiles?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {}) || {};

  // Transform the data to include creator info
  const transformedData = activities.map((activity) => ({
    ...activity,
    creator: profilesMap[activity.creator_id],
  }));

  return transformedData;
}

export async function fetchMyActivities({
  daysAhead = 14,
  currentUserId,
} = {}) {
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 3600 * 1000
  ).toISOString();

  // Get only the current user's activities
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", now)
    .lte("starts_at", future)
    .eq("creator_id", currentUserId) // Only current user's activities
    .order("starts_at", { ascending: true });
  if (error) throw error;

  if (!activities || activities.length === 0) {
    return [];
  }

  // For user's own activities, we don't need to fetch creator profile since it's the current user
  return activities.map((activity) => ({
    ...activity,
    creator: null, // We can handle this in the UI to show "You" or current user info
  }));
}

export async function createActivity({
  userId,
  title,
  description,
  starts_at,
  location_text, // optional legacy field; you can drop later
  visibility = "friends",
  type,
  distance,
  max_participants,
  place_name, // NEW
  lat, // NEW
  lng, // NEW
}) {
  const { error } = await supabase.from("activities").insert({
    creator_id: userId,
    title,
    description,
    starts_at,
    location_text,
    visibility,
    type,
    distance,
    max_participants,
    place_name,
    lat,
    lng,
    // NOTE: geom will be auto-set by the trigger when lat/lng are present
  });
  if (error) throw error;
}

export async function joinActivity({ activity_id, user_id }) {
  // First, check if the user is trying to join their own activity
  const { data: activity, error: activityError } = await supabase
    .from("activities")
    .select("creator_id")
    .eq("id", activity_id)
    .single();

  if (activityError) throw activityError;

  if (activity.creator_id === user_id) {
    throw new Error("You cannot join your own activity");
  }

  const { error } = await supabase.from("activity_participants").insert({
    activity_id,
    user_id,
    status: "joined",
  });
  if (error && error.code !== "23505") throw error; // ignore unique violation
}

export async function leaveActivity({ activity_id, user_id }) {
  const { error } = await supabase
    .from("activity_participants")
    .delete()
    .eq("activity_id", activity_id)
    .eq("user_id", user_id);
  if (error) throw error;
}
