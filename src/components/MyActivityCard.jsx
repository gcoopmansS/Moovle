import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { MapPin, UsersRound } from "lucide-react";
import { useState } from "react";

export default function MyActivityCard({ activity, isNext = false }) {
  const [avatarError, setAvatarError] = useState(false);

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
      className={`relative bg-gradient-to-r rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-lg ${
        isNext
          ? "from-blue-50 via-purple-50 to-indigo-50 border-blue-300 shadow-md ring-2 ring-blue-200/50"
          : "from-emerald-50 via-teal-50 to-cyan-50 border-emerald-300 hover:border-emerald-400"
      }`}
    >
      {/* Distinctive "YOUR ACTIVITY" badge */}
      <div className="absolute -top-2.5 left-4 px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold rounded-full shadow-md uppercase tracking-wide">
        {isNext ? "🚀 Next Activity" : "✨ Your Activity"}
      </div>

      <div className="flex items-center justify-between pt-1">
        {/* Left side - Activity info with more emphasis */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* More prominent sport icon */}
          <div
            className={`p-2.5 rounded-xl shadow-sm border ${
              iconColors[activity.type] || "text-gray-500 bg-gray-50"
            } ${isNext ? "ring-2 ring-blue-200" : "ring-1 ring-emerald-200"}`}
          >
            {icons[activity.type] || icons.running}
          </div>

          {/* Activity details with better typography */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-base truncate">
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

        {/* Right side - Even more prominent participant status */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-sm transition-all ${
            hasParticipants
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-900"
              : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900"
          }`}
        >
          {/* Enhanced participant count */}
          <div className="text-center">
            <div className="flex items-center gap-1.5">
              <div
                className={`p-1.5 rounded-lg ${
                  hasParticipants ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                <UsersRound
                  className={`h-4 w-4 ${
                    hasParticipants ? "text-green-700" : "text-amber-700"
                  }`}
                />
              </div>
              <span className="font-black text-xl leading-none">
                {activity.participant_count || 0}
              </span>
            </div>
            <p className="text-xs font-bold mt-1 uppercase tracking-wide">
              {hasParticipants ? "Joined!" : "Waiting"}
            </p>
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
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">
                          {getInitials(participant.display_name)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

              {/* Enhanced +X more indicator */}
              {activity.participant_count > 2 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center shadow-sm">
                  <span className="text-green-800 text-xs font-black">
                    +{activity.participant_count - 2}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
