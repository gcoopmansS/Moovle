import { Search, MapPin } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import {
  listFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "../api/friendships";
import {
  getProfilesByIds,
  searchProfiles,
  getProfilesNearLocation,
} from "../api/profiles";
import { supabase } from "../lib/supabase";

export default function FriendsPage() {
  const { user, loading } = useSupabaseAuth();
  const me = user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  const [edges, setEdges] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [discover, setDiscover] = useState([]);
  const [nearbyPeople, setNearbyPeople] = useState([]);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [busyIds, setBusyIds] = useState({});

  // Always define effects (they can no-op when not ready)
  const load = useCallback(async () => {
    if (!me) return;
    setListLoading(true);
    try {
      const e = await listFriendships(me);
      setEdges(e);
      const ids = Array.from(
        new Set(
          e.flatMap((f) => [f.user_a, f.user_b]).filter((id) => id && id !== me)
        )
      );
      if (ids.length) {
        const profs = await getProfilesByIds(ids);
        setProfilesMap(Object.fromEntries(profs.map((p) => [p.id, p])));
      } else {
        setProfilesMap({});
      }
    } finally {
      setListLoading(false);
    }
  }, [me]);

  const loadCurrentUserLocation = useCallback(async () => {
    if (!me) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("location_lat, location_lng, location")
        .eq("id", me)
        .single();

      if (error) throw error;

      if (data?.location_lat && data?.location_lng) {
        setCurrentUserLocation({
          lat: data.location_lat,
          lng: data.location_lng,
          location: data.location,
        });
      }
    } catch (error) {
      console.error("Error loading user location:", error);
    }
  }, [me]);

  useEffect(() => {
    if (me) {
      load();
      loadCurrentUserLocation();
    }
  }, [me, load, loadCurrentUserLocation]);

  // ❗ Call all memos unconditionally
  const acceptedFriendIds = useMemo(
    () =>
      edges
        .filter((f) => f.status === "accepted")
        .map((f) => (f.user_a === me ? f.user_b : f.user_a)),
    [edges, me]
  );

  const incoming = useMemo(
    () =>
      edges.filter(
        (f) =>
          f.status === "pending" &&
          (f.user_a === me || f.user_b === me) &&
          f.requested_by !== me
      ),
    [edges, me]
  );

  const outgoing = useMemo(
    () => edges.filter((f) => f.status === "pending" && f.requested_by === me),
    [edges, me]
  );

  const excludeIds = useMemo(() => {
    const set = new Set();
    if (me) set.add(me);

    // Exclude users with accepted friendships (already friends)
    edges
      .filter((f) => f.status === "accepted")
      .forEach((f) => {
        set.add(f.user_a);
        set.add(f.user_b);
      });

    // Exclude users with incoming pending requests (requests sent TO us)
    // But keep users with outgoing pending requests (requests sent BY us) so they can show "Request sent"
    edges
      .filter((f) => f.status === "pending" && f.requested_by !== me)
      .forEach((f) => {
        set.add(f.user_a);
        set.add(f.user_b);
      });

    return Array.from(set).filter(Boolean);
  }, [edges, me]);

  const loadNearbyPeople = useCallback(async () => {
    if (!currentUserLocation || !me) return;

    setNearbyLoading(true);
    try {
      const nearbyProfiles = await getProfilesNearLocation(
        currentUserLocation.lat,
        currentUserLocation.lng,
        50, // 50km radius
        excludeIds,
        20 // limit to 20 people
      );
      setNearbyPeople(nearbyProfiles);
    } catch (error) {
      console.error("Error loading nearby people:", error);
    } finally {
      setNearbyLoading(false);
    }
  }, [currentUserLocation, me, excludeIds]);

  useEffect(() => {
    if (currentUserLocation && activeTab === "discover") {
      loadNearbyPeople();
    }
  }, [currentUserLocation, excludeIds, activeTab, loadNearbyPeople]);

  const filteredFriends = useMemo(
    () =>
      acceptedFriendIds
        .map((id) => profilesMap[id])
        .filter(Boolean)
        .filter((p) =>
          (p.display_name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        ),
    [acceptedFriendIds, profilesMap, searchQuery]
  );

  // Helper function to check if we have a pending outgoing request to this user
  const hasPendingRequestTo = useCallback(
    (userId) => {
      return outgoing.some((f) => {
        const other = f.user_a === me ? f.user_b : f.user_a;
        return other === userId;
      });
    },
    [outgoing, me]
  );

  // Handlers (no hooks inside)
  async function handleSearch(q) {
    setSearchQuery(q);
    if (!q.trim() || !me) {
      setDiscover([]);
      return;
    }
    const results = await searchProfiles(q, excludeIds);
    setDiscover(results);
  }
  async function handleSend(otherId) {
    setBusyIds((s) => ({ ...s, [otherId]: true }));
    try {
      await sendFriendRequest(me, otherId);
      await load();
      // Send friend request
    } catch (error) {
      console.error("Error sending friend request:", error);
    } finally {
      setBusyIds((s) => ({ ...s, [otherId]: false }));
    }
  }

  async function handleAccept(otherId) {
    setBusyIds((s) => ({ ...s, [otherId]: true }));
    try {
      await acceptFriendRequest(me, otherId);
      await load();
      // Accept friend request
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setBusyIds((s) => ({ ...s, [otherId]: false }));
    }
  }

  async function handleDecline(otherId) {
    setBusyIds((s) => ({ ...s, [otherId]: true }));
    try {
      await declineFriendRequest(me, otherId);
      await load();
    } catch (error) {
      console.error("Error declining friend request:", error);
    } finally {
      setBusyIds((s) => ({ ...s, [otherId]: false }));
    }
  }

  // Render guards without early-hook returns
  const isAuthReady = !loading && !!me;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Friends</h2>
        <p className="text-gray-600 mb-6">
          Connect with your friends and join activities together!
        </p>
      </div>

      {!isAuthReady ? (
        <div className="text-gray-500 text-center py-8">Loading…</div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === "discover" ? "Search people…" : "Search friends…"
              }
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={searchQuery}
              onChange={(e) =>
                activeTab === "discover"
                  ? handleSearch(e.target.value)
                  : setSearchQuery(e.target.value)
              }
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "friends"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              My Friends ({acceptedFriendIds.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === "requests"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Requests
              {incoming.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {incoming.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === "discover"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Discover
            </button>
          </div>

          {/* Content */}
          {listLoading ? (
            <div className="text-gray-500 text-center py-8">Loading…</div>
          ) : activeTab === "friends" ? (
            <div>
              {filteredFriends.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No friends found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFriends.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-blue-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <img
                          src={
                            p.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p.display_name || "User"
                            )}&background=0D8ABC&color=fff`
                          }
                          alt={p.display_name || "User"}
                          className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover mb-3"
                        />
                        <h3 className="font-semibold text-gray-900 text-base mb-1">
                          {p.display_name || "User"}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">
                          {p.location || "Location not set"}
                        </p>
                        {p.bio && (
                          <p className="text-sm text-gray-600 text-center line-clamp-2">
                            {p.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === "requests" ? (
            <div>
              {incoming.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No requests.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Incoming Requests
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {incoming.map((f) => {
                      const other = f.user_a === me ? f.user_b : f.user_a;
                      const p = profilesMap[other];
                      return (
                        <div
                          key={`${f.user_a}-${f.user_b}`}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col items-center text-center">
                            <img
                              src={
                                p?.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  p?.display_name || "User"
                                )}&background=0D8ABC&color=fff`
                              }
                              alt={p?.display_name || "User"}
                              className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover mb-3"
                            />
                            <h3 className="font-semibold text-gray-900 text-base mb-1">
                              {p?.display_name || "User"}
                            </h3>
                            <p className="text-xs text-gray-400 mb-4">
                              {p?.location || "Location not set"}
                            </p>
                            <div className="flex gap-2 w-full">
                              <button
                                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-colors"
                                disabled={!!busyIds[other]}
                                onClick={() => handleAccept(other)}
                              >
                                {busyIds[other] ? "..." : "Accept"}
                              </button>
                              <button
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 disabled:opacity-60 transition-colors"
                                disabled={!!busyIds[other]}
                                onClick={() => handleDecline(other)}
                              >
                                {busyIds[other] ? "..." : "Decline"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {outgoing.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-600 mb-3">
                    Sent Requests
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {outgoing.map((f) => {
                      const other = f.user_a === me ? f.user_b : f.user_a;
                      const p = profilesMap[other];
                      return (
                        <div
                          key={`${f.user_a}-${f.user_b}`}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center"
                        >
                          <img
                            src={
                              p?.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p?.display_name || "User"
                              )}&background=0D8ABC&color=fff`
                            }
                            alt={p?.display_name || "User"}
                            className="w-12 h-12 rounded-full border border-gray-200 shadow-sm object-cover mx-auto mb-2"
                          />
                          <p className="font-medium text-gray-700 text-sm">
                            {p?.display_name || "User"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Request sent
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Discover
            <div>
              {/* Show nearby people first, then search results */}
              {!currentUserLocation ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 mb-2">
                    Add your location in Profile to discover nearby sports
                    buddies
                  </div>
                  <div className="text-sm text-gray-400">
                    Or search for people by name below
                  </div>
                </div>
              ) : nearbyLoading ? (
                <div className="text-gray-500 text-center py-8">
                  Finding nearby sports buddies...
                </div>
              ) : searchQuery.trim().length > 0 ? (
                // Show search results when searching
                discover.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    No search results found.
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">
                      Search Results
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {discover.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex flex-col items-center text-center">
                            <img
                              src={
                                p.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  p.display_name || "User"
                                )}&background=0D8ABC&color=fff`
                              }
                              alt={p.display_name || "User"}
                              className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover mb-3"
                            />
                            <h3 className="font-semibold text-gray-900 text-base mb-1">
                              {p.display_name || "User"}
                            </h3>
                            <p className="text-xs text-gray-400 mb-4">
                              {p.location || "Location not set"}
                            </p>
                            {hasPendingRequestTo(p.id) ? (
                              <span className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                                Request sent
                              </span>
                            ) : (
                              <button
                                className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-colors"
                                disabled={!!busyIds[p.id]}
                                onClick={() => handleSend(p.id)}
                              >
                                {busyIds[p.id] ? "Sending..." : "Add Friend"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : nearbyPeople.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <div className="text-gray-500 mb-2">
                    No sports buddies found nearby
                  </div>
                  <div className="text-sm text-gray-400">
                    Try searching for people by name above
                  </div>
                </div>
              ) : (
                // Show nearby people by default
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Nearby Sports Buddies ({currentUserLocation.location})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nearbyPeople.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col items-center text-center">
                          <img
                            src={
                              p.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p.display_name || "User"
                              )}&background=0D8ABC&color=fff`
                            }
                            alt={p.display_name || "User"}
                            className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-sm object-cover mb-3"
                          />
                          <h3 className="font-semibold text-gray-900 text-base mb-1">
                            {p.display_name || "User"}
                          </h3>
                          <p className="text-xs text-gray-400 mb-4 flex items-center gap-1 justify-center">
                            {p.distance
                              ? `${p.distance.toFixed(1)}km away`
                              : p.location}
                          </p>
                          {hasPendingRequestTo(p.id) ? (
                            <span className="w-full bg-gray-100 text-gray-500 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed">
                              Request sent
                            </span>
                          ) : (
                            <button
                              className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-60 transition-colors"
                              disabled={!!busyIds[p.id]}
                              onClick={() => handleSend(p.id)}
                            >
                              {busyIds[p.id] ? "Sending..." : "Add Friend"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
