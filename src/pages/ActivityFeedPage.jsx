import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { ActivityService } from "../services";
import { supabase } from "../lib/supabase";
import FeedActivityCard from "../components/FeedActivityCard";
import { Compass, Filter } from "lucide-react";

export default function ActivityFeedPage() {
  const { user } = useSupabaseAuth();
  const [availableActivities, setAvailableActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [joinedMap, setJoinedMap] = useState({}); // activityId -> true/false
  const [selectedSportType, setSelectedSportType] = useState(""); // sport type filter

  const load = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      // Load available activities (discovery feed)
      const availableData = await ActivityService.getActivityFeed({
        currentUserId: user.id,
      });

      // Filter out invitations and activities user already joined
      const discoverableActivities = availableData.filter(
        (activity) =>
          !activity.isInvited || activity.invitationStatus !== "pending"
      );

      setAvailableActivities(discoverableActivities);

      // Check which activities user has already joined
      if (discoverableActivities.length > 0) {
        const activityIds = discoverableActivities.map((a) => a.id);

        const { data: participants, error } = await supabase
          .from("activity_participants")
          .select("activity_id")
          .eq("user_id", user.id)
          .in("activity_id", activityIds);

        if (error) {
          console.warn("Error fetching participants:", error);
        } else {
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
      console.error("Error loading activity feed:", error);
      setAvailableActivities([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleJoin(activityId) {
    if (!user?.id) return;

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await ActivityService.joinActivity(activityId, user.id);
      setJoinedMap((m) => ({ ...m, [activityId]: true }));

      // Optionally remove from feed since they joined
      // setAvailableActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error) {
      console.error("Failed to join activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  async function handleLeave(activityId) {
    if (!user?.id) return;

    setJoining((s) => ({ ...s, [activityId]: true }));
    try {
      await ActivityService.leaveActivity(activityId, user.id);
      setJoinedMap((m) => ({ ...m, [activityId]: false }));
    } catch (error) {
      console.error("Failed to leave activity:", error);
    } finally {
      setJoining((s) => ({ ...s, [activityId]: false }));
    }
  }

  // Group activities by date for timeline display
  const groupActivitiesByDate = (activities) => {
    // Filter by sport type if selected
    let filteredActivities = activities;
    if (selectedSportType) {
      filteredActivities = activities.filter((activity) => {
        return activity.type === selectedSportType;
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
    };

    filteredActivities.forEach((activity) => {
      const activityDate = new Date(activity.starts_at);
      const activityDay = new Date(
        activityDate.getFullYear(),
        activityDate.getMonth(),
        activityDate.getDate()
      );

      if (activityDay.getTime() === today.getTime()) {
        groups.today.push(activity);
      } else if (activityDay.getTime() === tomorrow.getTime()) {
        groups.tomorrow.push(activity);
      } else if (activityDate < nextWeek) {
        groups.thisWeek.push(activity);
      } else {
        groups.later.push(activity);
      }
    });

    // Sort activities within each group by time
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    });

    return groups;
  };

  // Get unique sport types for filter dropdown
  const getUniqueSportTypes = (activities) => {
    const sportTypes = activities
      .map((activity) => {
        // The correct field name is 'type'
        const sportType = activity.type;
        return sportType;
      })
      .filter(Boolean) // Remove null/undefined values
      .filter((type, index, array) => array.indexOf(type) === index) // Remove duplicates
      .sort(); // Alphabetical order

    return sportTypes;
  };

  const activityGroups = groupActivitiesByDate(availableActivities);
  const uniqueSportTypes = getUniqueSportTypes(availableActivities);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Discovering activities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Discover Activities
            </h1>
            <p className="text-gray-600 text-sm">
              Find sports activities near you
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Sport Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedSportType}
              onChange={(e) => setSelectedSportType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-sm min-w-[140px]"
            >
              <option value="">All Sports</option>
              {uniqueSportTypes.length > 0 ? (
                uniqueSportTypes.map((sportType) => (
                  <option key={sportType} value={sportType}>
                    {sportType}
                  </option>
                ))
              ) : (
                <option disabled>No sport types available</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Sections */}
      {availableActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No activities available right now
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Check back later for new activities or create your own!
          </p>
        </div>
      ) : Object.values(activityGroups).every((group) => group.length === 0) ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {selectedSportType} activities found
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Try selecting a different sport type or check back later.
          </p>
          <button
            onClick={() => setSelectedSportType("")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            Show All Sports
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Today */}
          {activityGroups.today.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Today</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {activityGroups.today.length} activities
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {activityGroups.today.map((activity) => {
                  const joined = !!joinedMap[activity.id];
                  const busy = !!joining[activity.id];
                  return (
                    <FeedActivityCard
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
            </div>
          )}

          {/* Tomorrow */}
          {activityGroups.tomorrow.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Tomorrow</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {activityGroups.tomorrow.length} activities
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {activityGroups.tomorrow.map((activity) => {
                  const joined = !!joinedMap[activity.id];
                  const busy = !!joining[activity.id];
                  return (
                    <FeedActivityCard
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
            </div>
          )}

          {/* This Week */}
          {activityGroups.thisWeek.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">This Week</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {activityGroups.thisWeek.length} activities
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {activityGroups.thisWeek.map((activity) => {
                  const joined = !!joinedMap[activity.id];
                  const busy = !!joining[activity.id];
                  return (
                    <FeedActivityCard
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
            </div>
          )}

          {/* Later */}
          {activityGroups.later.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Later</h2>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                <span className="text-sm text-gray-500 font-medium">
                  {activityGroups.later.length} activities
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                {activityGroups.later.map((activity) => {
                  const joined = !!joinedMap[activity.id];
                  const busy = !!joining[activity.id];
                  return (
                    <FeedActivityCard
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
