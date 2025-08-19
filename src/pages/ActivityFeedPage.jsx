import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { fetchMyActivities } from "../api/activities";
import { ActivityService } from "../services";
import { supabase } from "../lib/supabase";
import ActivityCard from "../components/ActivityCard";
import MyActivityCard from "../components/MyActivityCard";

export default function ActivityFeedPage() {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const [availableActivities, setAvailableActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [joinedMap, setJoinedMap] = useState({}); // activityId -> true/false
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return; // Don't load if user is not authenticated

    // Only show loading if we don't have any data yet (first load)
    const isFirstLoad =
      availableActivities.length === 0 && myActivities.length === 0;
    if (isFirstLoad) {
      setLoading(true);
    }

    try {
      // Add timeout for loading
      const timeoutId = setTimeout(() => {
        console.warn("Activity feed loading timeout");
        setLoading(false);
      }, 15000);

      // Load both available activities (others') and user's own activities
      const [availableData, myData] = await Promise.all([
        ActivityService.getActivityFeed({ currentUserId: user.id }),
        fetchMyActivities({ currentUserId: user.id }),
      ]);

      clearTimeout(timeoutId);

      // Separate pending invitations from other activities
      const pendingInvites = availableData.filter(
        (activity) =>
          activity.isInvited && activity.invitationStatus === "pending"
      );
      const otherActivities = availableData.filter(
        (activity) =>
          !activity.isInvited || activity.invitationStatus !== "pending"
      );

      setAvailableActivities(otherActivities);
      setMyActivities(myData);
      setPendingInvitations(pendingInvites);

      // Optimize participant checking with batch query
      if (availableData.length > 0) {
        const activityIds = availableData.map((a) => a.id);

        // Single batch query instead of multiple individual queries
        const { data: participants, error } = await supabase
          .from("activity_participants")
          .select("activity_id")
          .eq("user_id", user.id)
          .in("activity_id", activityIds);

        if (error) {
          console.warn("Error fetching participants:", error);
        } else {
          // Create a Set for O(1) lookup
          const joinedActivityIds = new Set(
            participants?.map((p) => p.activity_id) || []
          );
          const joinedMap = Object.fromEntries(
            activityIds.map((id) => [id, joinedActivityIds.has(id)])
          );
          setJoinedMap(joinedMap);
        }
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      // Set empty data on error to prevent indefinite loading
      setAvailableActivities([]);
      setMyActivities([]);
      setPendingInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [user, availableActivities.length, myActivities.length]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle success messages from navigation state (e.g., from activity creation)
  useEffect(() => {
    if (location.state?.fromCreation && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the success message after 4 seconds
      setTimeout(() => setSuccessMessage(""), 4000);

      // Clear the navigation state to prevent showing message again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function handleJoin(activityId) {
    if (!user?.id) return; // Don't proceed if user is not authenticated

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      // Find the activity to check if it's an invitation (check both arrays)
      const activity =
        availableActivities.find((a) => a.id === activityId) ||
        pendingInvitations.find((a) => a.id === activityId);

      if (activity?.isInvited) {
        // For invited activities, mark invitation as accepted AND join the activity
        await Promise.all([
          // Mark invitation as accepted
          supabase
            .from("activity_invitations")
            .update({
              status: "accepted",
              responded_at: new Date().toISOString(),
            })
            .eq("activity_id", activityId)
            .eq("invited_user_id", user.id),
          // Actually join the activity as a participant
          ActivityService.joinActivity(activityId, user.id),
        ]);

        // Remove from pending invitations and add to user's activities
        setPendingInvitations((prev) =>
          prev.filter((a) => a.id !== activityId)
        );
        setMyActivities((prev) => [
          ...prev,
          { ...activity, isInvited: true, invitationStatus: "accepted" },
        ]);
      } else {
        // For regular activities, just join
        await ActivityService.joinActivity(activityId, user.id);

        // Move from available activities to user's activities
        setAvailableActivities((prev) =>
          prev.filter((a) => a.id !== activityId)
        );
        setMyActivities((prev) => [...prev, { ...activity, isInvited: false }]);
      }

      setJoinedMap((m) => ({ ...m, [activityId]: true }));
    } catch (error) {
      console.error("Failed to join activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  async function handleLeave(activityId) {
    if (!user?.id) return; // Don't proceed if user is not authenticated

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await ActivityService.leaveActivity(activityId, user.id);

      // Find the activity in myActivities
      const activity = myActivities.find((a) => a.id === activityId);

      if (activity && activity.creator_id !== user.id) {
        // If it's not user's created activity, move it back to available activities
        setMyActivities((prev) => prev.filter((a) => a.id !== activityId));
        setAvailableActivities((prev) => [
          ...prev,
          { ...activity, isInvited: activity.isInvited || false },
        ]);
      }

      setJoinedMap((m) => ({ ...m, [activityId]: false }));
    } catch (error) {
      console.error("Failed to leave activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  async function handleDeclineInvitation(activityId) {
    if (!user?.id) return;

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await supabase
        .from("activity_invitations")
        .update({
          status: "declined",
          responded_at: new Date().toISOString(),
        })
        .eq("activity_id", activityId)
        .eq("invited_user_id", user.id);

      // Remove from pending invitations
      setPendingInvitations((prev) =>
        prev.filter((activity) => activity.id !== activityId)
      );
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-6">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-3 space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="font-medium text-green-900">{successMessage}</p>
        </div>
      )}

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-orange-600">✉️</span>
              Pending Invitations
            </h2>
            <span className="text-sm text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full">
              {pendingInvitations.length} waiting
            </span>
          </div>

          <div className="space-y-3">
            {pendingInvitations.map((activity) => {
              const busy = !!joining[activity.id];
              return (
                <div
                  key={activity.id}
                  className="bg-white rounded-lg border border-orange-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-base mb-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {activity.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          📅 {new Date(activity.starts_at).toLocaleDateString()}
                        </span>
                        {activity.location_text && (
                          <span>📍 {activity.location_text}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <span>✉️</span>
                      Invited
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none text-sm"
                      onClick={() => handleJoin(activity.id)}
                    >
                      {busy ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      disabled={busy}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none text-sm"
                      onClick={() => handleDeclineInvitation(activity.id)}
                    >
                      {busy ? "Declining..." : "Decline"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Activities Section - Compact Overview */}
      {myActivities.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📅</span>
              My Activities
            </h2>
            <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
              {myActivities.length} activities
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
                  isCreator={activity.creator_id === user?.id} // Check if user created this activity
                  onLeave={handleLeave} // Allow leaving joined activities
                  busy={!!joining[activity.id]} // Show loading state
                />
              ))}
          </div>
        </div>
      )}

      {/* Available Activities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-green-600">🔍</span>
            {myActivities.length > 0 ? "Discover Activities" : "Activity Feed"}
          </h2>
          {availableActivities.length > 0 && (
            <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
              {availableActivities.length} available
            </span>
          )}
        </div>

        {availableActivities.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-2">
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
