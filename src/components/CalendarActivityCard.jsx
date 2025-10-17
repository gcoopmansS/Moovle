import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import {
  MapPin,
  UsersRound,
  LogOut,
  Trash2,
  User2,
  PencilLine,
} from "lucide-react";
import { useState, useRef } from "react";

const icons = {
  running: <LiaRunningSolid className="w-6 h-6" />,
  cycling: <LiaBikingSolid className="w-6 h-6" />,
  walking: <LiaWalkingSolid className="w-6 h-6" />,
  tennis: <IoTennisballOutline className="w-6 h-6" />,
};
const iconColors = {
  running: "text-white",
  cycling: "text-white",
  walking: "text-white",
  tennis: "text-white",
};
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function CalendarActivityCard({
  activity,
  isNext = false,
  isCreator = true,
  onLeave,
  onCancel,
  onEdit,
  busy = false,
}) {
  const popoverRef = useRef(null);
  const dropdownRef = useRef(null);
  const [avatarErrors, setAvatarErrors] = useState({});
  const [showParticipants, setShowParticipants] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedNewOrganizer, setSelectedNewOrganizer] = useState(null);
  const hasParticipants = activity.participant_count > 0;
  // Dropdown close timer
  const closeTimer = useRef();

  // Handlers for mouse enter/leave
  const handlePopoverMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }
  };
  const handlePopoverMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setShowParticipants(false);
    }, 180); // 180ms delay for smooth UX
  };

  return (
    <div
      className={`relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] border border-white/40 ${
        isNext ? "shadow-md ring-1 ring-dark_cyan/20" : "shadow-minimal"
      }${showParticipants ? " z-50" : ""}${
        isCreator ? " border-l-4 border-hookers_green/60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* ...existing left side info... */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`p-2.5 rounded-xl ${
                iconColors[activity.type] || "text-white"
              }`}
              style={{
                backgroundColor:
                  activity.type === "running"
                    ? "var(--color-dark-cyan)"
                    : activity.type === "cycling"
                    ? "var(--color-hookers-green)"
                    : activity.type === "walking"
                    ? "var(--color-keppel)"
                    : activity.type === "tennis"
                    ? "var(--color-robin-egg-blue)"
                    : "var(--color-dark-cyan)",
              }}
            >
              {icons[activity.type] || icons.running}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-onyx text-base leading-tight">
                  {activity.title}
                </h3>
                <span className="text-xs text-keppel whitespace-nowrap font-medium">
                  {formatDate(activity.starts_at)} •{" "}
                  {formatTime(activity.starts_at)}
                </span>
              </div>
              {!isCreator && (
                <div className="text-xs text-keppel mb-1 flex items-center gap-2">
                  {/* Creator avatar */}
                  {(() => {
                    const creator = activity.creator || {};
                    const avatarUrl =
                      creator.profile?.avatar_url || creator.avatar_url;
                    const displayName =
                      creator.profile?.display_name ||
                      creator.display_name ||
                      "Someone";
                    if (avatarUrl && avatarUrl.trim() !== "") {
                      return (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="w-5 h-5 rounded-full object-cover border border-white/60"
                          style={{ minWidth: 20 }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      );
                    } else {
                      return (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold border border-white/60"
                          style={{
                            minWidth: 20,
                            backgroundColor: "var(--color-dark-cyan)",
                          }}
                        >
                          {getInitials(displayName)}
                        </div>
                      );
                    }
                  })()}
                  <span>
                    Created by {activity.creator?.display_name || "Someone"}
                  </span>
                  {activity.isInvited && (
                    <span
                      className="ml-1 px-1.5 py-0.5 text-white rounded text-xs font-medium"
                      style={{ backgroundColor: "var(--color-keppel)" }}
                    >
                      Invited
                    </span>
                  )}
                </div>
              )}
              {(activity.location ||
                activity.place_name ||
                activity.location_text) && (
                <div className="flex items-center gap-1 text-xs text-keppel">
                  <MapPin className="h-3 w-3 flex-shrink-0 text-dark_cyan" />
                  <span className="truncate font-medium">
                    {activity.location ||
                      activity.place_name ||
                      activity.location_text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Modern participant avatars and count */}
        <div className="flex flex-col items-center min-w-[80px] rounded-xl  pl-4">
          <button
            ref={popoverRef}
            type="button"
            className="flex flex-col items-center bg-white/80 backdrop-blur-sm rounded-xl border border-white/40 shadow-minimal px-3 py-2 transition-all duration-150 hover:shadow-md min-w-[80px] focus:outline-none"
            onClick={() => setShowParticipants((v) => !v)}
            title="Show all participants"
            style={{ minWidth: 0 }}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <div className="flex items-center">
              {hasParticipants && activity.participants && (
                <div className="flex -space-x-2">
                  {activity.participants.slice(0, 3).map((participant, idx) => {
                    const participantKey = participant.id || idx;
                    const avatarUrl =
                      participant.profile?.avatar_url || participant.avatar_url;
                    const displayName =
                      participant.profile?.display_name ||
                      participant.display_name;
                    const hasAvatarError = avatarErrors[participantKey];
                    return (
                      <div key={participantKey} className="relative">
                        {avatarUrl &&
                        avatarUrl.trim() !== "" &&
                        !hasAvatarError ? (
                          <img
                            src={avatarUrl}
                            alt={displayName || "Participant"}
                            className="w-7 h-7 rounded-full border-2 border-white object-cover shadow-sm"
                            onError={() =>
                              setAvatarErrors((prev) => ({
                                ...prev,
                                [participantKey]: true,
                              }))
                            }
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow-sm"
                            style={{
                              backgroundColor: "var(--color-dark-cyan)",
                            }}
                          >
                            <span className="text-white text-xs font-semibold">
                              {getInitials(displayName)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activity.participant_count > 3 && (
                    <div
                      className="w-7 h-7 rounded-full border border-white flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: "var(--color-keppel)" }}
                    >
                      <span className="text-white text-xs font-semibold">
                        +{activity.participant_count - 3}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <span className="ml-2 text-xs font-semibold text-onyx">
                {activity.participant_count || 0}
              </span>
            </div>
            <p className="text-xs font-semibold mt-1 text-keppel uppercase tracking-wide">
              {hasParticipants ? "Joined" : "Waiting"}
            </p>
          </button>
        </div>
      </div>
      {/* Participants Dropdown Popover */}
      {showParticipants && hasParticipants && (
        <div
          className="absolute right-0 mt-2 bg-white/90 backdrop-blur-sm border border-white/40 rounded-xl shadow-lg z-50 min-w-48 max-w-64"
          ref={dropdownRef}
          onMouseEnter={handlePopoverMouseEnter}
          onMouseLeave={handlePopoverMouseLeave}
        >
          <div className="p-3">
            <h4 className="text-sm font-medium text-onyx mb-2">
              Participants ({activity.participant_count})
            </h4>
            {activity.participants && activity.participants.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activity.participants.map((participant, index) => {
                  const avatarUrl =
                    participant.profile?.avatar_url || participant.avatar_url;
                  const displayName =
                    participant.profile?.display_name ||
                    participant.display_name;
                  const hasAvatarError = avatarErrors[participant.id || index];
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {avatarUrl &&
                      avatarUrl.trim() !== "" &&
                      !hasAvatarError ? (
                        <img
                          src={avatarUrl}
                          alt="Profile"
                          className="w-6 h-6 rounded-full object-cover border border-gray-100"
                          onError={() =>
                            setAvatarErrors((prev) => ({
                              ...prev,
                              [participant.id || index]: true,
                            }))
                          }
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {getInitials(displayName)}
                          </span>
                        </div>
                      )}
                      <span className="text-gray-700 truncate">
                        {displayName || "Unknown User"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                No participant details available
              </p>
            )}
          </div>
        </div>
      )}

      {/* Leave button for joined activities */}
      {!isCreator && onLeave && (
        <div className="mt-3 pt-3 border-t border-white/30 flex justify-start">
          <button
            type="button"
            disabled={busy}
            onClick={() => onLeave(activity.id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/40 text-keppel bg-white/80 backdrop-blur-sm hover:bg-keppel/10 font-medium text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-minimal hover:scale-105"
            title="Leave activity"
          >
            <LogOut className="w-5 h-5" />
            <span>Leave</span>
          </button>
        </div>
      )}

      {/* Organizer actions: cancel/transfer */}
      {isCreator && (
        <div className="mt-3 pt-3 border-t border-white/30 flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-full border border-white/40 text-dark_cyan bg-white/80 backdrop-blur-sm hover:bg-dark_cyan/10 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-minimal hover:scale-105"
              onClick={() => onEdit && onEdit(activity.id)}
              disabled={busy}
              title="Edit activity"
            >
              <PencilLine className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-full border border-white/40 text-keppel bg-white/80 backdrop-blur-sm hover:bg-keppel/10 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-minimal hover:scale-105"
              onClick={() =>
                onCancel && onCancel(activity.id, { mode: "cancel" })
              }
              disabled={busy}
              title="Cancel for everyone"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-full border border-white/40 text-hookers_green bg-white/80 backdrop-blur-sm hover:bg-hookers_green/10 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-minimal hover:scale-105"
              onClick={() => setShowTransfer((v) => !v)}
              disabled={
                busy ||
                !activity.participants ||
                activity.participants.length < 2
              }
              title="Transfer organizer"
            >
              <User2 className="w-5 h-5" />
            </button>
          </div>
          {showTransfer &&
            activity.participants &&
            activity.participants.length > 1 && (
              <div className="mt-2 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-white/40 shadow-minimal">
                <div className="mb-2 text-sm font-medium text-onyx">
                  Select new organizer:
                </div>
                <div className="space-y-2">
                  {activity.participants
                    .filter((p) => p.user_id !== activity.creator_id)
                    .map((p) => (
                      <label
                        key={p.user_id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`newOrganizer-${activity.id}`}
                          value={p.user_id}
                          checked={selectedNewOrganizer === p.user_id}
                          onChange={() => setSelectedNewOrganizer(p.user_id)}
                          disabled={busy}
                          className="accent-dark_cyan"
                        />
                        <span className="text-onyx text-sm">
                          {p.profile?.display_name ||
                            p.display_name ||
                            "Unknown"}
                        </span>
                      </label>
                    ))}
                </div>
                <button
                  className="mt-3 w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-xl border border-white/40 text-dark_cyan bg-white/80 backdrop-blur-sm hover:bg-dark_cyan/10 font-medium text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-minimal hover:scale-105"
                  onClick={() =>
                    onCancel &&
                    onCancel(activity.id, {
                      mode: "transfer",
                      newOrganizer: selectedNewOrganizer,
                    })
                  }
                  disabled={!selectedNewOrganizer || busy}
                >
                  Confirm transfer
                </button>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
// ...existing code up to the end of the main CalendarActivityCard component...
