import { useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const mounted = useRef(true);
  const profileCache = useRef(new Map());

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Optimized profile fetching with caching
  const fetchProfile = async (userId) => {
    // Check cache first
    if (profileCache.current.has(userId)) {
      return profileCache.current.get(userId);
    }

    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, display_name")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const result = profileData || { onboarding_completed: false };
      // Cache the result for 30 seconds
      profileCache.current.set(userId, result);
      setTimeout(() => profileCache.current.delete(userId), 30000);

      return result;
    } catch (err) {
      console.error("Profile fetch error:", err);
      return { onboarding_completed: false };
    }
  };

  // Debug: Log if loading takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && mounted.current) {
        console.warn(
          "ProtectedRoute: Loading taking longer than expected, check network/database connection"
        );
        setError(
          "Loading is taking longer than usual. Please check your connection."
        );
      }
    }, 8000); // 8 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  useEffect(() => {
    // Get initial session and profile
    const getSessionAndProfile = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted.current) return;

        if (session?.user) {
          setUser(session.user);

          // Fetch profile with caching
          const profileData = await fetchProfile(session.user.id);

          if (mounted.current) {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Session/Profile fetch error:", err);
        if (mounted.current) {
          setUser(null);
          setProfile(null);
          setError(err.message || "Authentication error");
        }
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    getSessionAndProfile();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;

      try {
        if (session?.user) {
          setUser(session.user);

          // Only fetch profile if user changed or we don't have profile data
          if (!profile || profile.userId !== session.user.id) {
            const profileData = await fetchProfile(session.user.id);

            if (mounted.current) {
              setProfile({ ...profileData, userId: session.user.id });
            }
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        if (mounted.current) {
          setUser(null);
          setProfile(null);
          setError(err.message || "Authentication error");
        }
      }

      if (mounted.current) {
        setLoading(false);
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependencies managed inside the effect to prevent infinite loops

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center animate-pulse">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-lg font-semibold text-gray-700">
              Loading...
            </span>
          </div>
          {error && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user needs to complete onboarding
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    // Only redirect to onboarding if not already on onboarding page
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // If on onboarding page but already completed, redirect to app
  if (location.pathname === "/onboarding" && profile?.onboarding_completed) {
    return <Navigate to="/app" replace />;
  }

  return children;
}
