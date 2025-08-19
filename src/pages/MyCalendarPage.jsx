import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { fetchMyActivities } from "../api/activities";
import { ActivityService } from "../services";
import { supabase } from "../lib/supabase";
import MyActivityCard from "../components/MyActivityCard";
import {
  Calendar,
  Crown,
  UserCheck,
  Mail,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
} from "lucide-react";

export default function MyCalendarPage() {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const [myCreatedActivities, setMyCreatedActivities] = useState([]);
  const [myJoinedActivities, setMyJoinedActivities] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      // Load user's activities and invitations
      const [myData, invitationsData] = await Promise.all([
        fetchMyActivities({ currentUserId: user.id }),
        ActivityService.getActivityFeed({ currentUserId: user.id }),
      ]);

      // Separate created activities from joined activities
      const createdActivities = myData.filter(
        (activity) => activity.creator_id === user.id
      );
      const joinedActivities = myData.filter(
        (activity) => activity.creator_id !== user.id
      );

      // Extract pending invitations
      const pendingInvites = invitationsData.filter(
        (activity) =>
          activity.isInvited && activity.invitationStatus === "pending"
      );

      setMyCreatedActivities(createdActivities);
      setMyJoinedActivities(joinedActivities);
      setPendingInvitations(pendingInvites);
    } catch (error) {
      console.error("Error loading calendar:", error);
      setMyCreatedActivities([]);
      setMyJoinedActivities([]);
      setPendingInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle success messages from navigation state
  useEffect(() => {
    if (location.state?.fromCreation && location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(""), 4000);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  async function handleJoinFromInvitation(activityId) {
    if (!user?.id) return;

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      const activity = pendingInvitations.find((a) => a.id === activityId);

      // Mark invitation as accepted AND join the activity
      await Promise.all([
        supabase
          .from("activity_invitations")
          .update({
            status: "accepted",
            responded_at: new Date().toISOString(),
          })
          .eq("activity_id", activityId)
          .eq("invited_user_id", user.id),
        ActivityService.joinActivity(activityId, user.id),
      ]);

      // Remove from pending invitations and add to joined activities
      setPendingInvitations((prev) => prev.filter((a) => a.id !== activityId));
      setMyJoinedActivities((prev) => [
        ...prev,
        { ...activity, isInvited: true, invitationStatus: "accepted" },
      ]);
    } catch (error) {
      console.error("Failed to accept invitation:", error);
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

      setPendingInvitations((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error) {
      console.error("Failed to decline invitation:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  async function handleLeave(activityId) {
    if (!user?.id) return;

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await ActivityService.leaveActivity(activityId, user.id);
      // Remove from joined activities
      setMyJoinedActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error) {
      console.error("Failed to leave activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading your calendar...</span>
        </div>
      </div>
    );
  }

  const allMyActivities = [...myCreatedActivities, ...myJoinedActivities];
  const upcomingActivities = allMyActivities
    .filter((activity) => new Date(activity.starts_at) >= new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-3 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Calendar</h1>
        </div>
        <p className="text-gray-600">
          Your personal sports schedule and activities
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="font-medium text-green-900">{successMessage}</p>
        </div>
      )}

      {/* Pending Invitations - Priority Section */}
      {pendingInvitations.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-600" />
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
                  className="bg-white rounded-xl border border-orange-200 p-4"
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
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.starts_at).toLocaleDateString()}
                        </span>
                        {activity.location_text && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {activity.location_text}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Invited
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none text-sm cursor-pointer"
                      onClick={() => handleJoinFromInvitation(activity.id)}
                    >
                      {busy ? "Accepting..." : "Accept"}
                    </button>
                    <button
                      disabled={busy}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none text-sm cursor-pointer"
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

      {/* Quick Overview */}
      {allMyActivities.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Crown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {myCreatedActivities.length}
            </div>
            <div className="text-sm text-gray-600">Created</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {myJoinedActivities.length}
            </div>
            <div className="text-sm text-gray-600">Joined</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {upcomingActivities.length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
        </div>
      )}

      {/* My Created Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-5 h-5 text-blue-600" />
            Activities I Created
          </h2>
          {myCreatedActivities.length > 0 && (
            <span className="text-sm text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
              {myCreatedActivities.length} activities
            </span>
          )}
        </div>

        {myCreatedActivities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            <Crown className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No activities created yet
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Create your first activity to start organizing sports events.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Create Activity
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myCreatedActivities
              .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
              .map((activity, index) => (
                <MyActivityCard
                  key={activity.id}
                  activity={activity}
                  isNext={index === 0}
                  isCreator={true}
                  onLeave={handleLeave}
                  busy={!!joining[activity.id]}
                />
              ))}
          </div>
        )}
      </div>

      {/* Activities I Joined */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            Activities I Joined
          </h2>
          {myJoinedActivities.length > 0 && (
            <span className="text-sm text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
              {myJoinedActivities.length} activities
            </span>
          )}
        </div>

        {myJoinedActivities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No activities joined yet
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Browse the Activity Feed to find activities to join.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Find Activities
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myJoinedActivities
              .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
              .map((activity, index) => (
                <MyActivityCard
                  key={activity.id}
                  activity={activity}
                  isNext={index === 0}
                  isCreator={false}
                  onLeave={handleLeave}
                  busy={!!joining[activity.id]}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
