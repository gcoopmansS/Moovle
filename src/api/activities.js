import { supabase } from "../lib/supabase";

export async function fetchFeed({ sinceHours = 6 } = {}) {
  const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();

  // First, get activities
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", since)
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

export async function createActivity({
  userId,
  title,
  description,
  starts_at,
  location_text,
  visibility = "friends",
  type,
  distance,
  max_participants,
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
  });
  if (error) throw error;
}

export async function joinActivity({ activity_id, user_id }) {
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
