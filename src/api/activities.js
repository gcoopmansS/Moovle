import { supabase } from "../lib/supabase";

// Helper function to fetch participant data for activities with optimized batching
async function fetchParticipantsForActivities(activityIds) {
  if (!activityIds || activityIds.length === 0) {
    return {};
  }

  try {
    // Use separate queries for better reliability
    // The join approach fails due to missing foreign key relationships
    let participantsByActivity = {};
    const { data: participants, error: participantsError } = await supabase
      .from("activity_participants")
      .select("activity_id, user_id")
      .in("activity_id", activityIds);
    if (participantsError) throw participantsError;

    if (!participants || participants.length === 0) {
      return {};
    }

    // Get unique participant user IDs (excluding duplicates)
    const participantUserIds = [...new Set(participants.map((p) => p.user_id))];

    // Batch fetch all participant profiles
    const { data: participantProfiles, error: participantProfilesError } =
      await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", participantUserIds);
    if (participantProfilesError) throw participantProfilesError;

    // Create a map of participant profiles by ID for O(1) lookups
    const participantProfilesMap = (participantProfiles || []).reduce(
      (acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      },
      {}
    );

    // Group participants by activity with profile data
    participantsByActivity = participants.reduce((acc, participant) => {
      const activityId = participant.activity_id;
      const userProfile = participantProfilesMap[participant.user_id];

      if (!acc[activityId]) acc[activityId] = [];
      acc[activityId].push({
        user_id: participant.user_id,
        profile: userProfile || null,
      });

      return acc;
    }, {});

    return participantsByActivity;
  } catch (error) {
    console.error("Error fetching participants:", error);
    return {};
  }
}

export async function fetchFeed({ daysAhead = 14, currentUserId } = {}) {
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 3600 * 1000
  ).toISOString();

  // Get regular activities (excluding current user's own activities)
  const { data: activities, error } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", now)
    .lte("starts_at", future)
    .neq("creator_id", currentUserId) // Exclude current user's activities
    .or("visibility.eq.public,visibility.eq.friends") // Only public and friends activities
    .order("starts_at", { ascending: true });
  if (error) throw error;

  // Get activities the user was invited to (any status - pending or accepted)
  const { data: invitedActivities, error: invitedError } = await supabase
    .from("activity_invitations")
    .select(
      "activity_id,status,invited_by,created_at,activities:activity_id(id,creator_id,title,description,starts_at,location_text,place_name,lat,lng,visibility,type,distance,max_participants)"
    )
    .eq("invited_user_id", currentUserId)
    .gte("activities.starts_at", now)
    .lte("activities.starts_at", future);

  if (invitedError) throw invitedError;

  // Combine regular activities and invited activities
  const allActivities = [
    ...(activities || []).map((activity) => ({
      ...activity,
      isInvited: false,
    })),
    ...(invitedActivities || [])
      .filter((inv) => inv.activities) // Filter out any with null activities
      .map((inv) => ({
        ...inv.activities,
        isInvited: true,
        invitationStatus: inv.status, // 'pending' or 'accepted'
        invitationDate: inv.created_at,
        invitedBy: inv.invited_by,
      })),
  ];

  // Remove duplicates (in case an activity appears in both lists)
  const uniqueActivities = allActivities.reduce((acc, activity) => {
    const existingIndex = acc.findIndex((a) => a.id === activity.id);
    if (existingIndex >= 0) {
      // If duplicate, prefer the invited version (more specific)
      if (activity.isInvited) {
        acc[existingIndex] = activity;
      }
    } else {
      acc.push(activity);
    }
    return acc;
  }, []);

  if (uniqueActivities.length === 0) {
    return [];
  }

  // Get unique creator IDs
  const creatorIds = [...new Set(uniqueActivities.map((a) => a.creator_id))];

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

  // Get participant data for all activities using helper function
  const participantsByActivity = await fetchParticipantsForActivities(
    uniqueActivities.map((a) => a.id)
  );

  // Transform the data to include creator info and participant data
  const transformedData = uniqueActivities.map((activity) => ({
    ...activity,
    creator: profilesMap[activity.creator_id],
    participants: participantsByActivity[activity.id] || [],
    participant_count: (participantsByActivity[activity.id] || []).length,
  }));

  // Sort by date
  return transformedData.sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  );
}

export async function fetchMyActivities({
  daysAhead = 14,
  currentUserId,
} = {}) {
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 3600 * 1000
  ).toISOString();

  // Get activities created by the user
  const { data: createdActivities, error: createdError } = await supabase
    .from("activities")
    .select("*")
    .gte("starts_at", now)
    .lte("starts_at", future)
    .eq("creator_id", currentUserId)
    .order("starts_at", { ascending: true });
  if (createdError) throw createdError;

  // Get activities the user has joined as a participant
  const { data: participantData, error: participantError } = await supabase
    .from("activity_participants")
    .select(`
      activity_id,
      activities!inner (*)
    `)
    .eq("user_id", currentUserId)
    .gte("activities.starts_at", now)
    .lte("activities.starts_at", future);
  if (participantError) throw participantError;

  // Extract activities from participant data
  const joinedActivities = (participantData || [])
    .filter((p) => p.activities) // Filter out any with null activities
    .map((p) => p.activities);

  // Combine both lists, removing duplicates (in case user created and joined the same activity)
  const allActivities = [...(createdActivities || []), ...joinedActivities];
  const uniqueActivities = allActivities.reduce((acc, activity) => {
    const existingIndex = acc.findIndex((a) => a.id === activity.id);
    if (existingIndex === -1) {
      acc.push(activity);
    }
    return acc;
  }, []);

  // Sort by start time
  uniqueActivities.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));

  if (uniqueActivities.length === 0) {
    return [];
  }

  // Get participant data for all activities using helper function
  const participantsByActivity = await fetchParticipantsForActivities(
    uniqueActivities.map((a) => a.id)
  );

  // Return activities with participant data
  return uniqueActivities.map((activity) => ({
    ...activity,
    creator: null, // We can handle this in the UI to show "You" or current user info
    participants: participantsByActivity[activity.id] || [],
    participant_count: (participantsByActivity[activity.id] || []).length,
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
  const { data, error } = await supabase
    .from("activities")
    .insert({
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
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
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
