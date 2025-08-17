import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Calendar, MapPin, Clock2, UsersRound, User, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function ActivityCard({
  activity,
  joined,
  busy,
  onJoin,
  onLeave,
  isOwnActivity = false, // New prop to indicate if this is user's own activity
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
    running: <LiaRunningSolid className="size-8" />,
    cycling: <LiaBikingSolid className="size-8" />,
    tennis: <IoTennisballOutline className="size-8" />,
    walking: <LiaWalkingSolid className="size-8" />,
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

  return (
    <div className="bg-white shadow-lg hover:shadow-xl rounded-2xl p-6 border border-gray-100 transition-all duration-300 hover:scale-[1.02]">
      {/* Header with sport icon and creator info */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Sport Icon */}
          <div
            className={`p-3 rounded-xl ${
              iconColors[activity.type] || "text-gray-500 bg-gray-50"
            }`}
          >
            {icons[activity.type] || <User className="size-8" />}
          </div>

          {/* Activity Title and Creator */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activity.title}
            </h2>

            {/* Creator Profile */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                {activity.creator?.avatar_url && !avatarError ? (
                  <img
                    src={activity.creator.avatar_url}
                    alt={activity.creator.display_name}
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-semibold">
                      {getInitials(activity.creator?.display_name)}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>

              {/* Creator Name */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {activity.creator?.display_name || "Unknown User"}
                </span>
                <span className="text-xs text-gray-500">Activity Creator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Join Status Badge */}
        {joined && (
          <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
            Joined ✓
          </div>
        )}
      </div>

      {/* Activity Details */}
      <div className="space-y-3 mb-6">
        {/* Date & Time */}
        <div className="flex items-center gap-3 text-gray-600">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Calendar className="size-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium">
            {activity.date
              ? `${activity.date} at ${activity.time}`
              : activity.starts_at
              ? new Date(activity.starts_at).toLocaleString()
              : "Time TBD"}
          </span>
        </div>

        {/* Location */}
        {activity.location_text && (
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 bg-red-50 rounded-lg">
              <MapPin className="size-4 text-red-600" />
            </div>
            <span className="text-sm font-medium">
              {activity.location_text}
            </span>
          </div>
        )}

        {/* Distance/Duration */}
        {activity.distance && (
          <div className="flex items-center gap-3 text-gray-600">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Clock2 className="size-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium">{activity.distance}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {activity.description && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-gray-700 text-sm leading-relaxed">
            {activity.description}
          </p>
        </div>
      )}

      {/* Footer with participants and action button */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {/* Participants */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <div className="p-2 bg-gray-50 rounded-lg">
              <UsersRound className="size-4 text-gray-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                {activity.participants?.length ??
                  activity.participant_count ??
                  0}
                /{activity.maxParticipants ?? activity.max_participants ?? "∞"}
              </span>
              <span className="text-xs text-gray-500">participants</span>
            </div>
          </div>

          {/* Participants Dropdown */}
          {showParticipants &&
            (activity.participants?.length ?? activity.participant_count ?? 0) >
              0 && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg z-10 min-w-64 max-w-80">
                <div className="p-3">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Participants (
                    {activity.participants?.length ??
                      activity.participant_count ??
                      0}
                    )
                  </h4>
                  {activity.participants && activity.participants.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {activity.participants.map((participant, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 text-sm"
                        >
                          {participant.avatar_url ? (
                            <img
                              src={participant.avatar_url}
                              alt={participant.display_name || "Participant"}
                              className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
                              onError={(e) => {
                                // Fallback to colored circle if image fails to load
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
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
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-900 font-medium truncate">
                              {participant.display_name || "Unknown User"}
                            </p>
                            {participant.email && (
                              <p className="text-xs text-gray-500 truncate">
                                {participant.email}
                              </p>
                            )}
                          </div>
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

        {/* Action Button or Participant Management */}
        {isOwnActivity ? (
          // For own activities: Show participant info
          <div className="text-right">
            <span className="text-sm text-gray-600">
              {(activity.participants?.length ??
                activity.participant_count ??
                0) > 0
                ? `${
                    activity.participants?.length ??
                    activity.participant_count ??
                    0
                  } joined`
                : "No participants yet"}
            </span>
          </div>
        ) : (
          // For others' activities: Show join/leave buttons
          <>
            {joined ? (
              <button
                disabled={busy}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none"
                onClick={onLeave}
              >
                {busy ? "Leaving..." : "Leave"}
              </button>
            ) : (
              <button
                disabled={busy}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none shadow-lg hover:shadow-xl"
                onClick={onJoin}
              >
                {busy ? "Joining..." : "Join Activity"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
