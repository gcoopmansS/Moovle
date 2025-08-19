import { useState } from "react";
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Users, Check } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { ActivityService } from "../services";
import LocationInput from "./LocationInput";
import FriendInviteModal from "./FriendInviteModal";
// import ActivityTemplates from "./ActivityTemplates";

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

export default function ActivityForm() {
  const { user } = useSupabaseAuth();

  const [selectedType, setSelectedType] = useState("running");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState({
    place_name: "",
    lat: undefined,
    lng: undefined,
  });
  const [distance, setDistance] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(2);
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("all-friends"); // Updated default
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdActivity, setCreatedActivity] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInvitesSent = (invitedFriendIds) => {
    // Could show a success message or update UI
    console.log(`Invited ${invitedFriendIds.length} friends to activity`);
  };

  const handleSkipInvites = () => {
    setShowInviteModal(false);
    setCreatedActivity(null);
    // Could navigate to activity feed or show success message
  };

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  // const handleTemplateSelect = (template) => {
  //   setSelectedType(template.type);
  //   setTitle(template.title);
  //   setDescription(template.description);
  //   setDistance(template.distance);
  //   setMaxParticipants(template.maxParticipants);
  //   setTime(template.defaultTime);
  //
  //   // Set date to tomorrow by default
  //   const tomorrow = new Date();
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   setDate(tomorrow.toISOString().split('T')[0]);
  // };

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (
      !title ||
      !date ||
      !time ||
      !location.place_name ||
      location.lat == null ||
      location.lng == null ||
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

    const startsAtIso = new Date(`${date}T${time}:00`).toISOString();

    setSaving(true);
    try {
      // Map visibility options to database values
      let dbVisibility = visibility;
      if (visibility === "all-friends") {
        dbVisibility = "friends";
      } else if (visibility === "specific-friends") {
        dbVisibility = "private"; // Will be made visible via invitations
      }

      const result = await ActivityService.createActivity({
        userId: user.id,
        title,
        description,
        starts_at: startsAtIso,
        location_text: location.place_name, // optional legacy field for feed text
        place_name: location.place_name,
        lat: location.lat,
        lng: location.lng,
        visibility: dbVisibility,
        type: selectedType,
        distance,
        max_participants: maxParticipants,
      });

      // Store the created activity for inviting friends
      const activity = {
        id: result.data?.id || result.id,
        title,
        description,
        starts_at: startsAtIso,
        type: selectedType,
        distance,
        max_participants: maxParticipants,
        place_name: location.place_name,
      };
      setCreatedActivity(activity);

      // Clear form
      setTitle("");
      setDescription("");
      setLocation({ place_name: "", lat: undefined, lng: undefined });
      setDate("");
      setTime("");
      setDistance("");
      setMaxParticipants(2);
      setSelectedType("running");
      setVisibility("all-friends");

      // Show invite modal only for specific friends option
      if (visibility === "specific-friends") {
        setShowInviteModal(true);
      } else {
        // For all-friends and public, show success message
        setShowSuccessMessage(true);
        setCreatedActivity(null);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error) {
      console.error("Failed to create activity:", error);
      setErrorMsg(error.message || "Failed to create activity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Create a New Activity
      </h2>

      {/* Activity Templates - Commented out for now */}
      {/* <ActivityTemplates onTemplateSelect={handleTemplateSelect} /> */}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Title */}
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

        {/* Type */}
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

        {/* Date & Time */}
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

        {/* Location */}
        <LocationInput value={location} onChange={setLocation} required />

        {/* Distance & Max */}
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

        {/* Description */}
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

        {/* Visibility Options */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Who can join this activity? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                value="all-friends"
                checked={visibility === "all-friends"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">All Friends</div>
                <div className="text-sm text-gray-600">
                  All your friends can see and join this activity
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                value="specific-friends"
                checked={visibility === "specific-friends"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Specific Friends
                </div>
                <div className="text-sm text-gray-600">
                  Choose which friends to invite (you'll select them after
                  creating)
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === "public"}
                onChange={(e) => setVisibility(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600"
              />
              <div>
                <div className="font-medium text-gray-900">Public</div>
                <div className="text-sm text-gray-600">
                  Anyone in your area can see and join this activity
                </div>
              </div>
            </label>
          </div>
        </div>

        {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-900">
                Activity Created Successfully!
              </p>
              <p className="text-sm text-green-700">
                {visibility === "all-friends"
                  ? "Your friends will see this activity in their feed"
                  : "Everyone can now discover and join your activity"}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          {saving
            ? "Creating…"
            : visibility === "specific-friends"
            ? "Create Activity & Choose Friends"
            : "Create Activity"}
        </button>
      </form>

      {/* Friend Invite Modal */}
      <FriendInviteModal
        isOpen={showInviteModal}
        onClose={handleSkipInvites}
        activity={createdActivity}
        onInvitesSent={handleInvitesSent}
      />
    </div>
  );
}
