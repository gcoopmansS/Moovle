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
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Header({ children, onProfileClick }) {
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
      gradient: "from-blue-500 to-purple-600",
      hoverColor: "hover:text-blue-600 hover:bg-blue-50",
    },
    {
      id: "create",
      label: "Create Activity",
      icon: Plus,
      gradient: "from-green-500 to-emerald-600",
      hoverColor: "hover:text-green-600 hover:bg-green-50",
      isPrimary: true,
    },
    {
      id: "friends",
      label: "Friends",
      icon: Users,
      gradient: "from-orange-500 to-red-500",
      hoverColor: "hover:text-orange-600 hover:bg-orange-50",
    },
  ];

  const handleNavigation = (itemId) => {
    // Navigate using React Router
    if (itemId === "feed") {
      navigate("/app");
    } else {
      navigate(`/app/${itemId}`);
    }
    setShowMobileMenu(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    setShowProfileMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation Group */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? "text-blue-600 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Menu Button & User Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              {showMobileMenu ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            {/* Notifications & Messages (Desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              <button className="p-2.5 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 transform hover:scale-105 active:scale-95 relative group">
                <Bell className="h-5 w-5" />
                <div className="absolute inset-0 rounded-xl bg-blue-100 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </button>

              <button className="p-2.5 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 transform hover:scale-105 active:scale-95 relative group">
                <MessageCircle className="h-5 w-5" />
                <div className="absolute inset-0 rounded-xl bg-green-100 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
              </button>
            </div>

            {/* User Greeting (Desktop) */}
            <div className="hidden md:flex items-center text-gray-700">
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
                className={`relative rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 ${
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
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm border-2 border-white">
                    <span className="text-white text-sm font-semibold">
                      {getInitials(userProfile?.display_name || user?.email)}
                    </span>
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-3 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-medium text-gray-900">Account</p>
                    <p className="text-xs text-gray-500">Manage your profile</p>
                  </div>

                  <button
                    onClick={() => {
                      onProfileClick?.();
                      setShowProfileMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-150 flex items-center gap-3 group"
                  >
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                      <Settings className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium">Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      handleSignOut();
                    }}
                    className="w-full px-4 py-3 text-left text-gray-700 hover:text-red-700 hover:bg-red-50 transition-all duration-150 flex items-center gap-3 group"
                  >
                    <div className="p-1.5 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200 transition-colors">
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
            className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg animate-in slide-in-from-top-2 duration-200"
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
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile-only quick actions */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200">
                  <Bell className="h-4 w-4" />
                  <span className="text-sm">Notifications</span>
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200">
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
