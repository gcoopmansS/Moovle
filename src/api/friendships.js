// src/api/friendships.js
import { supabase } from "../lib/supabase";

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
  const [user_a, user_b] = canonical(meId, otherId);
  const { error } = await supabase.from("friendships").insert({
    user_a,
    user_b,
    status: "pending",
    requested_by: meId,
  });
  // ignore unique violation (already requested)
  if (error && error.code !== "23505") throw error;
}

export async function acceptFriendRequest(meId, otherId) {
  const [user_a, user_b] = canonical(meId, otherId);
  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_a", user_a)
    .eq("user_b", user_b);
  if (error) throw error;
}

export async function declineFriendRequest(meId, otherId) {
  // simplest MVP: mark as blocked. (You could also delete the row.)
  const [user_a, user_b] = canonical(meId, otherId);
  const { error } = await supabase
    .from("friendships")
    .update({ status: "blocked" })
    .eq("user_a", user_a)
    .eq("user_b", user_b);
  if (error) throw error;
}
