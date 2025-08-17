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
import MyActivityCard from "./MyActivityCard";

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
      {/* My Activities Section - Compact Overview */}
      {myActivities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Your Activities</h2>
            <span className="text-sm text-gray-500">
              {myActivities.length} created
            </span>
          </div>

          <div className="space-y-3">
            {myActivities
              .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)) // Sort by date
              .map((activity, index) => (
                <MyActivityCard
                  key={activity.id}
                  activity={activity}
                  isNext={index === 0} // First activity is "next"
                />
              ))}
          </div>
        </div>
      )}

      {/* Available Activities Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {myActivities.length > 0 ? "Join Activities" : "Activity Feed"}
          </h2>
          {availableActivities.length > 0 && (
            <span className="text-sm text-gray-500">
              {availableActivities.length} available
            </span>
          )}
        </div>

        {availableActivities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/50 rounded-xl border border-gray-100">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🏃‍♂️</span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {myActivities.length > 0
                ? "No activities to join right now"
                : "No activities yet"}
            </h3>
            <p className="text-gray-600 text-sm">
              {myActivities.length > 0
                ? "Check back later for new activities!"
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
