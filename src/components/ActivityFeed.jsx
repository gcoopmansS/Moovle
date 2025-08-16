import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import {
  fetchFeed,
  fetchMyActivities,
  joinActivity,
  leaveActivity,
} from "../api/activities";
import { supabase } from "../lib/supabase";
import ActivityCard from "./ActivityCard";

export default function ActivityFeed() {
  const { user } = useSupabaseAuth();
  const [availableActivities, setAvailableActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [joinedMap, setJoinedMap] = useState({}); // activityId -> true/false

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load both available activities (others') and user's own activities
      const [availableData, myData] = await Promise.all([
        fetchFeed({ currentUserId: user.id }),
        fetchMyActivities({ currentUserId: user.id }),
      ]);

      setAvailableActivities(availableData);
      setMyActivities(myData);

      // For available activities, check if current user already joined
      if (availableData.length > 0) {
        const entries = await Promise.all(
          availableData.map(async (a) => {
            const { data: p, error } = await supabase
              .from("activity_participants")
              .select("id")
              .eq("activity_id", a.id)
              .eq("user_id", user.id)
              .maybeSingle();
            if (error && error.code !== "PGRST116") throw error; // ignore "no rows found"
            return [a.id, !!p];
          })
        );
        setJoinedMap(Object.fromEntries(entries));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin(activityId) {
    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await joinActivity({ activity_id: activityId, user_id: user.id });
      setJoinedMap((m) => ({ ...m, [activityId]: true }));
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  async function handleLeave(activityId) {
    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await leaveActivity({ activity_id: activityId, user_id: user.id });
      setJoinedMap((m) => ({ ...m, [activityId]: false }));
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-6">Loading…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      {/* My Activities Section */}
      {myActivities.length > 0 && (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              My Activities
            </h2>
            <p className="text-gray-600 text-sm">Activities you've created</p>
          </div>
          <div className="space-y-4">
            {myActivities.map((activity) => (
              <div key={activity.id} className="relative">
                <ActivityCard
                  activity={{
                    ...activity,
                    creator: { display_name: "You" }, // Show "You" as creator
                  }}
                  joined={false} // User can't join their own activity
                  busy={false}
                  onJoin={() => {}} // No action for own activities
                  onLeave={() => {}} // No action for own activities
                  isOwnActivity={true} // This is user's own activity
                />
                <div className="absolute top-4 right-4 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  Created by you
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Activities Section */}
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {myActivities.length > 0 ? "Available Activities" : "Activity Feed"}
          </h2>
          <p className="text-gray-600 text-sm">
            {myActivities.length > 0
              ? "Join activities created by others"
              : "Join your friends for amazing sports activities!"}
          </p>
        </div>

        {availableActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏃‍♂️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {myActivities.length > 0
                ? "No activities to join"
                : "No activities yet"}
            </h3>
            <p className="text-gray-600">
              {myActivities.length > 0
                ? "Check back later for new activities from other users!"
                : "Be the first to create a sports activity!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {availableActivities.map((activity) => {
              const joined = !!joinedMap[activity.id];
              const busy = !!joining[activity.id];
              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  joined={joined}
                  busy={busy}
                  onJoin={() => handleJoin(activity.id)}
                  onLeave={() => handleLeave(activity.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
