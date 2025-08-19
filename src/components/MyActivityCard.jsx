import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { MapPin, UsersRound } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function MyActivityCard({
  activity,
  isNext = false,
  isCreator = true,
  onLeave,
  busy = false,
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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

  const icons = {
    running: <LiaRunningSolid className="size-5" />,
    cycling: <LiaBikingSolid className="size-5" />,
    tennis: <IoTennisballOutline className="size-5" />,
    walking: <LiaWalkingSolid className="size-5" />,
  };

  const iconColors = {
    running: "text-red-500 bg-red-50",
    cycling: "text-blue-500 bg-blue-50",
    tennis: "text-green-500 bg-green-50",
    walking: "text-purple-500 bg-purple-50",
  };

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

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const hasParticipants = activity.participant_count > 0;

  return (
    <div
      className={`relative bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
        isNext ? "shadow-md ring-1 ring-blue-100/50" : "shadow-sm"
      }`}
    >
      {/* Activity relationship badge */}
      <div
        className={`absolute -top-2.5 left-4 px-3 py-1 text-white text-xs font-semibold rounded-full shadow-sm uppercase tracking-wide ${
          isNext
            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
            : isCreator
            ? "bg-gradient-to-r from-purple-600 to-purple-700"
            : "bg-gradient-to-r from-green-600 to-green-700"
        }`}
      >
        {isNext ? "🚀 Next Activity" : isCreator ? "👑 Created" : "🎯 Joined"}
      </div>

      <div className="flex items-center justify-between pt-1">
        {/* Left side - Activity info with more emphasis */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Sport icon - consistent with ActivityCard */}
          <div
            className={`p-2.5 rounded-xl ${
              iconColors[activity.type] || "text-gray-500 bg-gray-50"
            }`}
          >
            {icons[activity.type] || icons.running}
          </div>

          {/* Activity details with better typography */}
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
            {!isCreator && (
              <div className="text-xs text-gray-500 mb-1">
                Created by {activity.creator?.display_name || "Someone"}
                {activity.isInvited && (
                  <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    Invited
                  </span>
                )}
              </div>
            )}
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

        {/* Participant status - clickable to view details */}
        <div
          className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 transition-all cursor-pointer hover:bg-gray-100"
          onClick={() => hasParticipants && setShowParticipants(true)}
        >
          {/* Participant count */}
          <div className="text-center relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-1.5 cursor-pointer p-2 rounded-lg transition-colors"
              onClick={() => setShowParticipants(!showParticipants)}
            >
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <UsersRound className="h-4 w-4 text-gray-600" />
              </div>
              <span className="font-bold text-lg leading-none text-gray-900">
                {activity.participant_count || 0}
              </span>
            </div>
            <p className="text-xs font-semibold mt-1 text-gray-500 uppercase tracking-wide">
              {hasParticipants ? "Joined" : "Waiting"}
            </p>

            {/* Participants Dropdown */}
            {showParticipants && hasParticipants && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-48 max-w-64">
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Participants ({activity.participant_count})
                  </h4>
                  {activity.participants && activity.participants.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {activity.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt={participant.display_name || "Participant"}
                              className="w-6 h-6 rounded-full object-cover border border-gray-100"
                              onError={(e) => {
                                // Fallback to colored circle if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                            style={{
                              display: participant.avatar_url ? "none" : "flex",
                            }}
                          >
                            <span className="text-white font-semibold text-xs">
                              {participant.display_name
                                ? participant.display_name
                                    .charAt(0)
                                    .toUpperCase()
                                : "U"}
                            </span>
                          </div>
                          <span className="text-gray-700 truncate">
                            {participant.display_name || "Unknown User"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No participant details available
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced participant avatars */}
          {hasParticipants && (
            <div className="flex -space-x-2">
              {activity.participants &&
                activity.participants.slice(0, 2).map((participant, index) => (
                  <div key={participant.id || index} className="relative">
                    {participant.avatar_url && !avatarError ? (
                      <img
                        src={participant.avatar_url}
                        alt={participant.display_name || "Participant"}
                        className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-semibold">
                          {getInitials(participant.display_name)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

              {/* +X more indicator - consistent styling */}
              {activity.participant_count > 2 && (
                <div className="w-7 h-7 rounded-full border border-white bg-gray-100 flex items-center justify-center shadow-sm">
                  <span className="text-gray-600 text-xs font-semibold">
                    +{activity.participant_count - 2}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Leave button for joined activities */}
      {!isCreator && onLeave && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            disabled={busy}
            onClick={() => onLeave(activity.id)}
            className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none text-sm"
          >
            {busy ? "Leaving..." : "Leave Activity"}
          </button>
        </div>
      )}
    </div>
  );
}
