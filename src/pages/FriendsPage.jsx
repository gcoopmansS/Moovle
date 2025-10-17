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
  const [activeTab, setActiveTab] = useState("discover");

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
      // Add timeout for loading
      const timeoutId = setTimeout(() => {
        console.warn("Friends loading timeout");
        setListLoading(false);
      }, 10000);

      const e = await listFriendships(me);
      setEdges(e);

      clearTimeout(timeoutId);

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
    } catch (error) {
      console.error("Error loading friends:", error);
      setEdges([]);
      setProfilesMap({});
    } finally {
      setListLoading(false);
    }
  }, [me]);

  const loadCurrentUserLocation = useCallback(async () => {
    if (!me) return;
    try {
      // Add timeout
      const timeoutId = setTimeout(() => {
        console.warn("Location loading timeout");
      }, 5000);

      const { data, error } = await supabase
        .from("profiles")
        .select("location_lat, location_lng, location")
        .eq("id", me)
        .single();

      clearTimeout(timeoutId);

      if (error && error.code !== "PGRST116") {
        throw error;
      }

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
        <h2 className="text-2xl font-medium text-onyx mb-4">Friends</h2>
        <p className="text-onyx/70 mb-6">
          Connect with your friends and join activities together!
        </p>
      </div>

      {!isAuthReady ? (
        <div className="text-onyx/50 text-center py-8">Loading…</div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-onyx/40" />
            <input
              type="text"
              placeholder={
                activeTab === "discover" ? "Search people…" : "Search friends…"
              }
              className="w-full pl-10 pr-4 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-dark_cyan/30 focus:border-dark_cyan transition-all shadow-minimal"
              value={searchQuery}
              onChange={(e) =>
                activeTab === "discover"
                  ? handleSearch(e.target.value)
                  : setSearchQuery(e.target.value)
              }
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-white/60 backdrop-blur-sm rounded-xl p-1 mb-4 border border-white/40 shadow-minimal">
            <button
              onClick={() => setActiveTab("discover")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "discover"
                  ? "bg-white/90 backdrop-blur-sm text-dark_cyan shadow-minimal"
                  : "text-onyx/70 hover:text-onyx"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                activeTab === "requests"
                  ? "bg-white/90 backdrop-blur-sm text-dark_cyan shadow-minimal"
                  : "text-onyx/70 hover:text-onyx"
              }`}
            >
              Requests
              {incoming.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-keppel rounded-full text-xs text-white flex items-center justify-center font-medium">
                  {incoming.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === "friends"
                  ? "bg-white/90 backdrop-blur-sm text-dark_cyan shadow-minimal"
                  : "text-onyx/70 hover:text-onyx"
              }`}
            >
              My Friends ({acceptedFriendIds.length})
            </button>
          </div>

          {/* Content */}
          {listLoading ? (
            <div className="text-onyx/50 text-center py-8">Loading…</div>
          ) : activeTab === "friends" ? (
            <div>
              {filteredFriends.length === 0 ? (
                <div className="text-onyx/50 text-center py-8">
                  No friends found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredFriends.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-all duration-300 hover:border-keppel/30 shadow-minimal hover:scale-105"
                    >
                      <div className="flex flex-col items-center text-center">
                        <img
                          src={
                            p.avatar_url ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              p.display_name || "User"
                            )}&background=${encodeURIComponent(
                              "397367"
                            )}&color=fff`
                          }
                          alt={p.display_name || "User"}
                          className="w-16 h-16 rounded-full border-2 border-white/50 shadow-sm object-cover mb-3"
                        />
                        <h3 className="font-medium text-onyx text-base mb-1">
                          {p.display_name || "User"}
                        </h3>
                        <p className="text-xs text-onyx/60 mb-3">
                          {p.location || "Location not set"}
                        </p>
                        {p.bio && (
                          <p className="text-sm text-onyx/70 text-center line-clamp-2">
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
                <div className="text-onyx/50 text-center py-8">
                  No requests.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-onyx/70 mb-3">
                    Incoming Requests
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {incoming.map((f) => {
                      const other = f.user_a === me ? f.user_b : f.user_a;
                      const p = profilesMap[other];
                      return (
                        <div
                          key={`${f.user_a}-${f.user_b}`}
                          className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-all duration-300 shadow-minimal hover:scale-105"
                        >
                          <div className="flex flex-col items-center text-center">
                            <img
                              src={
                                p?.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  p?.display_name || "User"
                                )}&background=${encodeURIComponent(
                                  "397367"
                                )}&color=fff`
                              }
                              alt={p?.display_name || "User"}
                              className="w-16 h-16 rounded-full border-2 border-white/50 shadow-sm object-cover mb-3"
                            />
                            <h3 className="font-medium text-onyx text-base mb-1">
                              {p?.display_name || "User"}
                            </h3>
                            <p className="text-xs text-onyx/60 mb-4">
                              {p?.location || "Location not set"}
                            </p>
                            <div className="flex gap-2 w-full">
                              <button
                                className="flex-1 bg-dark_cyan text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-dark_cyan/80 disabled:opacity-60 transition-all duration-300 shadow-minimal hover:scale-105"
                                disabled={!!busyIds[other]}
                                onClick={() => handleAccept(other)}
                              >
                                {busyIds[other] ? "..." : "Accept"}
                              </button>
                              <button
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium border border-white/40 text-onyx/70 bg-white/80 backdrop-blur-sm hover:bg-white/90 disabled:opacity-60 transition-all duration-300 shadow-minimal hover:scale-105"
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
                  <h4 className="text-sm font-medium text-onyx/70 mb-3">
                    Sent Requests
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {outgoing.map((f) => {
                      const other = f.user_a === me ? f.user_b : f.user_a;
                      const p = profilesMap[other];
                      return (
                        <div
                          key={`${f.user_a}-${f.user_b}`}
                          className="bg-white/50 backdrop-blur-sm border border-white/40 rounded-xl p-3 text-center shadow-minimal"
                        >
                          <img
                            src={
                              p?.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p?.display_name || "User"
                              )}&background=${encodeURIComponent(
                                "397367"
                              )}&color=fff`
                            }
                            alt={p?.display_name || "User"}
                            className="w-12 h-12 rounded-full border border-white/50 shadow-sm object-cover mx-auto mb-2"
                          />
                          <p className="font-medium text-onyx text-sm">
                            {p?.display_name || "User"}
                          </p>
                          <p className="text-xs text-onyx/60 mt-1">
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
                  <MapPin className="w-12 h-12 text-onyx/30 mx-auto mb-3" />
                  <div className="text-onyx/50 mb-2">
                    Add your location in Profile to discover nearby sports
                    buddies
                  </div>
                  <div className="text-sm text-onyx/40">
                    Or search for people by name below
                  </div>
                </div>
              ) : nearbyLoading ? (
                <div className="text-onyx/50 text-center py-8">
                  Finding nearby sports buddies...
                </div>
              ) : searchQuery.trim().length > 0 ? (
                // Show search results when searching
                discover.length === 0 ? (
                  <div className="text-onyx/50 text-center py-8">
                    No search results found.
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-onyx/70 mb-3">
                      Search Results
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {discover.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-all duration-300 shadow-minimal hover:scale-105"
                        >
                          <div className="flex flex-col items-center text-center">
                            <img
                              src={
                                p.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  p.display_name || "User"
                                )}&background=${encodeURIComponent(
                                  "397367"
                                )}&color=fff`
                              }
                              alt={p.display_name || "User"}
                              className="w-16 h-16 rounded-full border-2 border-white/50 shadow-sm object-cover mb-3"
                            />
                            <h3 className="font-medium text-onyx text-base mb-1">
                              {p.display_name || "User"}
                            </h3>
                            <p className="text-xs text-onyx/60 mb-4">
                              {p.location || "Location not set"}
                            </p>
                            {hasPendingRequestTo(p.id) ? (
                              <span className="w-full bg-white/50 backdrop-blur-sm text-onyx/60 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-white/40">
                                Request sent
                              </span>
                            ) : (
                              <button
                                className="w-full bg-dark_cyan text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-dark_cyan/80 disabled:opacity-60 transition-all duration-300 shadow-minimal hover:scale-105"
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
                  <MapPin className="w-12 h-12 text-onyx/30 mx-auto mb-3" />
                  <div className="text-onyx/50 mb-2">
                    No sports buddies found nearby
                  </div>
                  <div className="text-sm text-onyx/40">
                    Try searching for people by name above
                  </div>
                </div>
              ) : (
                // Show nearby people by default
                <div>
                  <h4 className="text-sm font-medium text-onyx/70 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Nearby Sports Buddies ({currentUserLocation.location})
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nearbyPeople.map((p) => (
                      <div
                        key={p.id}
                        className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:bg-white/80 transition-all duration-300 shadow-minimal hover:scale-105"
                      >
                        <div className="flex flex-col items-center text-center">
                          <img
                            src={
                              p.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                p.display_name || "User"
                              )}&background=${encodeURIComponent(
                                "397367"
                              )}&color=fff`
                            }
                            alt={p.display_name || "User"}
                            className="w-16 h-16 rounded-full border-2 border-white/50 shadow-sm object-cover mb-3"
                          />
                          <h3 className="font-medium text-onyx text-base mb-1">
                            {p.display_name || "User"}
                          </h3>
                          <p className="text-xs text-onyx/60 mb-4 flex items-center gap-1 justify-center">
                            {p.distance
                              ? `${p.distance.toFixed(1)}km away`
                              : p.location}
                          </p>
                          {hasPendingRequestTo(p.id) ? (
                            <span className="w-full bg-white/50 backdrop-blur-sm text-onyx/60 px-3 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-white/40">
                              Request sent
                            </span>
                          ) : (
                            <button
                              className="w-full bg-dark_cyan text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-dark_cyan/80 disabled:opacity-60 transition-all duration-300 shadow-minimal hover:scale-105"
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
