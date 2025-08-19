import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { ActivityService } from "../services";
import { supabase } from "../lib/supabase";
import ActivityCard from "../components/ActivityCard";
import {
  Search,
  Filter,
  RefreshCw,
  Compass,
  MapPin,
  Clock,
} from "lucide-react";

export default function ActivityFeedPage() {
  const { user } = useSupabaseAuth();
  const [availableActivities, setAvailableActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState({}); // activityId -> boolean
  const [joinedMap, setJoinedMap] = useState({}); // activityId -> true/false
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?.id) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
        setRefreshing(false);
      }
    },
    [user]
  );

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

  const handleRefresh = () => {
    load(true);
  };

  // Filter activities based on search and location
  const filteredActivities = availableActivities.filter((activity) => {
    const matchesSearch =
      !searchQuery ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.sport_type?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      activity.location_text
        ?.toLowerCase()
        .includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

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
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Feed</h1>
        </div>
        <p className="text-gray-600">
          Discover new sports activities and connect with people
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities, sports, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location Filter */}
          <div className="relative min-w-0 flex-shrink-0 w-48">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Active Filters */}
        {(searchQuery || locationFilter) && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-500 hover:text-blue-700 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {locationFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Location: "{locationFilter}"
                <button
                  onClick={() => setLocationFilter("")}
                  className="text-green-500 hover:text-green-700 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Activity Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {filteredActivities.length === availableActivities.length
            ? `${filteredActivities.length} activities available`
            : `${filteredActivities.length} of ${availableActivities.length} activities`}
        </h2>
        {filteredActivities.length !== availableActivities.length && (
          <button
            onClick={() => {
              setSearchQuery("");
              setLocationFilter("");
            }}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Activities Grid */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {searchQuery || locationFilter ? (
              <Search className="w-8 h-8 text-gray-400" />
            ) : (
              <Compass className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || locationFilter
              ? "No activities match your search"
              : "No activities available right now"}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {searchQuery || locationFilter
              ? "Try adjusting your search criteria or check back later."
              : "Check back later for new activities or create your own!"}
          </p>
          {(searchQuery || locationFilter) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setLocationFilter("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Filter className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {filteredActivities.map((activity) => {
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
  );
}
