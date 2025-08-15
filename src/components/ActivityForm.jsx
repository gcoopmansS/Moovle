import { useState } from "react";
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";

const activityTypes = [
  {
    value: "running",
    label: "Running",
    icon: <LiaRunningSolid className="size-7" />,
  },
  {
    value: "cycling",
    label: "Cycling",
    icon: <LiaBikingSolid className="size-7" />,
  },
  {
    value: "tennis",
    label: "Tennis",
    icon: <IoTennisballOutline className="size-7" />,
  },
  {
    value: "walking",
    label: "Walking",
    icon: <LiaWalkingSolid className="size-7" />,
  },
];

export default function ActivityForm({ onAddActivity }) {
  const [selectedType, setSelectedType] = useState("running");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [description, setDescription] = useState("");
  const [touched, setTouched] = useState({});

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (
      !title ||
      !date ||
      !time ||
      !location ||
      !maxParticipants ||
      maxParticipants < 2
    ) {
      setTouched({
        title: true,
        date: true,
        time: true,
        location: true,
        maxParticipants: true,
      });
      return;
    }
    if (onAddActivity) {
      onAddActivity({
        title,
        type: selectedType,
        date,
        time,
        location,
        distance,
        maxParticipants,
        description,
      });
    }
    // Optionally reset form fields here
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setDistance("");
    setMaxParticipants(2);
    setDescription("");
    setSelectedType("running");
    setTouched({});
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4 text-center">
        Create a New Activity
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="e.g. Morning Run in Central Park"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => handleBlur("title")}
            required
          />
          {touched.title && !title && (
            <span className="text-xs text-red-500">Title is required</span>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 mt-2">
            {activityTypes.map((type) => (
              <button
                type="button"
                key={type.value}
                className={`w-20 flex flex-col items-center px-3 py-2 rounded-xl border transition-colors focus:outline-none ${
                  selectedType === type.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedType(type.value)}
                aria-pressed={selectedType === type.value}
              >
                {type.icon}
                <span className="text-xs mt-1">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="date">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="date"
              type="date"
              className="w-full p-2 border border-gray-300 rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => handleBlur("date")}
              required
            />
            {touched.date && !date && (
              <span className="text-xs text-red-500">Date is required</span>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1" htmlFor="time">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              id="time"
              type="time"
              className="w-full p-2 border border-gray-300 rounded"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => handleBlur("time")}
              required
            />
            {touched.time && !time && (
              <span className="text-xs text-red-500">Time is required</span>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="location">
            Location <span className="text-red-500">*</span>
          </label>
          <input
            id="location"
            type="text"
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="e.g. Central Park, NY"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onBlur={() => handleBlur("location")}
            required
          />
          {touched.location && !location && (
            <span className="text-xs text-red-500">Location is required</span>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="distance"
            >
              Distance / Duration
            </label>
            <input
              id="distance"
              type="text"
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="e.g. 5km, 1 hour"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="maxParticipants"
            >
              Max Participants <span className="text-red-500">*</span>
            </label>
            <input
              id="maxParticipants"
              type="number"
              min={2}
              max={20}
              className="w-full p-2 border border-gray-300 rounded"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              onBlur={() => handleBlur("maxParticipants")}
              required
            />
            {touched.maxParticipants &&
              (!maxParticipants || maxParticipants < 2) && (
                <span className="text-xs text-red-500">
                  At least 2 participants
                </span>
              )}
          </div>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            className="w-full p-2 border border-gray-300 rounded min-h-[60px]"
            placeholder="Describe your activity, pace, level, etc."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-lg font-semibold mt-4"
        >
          Find SportBuddies
        </button>
      </form>
    </div>
  );
}
