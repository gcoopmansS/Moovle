import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import {
  Calendar,
  MapPin,
  Clock2,
  UsersRound,
  User,
  X,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import FriendInviteModal from "./FriendInviteModal";

export default function FeedActivityCard({
  activity,
  joined,
  busy,
  onJoin,
  onLeave,
  isOwnActivity = false,
  variant = "default",
  ...rest
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowParticipants(false);
      }
    }
    if (showParticipants) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showParticipants]);

  const handleInvitesSent = (invitedFriendIds) => {
    console.log(
      `Invited ${invitedFriendIds.length} friends to activity ${activity.id}`
    );
  };

  const icons = {
    running: <LiaRunningSolid className="size-8" />,
    cycling: <LiaBikingSolid className="size-8" />,
    tennis: <IoTennisballOutline className="size-8" />,
    walking: <LiaWalkingSolid className="size-8" />,
  };

  const iconColors = {
    running: "sport-running",
    cycling: "sport-cycling",
    tennis: "sport-tennis",
    walking: "sport-badminton",
    swimming: "sport-swimming",
    soccer: "sport-soccer",
    basketball: "sport-basketball",
    volleyball: "sport-volleyball",
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (variant === "calendar") {
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };
    const formatTime = (dateStr) =>
      new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    return (
      <div
        className={`relative bg-white rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
          isOwnActivity
            ? "shadow-sm border-l-4 border-l-purple-500 border border-gray-100"
            : "shadow-sm border border-gray-200"
        } ${showParticipants ? "z-50" : ""}`}
        {...rest}
      >
        <div className="flex items-center justify-between pt-1">
          {/* Left: Sport icon and info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`p-2.5 rounded-xl ${
                iconColors[activity.type] || "text-gray-500 bg-gray-50"
              }`}
            >
              {icons[activity.type] || icons.running}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {activity.title}
                </h3>
                <span className="text-xs text-gray-600 whitespace-nowrap font-medium">
                  {formatDate(activity.starts_at)} •{" "}
                  {formatTime(activity.starts_at)}
                </span>
              </div>
              {(activity.location ||
                activity.place_name ||
                activity.location_text) && (
                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-emerald-600" />
                  <span className="truncate font-medium">
                    {activity.location ||
                      activity.place_name ||
                      activity.location_text}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* ...rest of calendar variant code for participants, avatars, leave button... */}
        </div>
        {/* ...rest of calendar variant code... */}
      </div>
    );
  }

  // ...existing default/feed variant code...

  return (
    <div className="bg-white/60 backdrop-blur-sm border-0 rounded-3xl p-6 transition-all duration-500 hover:bg-white/80 hover:backdrop-blur-md hover:translate-y-[-2px] animate-slide-up group">
      {/* Minimalist Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Simplified Sport Icon - smaller, more subtle */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              iconColors[activity.type] || "bg-gray-100 text-gray-400"
            }`}
          >
            <div className="w-4 h-4">
              {icons[activity.type] || <User className="w-4 h-4" />}
            </div>
          </div>

          {/* Clean Activity Title */}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 leading-tight mb-1">
              {activity.title}
            </h3>

            {/* Subtle Creator Info */}
            <p className="text-sm text-gray-500 font-normal">
              by {activity.creator?.display_name || "Someone"}
            </p>
          </div>
        </div>

        {/* Status Badge - Cleaner */}
        {activity.isInvited && (
          <div className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full border border-blue-100">
            Invited
          </div>
        )}
        {joined && (
          <div className="px-2 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full border border-green-100">
            Joined
          </div>
        )}
      </div>

      {/* Minimalist Activity Details */}
      <div className="space-y-3 mb-6">
        {/* Date & Time - Clean single line */}
        <div className="flex items-center gap-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">
            {activity.date
              ? `${activity.date} at ${activity.time}`
              : activity.starts_at
              ? new Date(activity.starts_at).toLocaleString()
              : "Time TBD"}
          </span>
        </div>

        {/* Location - Simple */}
        {activity.location_text && (
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{activity.location_text}</span>
          </div>
        )}

        {/* Distance/Duration - Clean */}
        {activity.distance && (
          <div className="flex items-center gap-2 text-gray-600">
            <Clock2 className="w-4 h-4" />
            <span className="text-sm">{activity.distance}</span>
          </div>
        )}
      </div>

      {/* Description - Subtle */}
      {activity.description && (
        <div className="mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            {activity.description}
          </p>
        </div>
      )}

      {/* Minimalist Footer */}
      <div className="flex items-center justify-between pt-2">
        {/* Simple Participants Count */}
        <div className="flex items-center gap-2 text-gray-500">
          <UsersRound className="w-4 h-4" />
          <span className="text-sm">
            {activity.participants?.length ?? activity.participant_count ?? 0}
            {activity.maxParticipants ?? activity.max_participants
              ? `/${activity.maxParticipants ?? activity.max_participants}`
              : ""}
          </span>
        </div>

        {/* Clean Action Button */}
        {isOwnActivity ? (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
          >
            Invite
          </button>
        ) : (
          <>
            {joined ? (
              <button
                disabled={busy}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-colors disabled:opacity-60"
                onClick={onLeave}
              >
                {busy ? "Leaving..." : "Leave"}
              </button>
            ) : (
              <button
                disabled={busy}
                className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors disabled:opacity-60"
                onClick={onJoin}
              >
                {busy ? "Joining..." : "Join"}
              </button>
            )}
          </>
        )}
      </div>

      {/* Friend Invite Modal */}
      <FriendInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        activity={activity}
        onInvitesSent={handleInvitesSent}
      />
    </div>
  );
}
