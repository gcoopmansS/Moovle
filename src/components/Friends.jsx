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

export default function Friends() {
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
      // The recipient will get a notification automatically
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
      // The original sender will get a notification automatically
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
                <ul className="divide-y divide-gray-100">
                  {filteredFriends.map((p) => (
                    <li key={p.id} className="py-3 flex items-center gap-3">
                      <img
                        src={
                          p.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            p.display_name || "User"
                          )}&background=0D8ABC&color=fff`
                        }
                        alt={p.display_name || "User"}
                        className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-base">
                          {p.display_name || "User"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {p.id.slice(0, 8)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : activeTab === "requests" ? (
            <div>
              {incoming.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No requests.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {incoming.map((f) => {
                    const other = f.user_a === me ? f.user_b : f.user_a;
                    const p = profilesMap[other];
                    return (
                      <li
                        key={`${f.user_a}-${f.user_b}`}
                        className="py-3 flex items-center gap-3"
                      >
                        <img
                          src={
                            p?.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p?.display_name || "User"
                            )}&background=0D8ABC&color=fff`
                          }
                          alt={p?.display_name || "User"}
                          className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 text-base">
                            {p?.display_name || "User"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {other.slice(0, 8)}
                          </span>
                        </div>
                        <div className="ml-auto flex gap-2">
                          <button
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 disabled:opacity-60"
                            disabled={!!busyIds[other]}
                            onClick={() => handleAccept(other)}
                          >
                            Accept
                          </button>
                          <button
                            className="px-3 py-1 rounded-lg text-xs border hover:bg-gray-50 disabled:opacity-60"
                            disabled={!!busyIds[other]}
                            onClick={() => handleDecline(other)}
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {outgoing.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">
                    Sent requests
                  </h4>
                  <ul className="text-sm text-gray-600">
                    {outgoing.map((f) => {
                      const other = f.user_a === me ? f.user_b : f.user_a;
                      const p = profilesMap[other];
                      return (
                        <li key={`${f.user_a}-${f.user_b}`}>
                          → {p?.display_name || other.slice(0, 8)}
                        </li>
                      );
                    })}
                  </ul>
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
                    <ul className="divide-y divide-gray-100">
                      {discover.map((p) => (
                        <li key={p.id} className="py-3 flex items-center gap-3">
                          <img
                            src={
                              p.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p.display_name || "User"
                              )}&background=0D8ABC&color=fff`
                            }
                            alt={p.display_name || "User"}
                            className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-800 text-base">
                              {p.display_name || "User"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {p.id.slice(0, 8)}
                            </span>
                          </div>
                          {hasPendingRequestTo(p.id) ? (
                            <span className="ml-auto bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs cursor-not-allowed">
                              Request sent
                            </span>
                          ) : (
                            <button
                              className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 disabled:opacity-60"
                              disabled={!!busyIds[p.id]}
                              onClick={() => handleSend(p.id)}
                            >
                              Add
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
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
                  <ul className="divide-y divide-gray-100">
                    {nearbyPeople.map((p) => (
                      <li key={p.id} className="py-3 flex items-center gap-3">
                        <img
                          src={
                            p.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p.display_name || "User"
                            )}&background=0D8ABC&color=fff`
                          }
                          alt={p.display_name || "User"}
                          className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 text-base">
                            {p.display_name || "User"}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {p.distance
                              ? `${p.distance.toFixed(1)}km away`
                              : p.location}
                          </span>
                        </div>
                        {hasPendingRequestTo(p.id) ? (
                          <span className="ml-auto bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-xs cursor-not-allowed">
                            Request sent
                          </span>
                        ) : (
                          <button
                            className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600 disabled:opacity-60"
                            disabled={!!busyIds[p.id]}
                            onClick={() => handleSend(p.id)}
                          >
                            Add
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
