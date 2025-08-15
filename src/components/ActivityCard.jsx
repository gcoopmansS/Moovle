import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Calendar, MapPin, Clock2, UsersRound } from "lucide-react";

export default function ActivityCard({ activity }) {
  const icons = {
    running: <LiaRunningSolid className="size-12" />,
    cycling: <LiaBikingSolid className="size-12" />,
    tennis: <IoTennisballOutline className="size-12" />,
    walking: <LiaWalkingSolid className="size-12" />,
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <div className=" flex">
        <div className="px-4">{icons[activity.type]}</div>
        <div>
          <h1 className="font-bold">{activity.title}</h1>
          <p>by {activity.creator.name}</p>
        </div>
      </div>
      <div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
          <Calendar className="size-5" />
          <p>
            {activity.date} at {activity.time}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
          <MapPin className="size-5" />
          <p>{activity.location}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
          <Clock2 className="size-5" />
          <p>{activity.distance}</p>
        </div>
        <div className="flex items-center space-x-2 text-md text-gray-600 my-4">
          <p>{activity.description}</p>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex text-gray-600 text-sm  space-x-2">
            <UsersRound className="size-5 " />
            <p>
              {activity.participants.length}/{activity.maxParticipants} joined
            </p>
          </div>
          <button className=" bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
