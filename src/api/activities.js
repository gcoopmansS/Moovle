import { supabase } from "../lib/supabase";

export async function fetchFeed({ sinceHours = 6 } = {}) {
  const since = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", since)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
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
