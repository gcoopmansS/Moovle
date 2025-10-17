import {
  Bell,
  MessageCircle,
  UserCircleIcon,
  Settings,
  LogOut,
  Home,
  Plus,
  Users,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Header({ children, onCreateClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Get current route for active state
  const getCurrentView = () => {
    const path = location.pathname;
    if (path === "/app" || path === "/app/") return "feed";
    if (path.includes("/calendar")) return "calendar";
    if (path.includes("/create")) return "create";
    if (path.includes("/friends")) return "friends";
    if (path.includes("/profile")) return "profile";
    return "feed";
  };

  const currentView = getCurrentView();

  // Generate initials from display name for fallback avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Reset avatar error when user profile changes
  useEffect(() => {
    setAvatarError(false);
  }, [userProfile?.avatar_url]);

  // Fetch user data and profile
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);

        // Fetch user profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select(
            "display_name, avatar_url, location, location_lat, location_lng"
          )
          .eq("id", session.user.id)
          .single();

        if (!error && profile) {
          // Handle avatar URL if it's a storage path
          let avatarUrl = profile.avatar_url;

          if (avatarUrl && !avatarUrl.startsWith("http")) {
            try {
              const { data: signed, error: signErr } = await supabase.storage
                .from("avatars")
                .createSignedUrl(avatarUrl, 60 * 60 * 24); // 24 hours
              if (!signErr && signed?.signedUrl) {
                avatarUrl = signed.signedUrl;
              }
            } catch (error) {
              console.error("Error generating signed URL:", error);
            }
          }
          setUserProfile({ ...profile, avatar_url: avatarUrl });
        }
      }
    };

    fetchUserData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation items configuration
  const navigationItems = [
    {
      id: "feed",
      label: "Feed",
      icon: Home,
      gradient: "from-dark_cyan to-keppel",
      hoverColor: "hover:text-dark_cyan hover:bg-dark_cyan/10",
    },
    {
      id: "calendar",
      label: "Calendar",
      icon: Calendar,
      gradient: "from-keppel to-robin_egg_blue",
      hoverColor: "hover:text-keppel hover:bg-keppel/10",
    },
    {
      id: "friends",
      label: "Friends",
      icon: Users,
      gradient: "from-hookers_green to-dark_cyan",
      hoverColor: "hover:text-hookers_green hover:bg-hookers_green/10",
    },
  ];

  const handleNavigation = (itemId) => {
    // Handle create modal
    if (itemId === "create") {
      onCreateClick?.();
      setShowMobileMenu(false);
      return;
    }

    // Navigate using React Router
    if (itemId === "feed") {
      navigate("/app");
    } else {
      navigate(`/app/${itemId}`);
    }
    setShowMobileMenu(false);
  };

  const handleSignOut = async () => {
    try {
      setShowProfileMenu(false);
      await supabase.auth.signOut();
      // Force full page navigation to landing page
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Even if sign out fails, still close menu and navigate
      setShowProfileMenu(false);
      window.location.href = "/";
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation Group */}
          <div className="flex items-center gap-6 flex-1">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--color-dark-cyan)" }}
              >
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1
                className="text-2xl font-bold text-transparent bg-clip-text"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-dark-cyan), var(--color-keppel))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                Moovle
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "text-dark_cyan font-medium"
                        : "text-onyx/70 hover:text-onyx hover:bg-white/60 backdrop-blur-sm"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            {/* Spacer to push right-side buttons */}
            <div className="flex-1" />
            {/* Create Activity Button (desktop, far right, smaller) */}
            <button
              onClick={() => handleNavigation("create")}
              className="hidden lg:inline-flex items-center justify-center w-9 h-9 rounded-full text-white shadow-sm hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-robin_egg_blue/50 cursor-pointer"
              style={{
                backgroundColor: "var(--color-dark-cyan)",
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "var(--color-hookers-green)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "var(--color-dark-cyan)";
              }}
              title="Create Activity"
            >
              <Plus className="w-5 h-5" />
              <span className="sr-only">Create Activity</span>
            </button>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2.5 rounded-xl text-onyx/70 hover:text-dark_cyan hover:bg-dark_cyan/10 transition-all duration-200 cursor-pointer"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            {/* Create Activity Button (mobile, in menu) handled below */}

            {/* Notifications & Messages (Desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <button className="p-2.5 rounded-xl text-onyx/70 hover:text-dark_cyan hover:bg-dark_cyan/10 transition-all duration-200 transform hover:scale-105 active:scale-95 relative group cursor-pointer">
                <Bell className="h-5 w-5" />
                <div className="absolute inset-0 rounded-xl bg-dark_cyan/20 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </button>

              <button className="p-2.5 rounded-xl text-onyx/70 hover:text-keppel hover:bg-keppel/10 transition-all duration-200 transform hover:scale-105 active:scale-95 relative group cursor-pointer">
                <MessageCircle className="h-5 w-5" />
                <div className="absolute inset-0 rounded-xl bg-keppel/20 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* User Greeting (Desktop) */}
            <div className="hidden md:flex items-center text-onyx">
              <span className="text-sm font-medium">
                Hi,{" "}
                {userProfile?.display_name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </span>
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`relative rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer ${
                  showProfileMenu
                    ? "shadow-sm ring-2 ring-purple-200"
                    : "hover:shadow-md"
                }`}
              >
                {/* User Avatar */}
                {userProfile?.avatar_url && !avatarError ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name || "User"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      console.error(
                        "Avatar image failed to load:",
                        e.target.src
                      );
                      setAvatarError(true);
                    }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm border-2 border-white"
                    style={{ backgroundColor: "var(--color-dark-cyan)" }}
                  >
                    <span className="text-white text-sm font-semibold">
                      {getInitials(userProfile?.display_name || user?.email)}
                    </span>
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-white/30 mb-1">
                    <p className="text-sm font-medium text-onyx">Account</p>
                    <p className="text-xs text-onyx/60">Manage your profile</p>
                  </div>

                  <button
                    onClick={() => {
                      navigate("/app/profile");
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-onyx/70 hover:text-dark_cyan hover:bg-dark_cyan/10 transition-all duration-150 flex items-center gap-3 group"
                  >
                    <div className="p-1.5 rounded-lg bg-dark_cyan/20 text-dark_cyan group-hover:bg-dark_cyan/30 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      handleSignOut();
                    }}
                    className="w-full px-4 py-3 text-left text-onyx/70 hover:text-keppel hover:bg-keppel/10 transition-all duration-150 flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-keppel/20 text-keppel group-hover:bg-keppel/30 transition-colors">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
            {children}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {showMobileMenu && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/40 shadow-lg animate-in slide-in-from-top-2 duration-200"
          >
            <nav className="max-w-6xl mx-auto px-4 py-4">
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 text-left ${
                        isActive
                          ? "text-dark_cyan font-medium"
                          : "text-onyx/70 hover:text-onyx hover:bg-white/60"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile-only quick actions */}
              <div className="mt-4 pt-4 border-t border-white/30 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-onyx/70 hover:text-dark_cyan hover:bg-dark_cyan/10 transition-all duration-200 cursor-pointer">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">Notifications</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-onyx/70 hover:text-keppel hover:bg-keppel/10 transition-all duration-200 cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">Messages</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
