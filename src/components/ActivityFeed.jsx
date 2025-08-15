import { useEffect, useState } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { fetchFeed, joinActivity, leaveActivity } from "../api/activities";
import { supabase } from "../lib/supabase";

export default function ActivityFeed() {
  const { user } = useSupabaseAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [joinedMap, setJoinedMap] = useState({}); // activityId -> true/false

  async function load() {
    setLoading(true);
    try {
      const data = await fetchFeed(); // relies on RLS to filter to what user can see
      setItems(data);

      // For each activity, check if current user already joined (simple MVP approach)
      const entries = await Promise.all(
        data.map(async (a) => {
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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Feed</h2>
        <p className="text-gray-600">
          Join your friends for amazing sports activities!
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏃‍♂️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No activities yet
          </h3>
          <p className="text-gray-600">
            Be the first to create a sports activity!
          </p>
        </div>
      ) : (
        items.map((a) => {
          const starts = new Date(a.starts_at);
          const joined = !!joinedMap[a.id];
          const busy = !!joining[a.id];

          return (
            <div
              key={a.id}
              className="bg-white/80 backdrop-blur border rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-sm text-gray-500">
                  {starts.toLocaleDateString()} •{" "}
                  {starts.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {a.location_text && (
                <div className="text-sm text-gray-700 mb-1">
                  {a.location_text}
                </div>
              )}
              {a.type && (
                <div className="text-xs text-gray-500 mb-1">Type: {a.type}</div>
              )}
              {(a.distance || a.max_participants) && (
                <div className="text-xs text-gray-500 mb-2">
                  {a.distance ? `Distance: ${a.distance}` : ""}
                  {a.distance && a.max_participants ? " • " : ""}
                  {a.max_participants ? `Max: ${a.max_participants}` : ""}
                </div>
              )}
              {a.description && (
                <p className="text-sm text-gray-600 mb-3">{a.description}</p>
              )}

              <div className="flex items-center gap-2 justify-end">
                {joined ? (
                  <button
                    disabled={busy}
                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => handleLeave(a.id)}
                  >
                    {busy ? "Leaving…" : "Leave"}
                  </button>
                ) : (
                  <button
                    disabled={busy}
                    className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => handleJoin(a.id)}
                  >
                    {busy ? "Joining…" : "Join"}
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
