import {
  Bell,
  MessageCircle,
  UserCircleIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Header({ children, onProfileClick, onSignOut, user }) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const menuRef = useRef(null);

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

  // Reset avatar error when user changes
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar_url]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Moovle
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2.5 rounded-xl text-gray-600 hover:text-green-600 hover:bg-green-50 transition-all duration-200 transform hover:scale-105 active:scale-95 relative group">
            <MessageCircle className="h-5 w-5" />
            <div className="absolute inset-0 rounded-xl bg-green-100 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
          </button>

          {/* User Greeting */}
          <div className="hidden sm:flex items-center text-gray-700">
            <span className="text-sm font-medium">
              Hi, {user?.display_name || user?.email?.split("@")[0] || "User"}
            </span>
          </div>

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
              {user?.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name || "User"}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-sm border-2 border-white">
                  <span className="text-white text-sm font-semibold">
                    {getInitials(user?.display_name || user?.email)}
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
                    onSignOut?.();
                    setShowProfileMenu(false);
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
    </header>
  );
}
