// Import React hooks and routing utilities
import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { fetchMyActivities } from "../api/activities";
import { ActivityService } from "../services";
import { supabase } from "../lib/supabase";
import CalendarActivityCard from "../components/CalendarActivityCard";
import {
  Calendar,
  Crown,
  Check,
  Mail,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  UserCheck,
} from "lucide-react";

/**
 * MyCalendarPage - Personal activity management and schedule view with Timeline Layout
 *
 * This redesigned page provides a modern timeline-based view of the user's sports activities:
 * - Sidebar with quick stats and pending invitations
 * - Main timeline organized by time periods (Today, Tomorrow, This Week, Later)
 * - Clean, spacious layout optimized for personal activity management
 *
 * Key Features:
 * - Timeline-based organization by date
 * - Compact sidebar with overview stats
 * - Priority display of pending invitations
 * - Accept/decline invitation functionality
 * - Leave activity functionality
 * - Success message handling from navigation
 * - Auto-refresh when navigating to page
 *
 * This complements ActivityFeedPage which focuses on discovery,
 * while this page focuses on personal activity management with better visual hierarchy.
 */
export default function MyCalendarPage() {
  // Authentication and routing hooks
  const { user } = useSupabaseAuth();
  const location = useLocation();

  // State management for different types of activities
  const [myCreatedActivities, setMyCreatedActivities] = useState([]); // Activities user created
  const [myJoinedActivities, setMyJoinedActivities] = useState([]); // Activities user joined
  const [pendingInvitations, setPendingInvitations] = useState([]); // Invitations awaiting response
  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [joining, setJoining] = useState({}); // Track join/leave operations (activityId -> boolean)
  const [successMessage, setSuccessMessage] = useState(""); // Success feedback message

  /**
   * Load and categorize user's activities and invitations
   *
   * This function fetches data from two sources:
   * 1. fetchMyActivities: Gets activities user created or joined
   * 2. ActivityService.getActivityFeed: Gets activities including invitations
   *
   * Then categorizes them into:
   * - Created activities (user is the organizer)
   * - Joined activities (user is a participant)
   * - Pending invitations (awaiting user response)
   *
   * Includes timeout and error recovery mechanisms
   */
  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), 15000);
      });

      // Fetch both personal activities and feed data in parallel for efficiency
      const [myData, invitationsData] = await Promise.race([
        Promise.all([
          fetchMyActivities({ currentUserId: user.id }),
          ActivityService.getActivityFeed({ currentUserId: user.id }),
        ]),
        timeoutPromise,
      ]);

      // Categorize activities by user's relationship to them
      const createdActivities = myData.filter(
        (activity) => activity.creator_id === user.id
      );
      const joinedActivities = myData.filter(
        (activity) => activity.creator_id !== user.id
      );

      // Find invitations that need user response
      const pendingInvites = invitationsData.filter(
        (activity) =>
          activity.isInvited && activity.invitationStatus === "pending"
      );

      // Update state with categorized data
      setMyCreatedActivities(createdActivities);
      setMyJoinedActivities(joinedActivities);
      setPendingInvitations(pendingInvites);
    } catch (error) {
      console.error("Error loading calendar:", error);
      setMyCreatedActivities([]);
      setMyJoinedActivities([]);
      setPendingInvitations([]);

      // If it's a timeout error, provide helpful feedback
      if (error.message === "Request timeout") {
        console.warn(
          "Calendar request timed out - user may have poor connection"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  // Handle page visibility changes - retry loading when user returns to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      // If page becomes visible and we have a user but no activities loaded, retry
      if (
        !document.hidden &&
        user?.id &&
        myCreatedActivities.length === 0 &&
        myJoinedActivities.length === 0 &&
        pendingInvitations.length === 0 &&
        !loading
      ) {
        console.log("Page became visible - retrying calendar load");
        load();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    load,
    user,
    myCreatedActivities.length,
    myJoinedActivities.length,
    pendingInvitations.length,
    loading,
  ]);

  // Refresh data when navigating to this page to catch joined activities
  useEffect(() => {
    // Refresh when the pathname changes to this page
    if (location.pathname.includes("/calendar")) {
      load();
    }
  }, [location.pathname, load]);

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

  async function handleCancel(activityId, options = {}) {
    if (!user?.id) return;
    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      if (options.mode === "transfer" && options.newOrganizer) {
        await ActivityService.transferOrganizer(
          activityId,
          options.newOrganizer,
          user.id
        );
        setMyCreatedActivities((prev) =>
          prev.filter((a) => a.id !== activityId)
        );
        setSuccessMessage(
          "Organizer role transferred. You are no longer the organizer."
        );
      } else {
        await ActivityService.cancelActivity(activityId, user.id);
        setMyCreatedActivities((prev) =>
          prev.filter((a) => a.id !== activityId)
        );
        setSuccessMessage("Activity cancelled for all participants.");
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to cancel/transfer activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  function handleEdit(activityId) {
    // Implement navigation to edit page or open modal
    // Example: navigate(`/activities/${activityId}/edit`);
    alert("Edit activity " + activityId);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 animate-spin text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Your Calendar
          </h3>
          <p className="text-gray-600">
            Preparing your personal activity schedule...
          </p>
        </div>
      </div>
    );
  }

  const allMyActivities = [...myCreatedActivities, ...myJoinedActivities];

  // Group activities by time periods for timeline view
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const groupedActivities = {
    overdue: allMyActivities.filter(
      (activity) => new Date(activity.starts_at) < today
    ),
    today: allMyActivities.filter((activity) => {
      const activityDate = new Date(activity.starts_at);
      return activityDate >= today && activityDate < tomorrow;
    }),
    tomorrow: allMyActivities.filter((activity) => {
      const activityDate = new Date(activity.starts_at);
      return (
        activityDate >= tomorrow &&
        activityDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      );
    }),
    thisWeek: allMyActivities.filter((activity) => {
      const activityDate = new Date(activity.starts_at);
      const dayAfterTomorrow = new Date(
        tomorrow.getTime() + 24 * 60 * 60 * 1000
      );
      return activityDate >= dayAfterTomorrow && activityDate < nextWeek;
    }),
    later: allMyActivities.filter(
      (activity) => new Date(activity.starts_at) >= nextWeek
    ),
  };

  // Sort activities within each group
  Object.keys(groupedActivities).forEach((key) => {
    groupedActivities[key].sort(
      (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
    );
  });

  const upcomingActivities = allMyActivities
    .filter((activity) => new Date(activity.starts_at) >= new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
    .slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-robin_egg_blue/20 border border-robin_egg_blue/40 rounded-xl p-4 flex items-center gap-3 animate-fade-in backdrop-blur-sm">
          <CheckCircle className="w-5 h-5 text-hookers_green" />
          <p className="font-medium text-onyx">{successMessage}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Quick Stats & Invitations */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Cards */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-minimal">
            <h3 className="text-lg font-medium text-onyx mb-4">Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-keppel)" }}
                  >
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-onyx">
                      {myCreatedActivities.length}
                    </div>
                    <div className="text-sm text-keppel">Organized</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-dark-cyan)" }}
                  >
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-onyx">
                      {myJoinedActivities.length}
                    </div>
                    <div className="text-sm text-keppel">Joined</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-hookers-green)" }}
                  >
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-onyx">
                      {upcomingActivities.length}
                    </div>
                    <div className="text-sm text-keppel">This week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 p-6 shadow-minimal">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-hookers_green" />
                <h3 className="font-medium text-onyx">Invitations</h3>
                <span
                  className="ml-auto text-xs text-white px-2 py-1 rounded-full font-medium"
                  style={{ backgroundColor: "var(--color-keppel)" }}
                >
                  {pendingInvitations.length}
                </span>
              </div>
              <div className="space-y-3">
                {pendingInvitations.map((activity) => {
                  const busy = !!joining[activity.id];
                  return (
                    <div
                      key={activity.id}
                      className="bg-white/80 rounded-xl border border-white/40 p-4 backdrop-blur-sm"
                    >
                      <h4 className="font-medium text-onyx text-sm mb-2">
                        {activity.title}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          disabled={busy}
                          className="flex-1 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-all duration-300 disabled:opacity-60 hover:scale-105"
                          style={{ backgroundColor: "var(--color-dark-cyan)" }}
                          onClick={() => handleJoinFromInvitation(activity.id)}
                        >
                          {busy ? "..." : "Accept"}
                        </button>
                        <button
                          disabled={busy}
                          className="flex-1 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-all duration-300 disabled:opacity-60 hover:scale-105"
                          style={{ backgroundColor: "var(--color-keppel)" }}
                          onClick={() => handleDeclineInvitation(activity.id)}
                        >
                          {busy ? "..." : "Decline"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main Content - Timeline View */}
        <div className="lg:col-span-3 space-y-6">
          {/* Timeline View - Activities grouped by time periods */}
          {allMyActivities.length === 0 ? (
            <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-minimal">
              <Calendar className="w-16 h-16 text-keppel mx-auto mb-4" />
              <h3 className="text-xl font-medium text-onyx mb-2">
                No activities yet
              </h3>
              <p className="text-keppel mb-6">
                Create your first activity or join one from the Activity Feed.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: "var(--color-dark-cyan)" }}
                >
                  <Plus className="w-4 h-4" />
                  Create Activity
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: "var(--color-hookers-green)" }}
                >
                  <Plus className="w-4 h-4" />
                  Find Activities
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overdue Activities */}
              {groupedActivities.overdue.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-medium text-onyx">Overdue</h3>
                    <span
                      className="text-sm text-white px-2 py-1 rounded-full font-medium"
                      style={{ backgroundColor: "var(--color-keppel)" }}
                    >
                      {groupedActivities.overdue.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {groupedActivities.overdue.map((activity) => (
                      <CalendarActivityCard
                        key={activity.id}
                        activity={activity}
                        isNext={false}
                        isCreator={activity.creator_id === user.id}
                        userId={user.id}
                        onLeave={handleLeave}
                        onCancel={
                          activity.creator_id === user.id
                            ? handleCancel
                            : undefined
                        }
                        onEdit={
                          activity.creator_id === user.id
                            ? handleEdit
                            : undefined
                        }
                        busy={!!joining[activity.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Activities */}
              {groupedActivities.today.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-onyx">Today</h3>
                  </div>
                  <div className="space-y-3">
                    {groupedActivities.today.map((activity, index) => (
                      <CalendarActivityCard
                        key={activity.id}
                        activity={activity}
                        isNext={index === 0}
                        isCreator={activity.creator_id === user.id}
                        userId={user.id}
                        onLeave={handleLeave}
                        onCancel={
                          activity.creator_id === user.id
                            ? handleCancel
                            : undefined
                        }
                        onEdit={
                          activity.creator_id === user.id
                            ? handleEdit
                            : undefined
                        }
                        busy={!!joining[activity.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow's Activities */}
              {groupedActivities.tomorrow.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-onyx">Tomorrow</h3>
                  </div>
                  <div className="space-y-3">
                    {groupedActivities.tomorrow.map((activity) => (
                      <CalendarActivityCard
                        key={activity.id}
                        activity={activity}
                        isNext={false}
                        isCreator={activity.creator_id === user.id}
                        userId={user.id}
                        onLeave={handleLeave}
                        onCancel={
                          activity.creator_id === user.id
                            ? handleCancel
                            : undefined
                        }
                        onEdit={
                          activity.creator_id === user.id
                            ? handleEdit
                            : undefined
                        }
                        busy={!!joining[activity.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* This Week's Activities */}
              {groupedActivities.thisWeek.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-onyx">This week</h3>
                  </div>
                  <div className="space-y-3">
                    {groupedActivities.thisWeek.map((activity) => (
                      <CalendarActivityCard
                        key={activity.id}
                        activity={activity}
                        isNext={false}
                        isCreator={activity.creator_id === user.id}
                        userId={user.id}
                        onLeave={handleLeave}
                        onCancel={
                          activity.creator_id === user.id
                            ? handleCancel
                            : undefined
                        }
                        onEdit={
                          activity.creator_id === user.id
                            ? handleEdit
                            : undefined
                        }
                        busy={!!joining[activity.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Later Activities */}
              {groupedActivities.later.length > 0 && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-onyx">Later</h3>
                  </div>
                  <div className="space-y-3">
                    {groupedActivities.later.map((activity) => (
                      <CalendarActivityCard
                        key={activity.id}
                        activity={activity}
                        isNext={false}
                        isCreator={activity.creator_id === user.id}
                        userId={user.id}
                        onLeave={handleLeave}
                        onCancel={
                          activity.creator_id === user.id
                            ? handleCancel
                            : undefined
                        }
                        onEdit={
                          activity.creator_id === user.id
                            ? handleEdit
                            : undefined
                        }
                        busy={!!joining[activity.id]}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
