// src/api/profiles.js
import { supabase } from "../lib/supabase";

export async function getProfilesByIds(ids = []) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, location, location_lat, location_lng"
    )
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function searchProfiles(query, excludeIds = [], limit = 10) {
  let q = supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, location, location_lat, location_lng"
    )
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

// Helper function to calculate distance between two coordinates (in km)
export function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Find profiles within a certain distance of a location
export async function getProfilesNearLocation(
  lat,
  lng,
  radiusKm = 50,
  excludeIds = [],
  limit = 20
) {
  if (!lat || !lng) return [];

  // Note: This is a simple approach. For better performance with large datasets,
  // consider using PostGIS extensions in Supabase for geospatial queries
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, location, location_lat, location_lng"
    )
    .not("location_lat", "is", null)
    .not("location_lng", "is", null)
    .limit(limit * 3); // Get more than needed since we'll filter by distance

  if (error) throw error;

  // Filter by distance and exclude specified IDs
  const nearbyProfiles = (data || [])
    .map((profile) => ({
      ...profile,
      distance: calculateDistance(
        lat,
        lng,
        profile.location_lat,
        profile.location_lng
      ),
    }))
    .filter(
      (profile) =>
        profile.distance !== null &&
        profile.distance <= radiusKm &&
        !excludeIds.includes(profile.id)
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return nearbyProfiles;
}
