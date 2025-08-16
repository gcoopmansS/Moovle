// src/api/profiles.js
import { supabase } from "../lib/supabase";

export async function getProfilesByIds(ids = []) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function searchProfiles(query, excludeIds = [], limit = 10) {
  let q = supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${query}%`)
    .limit(limit);

  if (excludeIds.length) q = q.not("id", "in", `(${excludeIds.join(",")})`);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function updateProfileAvatar(url) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (error) throw error;
}

export function avatarFilePath(userId, fileExt) {
  // keep one file per user, or use a uuid if you want history
  return `${userId}/avatar.${fileExt}`;
}
