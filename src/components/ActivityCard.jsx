import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Calendar, MapPin, Clock2, UsersRound } from "lucide-react";

export default function ActivityCard({
  activity,
  joined,
  busy,
  onJoin,
  onLeave,
}) {
  const icons = {
    running: <LiaRunningSolid className="size-12" />,
    cycling: <LiaBikingSolid className="size-12" />,
    tennis: <IoTennisballOutline className="size-12" />,
    walking: <LiaWalkingSolid className="size-12" />,
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className="flex">
        <div className="px-4">{icons[activity.type]}</div>
        <div className="flex-1">
          <h1 className="font-bold">{activity.title}</h1>
          {/* Creator info */}
          {activity.creator && (
            <div className="flex items-center gap-2 mt-1">
              {activity.creator.avatar_url && (
                <img
                  src={activity.creator.avatar_url}
                  alt={activity.creator.display_name}
                  className="w-6 h-6 rounded-full border border-gray-200 object-cover"
                />
              )}
              <span className="text-sm text-gray-600">
                by{" "}
                <span className="font-medium">
                  {activity.creator.display_name}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
          <Calendar className="size-5" />
          <p>
            {activity.date
              ? `${activity.date} at ${activity.time}`
              : activity.starts_at
              ? new Date(activity.starts_at).toLocaleString()
              : ""}
          </p>
        </div>
        {activity.location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
            <MapPin className="size-5" />
            <p>{activity.location}</p>
          </div>
        )}
        {activity.distance && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
            <Clock2 className="size-5" />
            <p>{activity.distance}</p>
          </div>
        )}
        {activity.description && (
          <div className="flex items-center space-x-2 text-md text-gray-600 my-4">
            <p>{activity.description}</p>
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex text-gray-600 text-sm  space-x-2">
            <UsersRound className="size-5 " />
            <p>
              {activity.participants?.length ?? activity.participant_count ?? 0}
              /{activity.maxParticipants ?? activity.max_participants ?? "-"}{" "}
              joined
            </p>
          </div>
          {joined ? (
            <button
              disabled={busy}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-60"
              onClick={onLeave}
            >
              {busy ? "Leaving…" : "Leave"}
            </button>
          ) : (
            <button
              disabled={busy}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-60"
              onClick={onJoin}
            >
              {busy ? "Joining…" : "Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
