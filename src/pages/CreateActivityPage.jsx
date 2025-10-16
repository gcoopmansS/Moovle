import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Users, Check } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { ActivityService } from "../services";
import LocationInput from "../components/LocationInput";
import FriendInviteModal from "../components/FriendInviteModal";
// import ActivityTemplates from "../components/ActivityTemplates";

const activityTypes = [
  {
    value: "running",
    label: "Running",
    icon: <LiaRunningSolid className="size-7" />,
    fields: {
      distance: {
        label: "Distance",
        type: "distance",
        units: ["m", "km", "mi"],
        defaultUnit: "km",
        placeholder: "5",
      },
      pace: {
        label: "Pace (optional)",
        placeholder: "e.g. 5:30/km, easy pace",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 3,
      defaultTime: "08:00",
    },
  },
  {
    value: "cycling",
    label: "Cycling",
    icon: <LiaBikingSolid className="size-7" />,
    fields: {
      distance: {
        label: "Distance",
        type: "distance",
        units: ["km", "mi"],
        defaultUnit: "km",
        placeholder: "20",
      },
      difficulty: {
        label: "Difficulty",
        placeholder: "e.g. Easy, Moderate, Challenging",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 5,
      defaultTime: "09:00",
    },
  },
  {
    value: "tennis",
    label: "Tennis",
    icon: <IoTennisballOutline className="size-7" />,
    fields: {
      duration: {
        label: "Duration",
        placeholder: "e.g. 1 hour, 90 minutes",
        type: "text",
      },
      level: {
        label: "Skill Level",
        placeholder: "e.g. Beginner, Intermediate, Advanced",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 1,
      defaultTime: "10:00",
    },
  },
  {
    value: "walking",
    label: "Walking",
    icon: <LiaWalkingSolid className="size-7" />,
    fields: {
      distance: {
        label: "Distance",
        type: "distance",
        units: ["m", "km", "mi"],
        defaultUnit: "km",
        placeholder: "3",
      },
      pace: {
        label: "Pace",
        placeholder: "e.g. Leisurely, Brisk",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 3,
      defaultTime: "18:00",
    },
  },
];

export default function CreateActivityPage() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState("running");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState({
    place_name: "",
    lat: undefined,
    lng: undefined,
  });
  const [dynamicFields, setDynamicFields] = useState({});
  const [distanceUnits, setDistanceUnits] = useState({}); // Track units for distance fields
  const [maxParticipants, setMaxParticipants] = useState(3); // Default for running
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("all-friends"); // Updated default

  // Get current activity type configuration
  const currentActivityType = activityTypes.find(
    (type) => type.value === selectedType
  );

  // Update dynamic fields and defaults when activity type changes
  const handleActivityTypeChange = (newType) => {
    setSelectedType(newType);
    const activityConfig = activityTypes.find((type) => type.value === newType);

    // Reset dynamic fields and units
    setDynamicFields({});

    // Initialize distance units with defaults for the new activity type
    const initialUnits = {};
    if (activityConfig?.fields) {
      Object.entries(activityConfig.fields).forEach(
        ([fieldKey, fieldConfig]) => {
          if (fieldConfig.type === "distance" && fieldConfig.defaultUnit) {
            initialUnits[fieldKey] = fieldConfig.defaultUnit;
          }
        }
      );
    }
    setDistanceUnits(initialUnits);

    // Update max participants default
    if (activityConfig?.defaults?.maxParticipants) {
      setMaxParticipants(activityConfig.defaults.maxParticipants);
    }

    // Set default time if not already set
    if (!time && activityConfig?.defaults?.defaultTime) {
      setTime(activityConfig.defaults.defaultTime);
    }
  };

  // Helper to update dynamic field values
  const updateDynamicField = (fieldKey, value) => {
    setDynamicFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Helper to update distance units
  const updateDistanceUnit = (fieldKey, unit) => {
    setDistanceUnits((prev) => ({
      ...prev,
      [fieldKey]: unit,
    }));
  };
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdActivity, setCreatedActivity] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleInvitesSent = (invitedFriendIds) => {
    // Show success message and redirect to activity feed
    console.log(`Invited ${invitedFriendIds.length} friends to activity`);
    setShowInviteModal(false);
    setCreatedActivity(null);

    // Immediate smooth redirect
    navigate("/app", {
      replace: true,
      state: {
        fromCreation: true,
        message: `Activity created and ${invitedFriendIds.length} friends invited!`,
      },
    });
  };

  const handleSkipInvites = () => {
    setShowInviteModal(false);
    setCreatedActivity(null);

    // Immediate smooth redirect
    navigate("/app", {
      replace: true,
      state: {
        fromCreation: true,
        message: "Activity created successfully!",
      },
    });
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
      maxParticipants < 1
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

      // Prepare activity data with properly formatted distance values
      const processedActivityData = { ...dynamicFields };
      let formattedDistance = "";

      // Combine distance values with their units
      if (currentActivityType?.fields) {
        Object.entries(currentActivityType.fields).forEach(
          ([fieldKey, fieldConfig]) => {
            if (
              fieldConfig.type === "distance" &&
              dynamicFields[fieldKey] &&
              distanceUnits[fieldKey]
            ) {
              const distanceValue = dynamicFields[fieldKey];
              const unit = distanceUnits[fieldKey];
              processedActivityData[fieldKey] = `${distanceValue}${unit}`;

              // Use the first distance field as the main distance for backward compatibility
              if (!formattedDistance) {
                formattedDistance = `${distanceValue}${unit}`;
              }
            }
          }
        );
      }

      // Fallback to duration if no distance field
      if (!formattedDistance && dynamicFields.duration) {
        formattedDistance = dynamicFields.duration;
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
        // Include formatted distance for backward compatibility
        distance: formattedDistance,
        max_participants: maxParticipants,
        // Store all dynamic fields with formatted distances as JSON
        activity_data: JSON.stringify(processedActivityData),
      });

      // Store the created activity for inviting friends
      const activity = {
        id: result.data?.id || result.id,
        title,
        description,
        starts_at: startsAtIso,
        type: selectedType,
        distance: formattedDistance,
        max_participants: maxParticipants,
        place_name: location.place_name,
        activity_data: processedActivityData,
      };
      setCreatedActivity(activity);

      // Clear form
      setTitle("");
      setDescription("");
      setLocation({ place_name: "", lat: undefined, lng: undefined });
      setDate("");
      setTime("");
      setDynamicFields({});
      setDistanceUnits({ distance: "km" }); // Reset to default units
      setMaxParticipants(3); // Default for running
      setSelectedType("running");
      setVisibility("all-friends");

      // Show invite modal only for specific friends option
      if (visibility === "specific-friends") {
        setShowInviteModal(true);
      } else {
        // For all-friends and public, show success message and redirect smoothly
        setShowSuccessMessage(true);
        setCreatedActivity(null);

        // Immediate smooth redirect without waiting
        setTimeout(() => {
          setShowSuccessMessage(false);
          // Use immediate navigation with state to preserve smoothness
          navigate("/app", {
            replace: true,
            state: {
              fromCreation: true,
              newActivity: activity,
              message: "Activity created successfully!",
            },
          });
        }, 800); // Reduced from 2000ms to 800ms for faster feel
      }
    } catch (error) {
      console.error("Failed to create activity:", error);
      setErrorMsg(error.message || "Failed to create activity");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-light text-gray-900 mb-3">
            New Activity
          </h1>
          <p className="text-gray-500">Create something fun for your friends</p>
        </div>

        {/* Main Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="space-y-1">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="title"
            >
              What are you organizing?
            </label>
            <input
              id="title"
              type="text"
              className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 ${
                touched.title && !title
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              } focus:outline-none`}
              placeholder="e.g., Morning jog around the park"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur("title")}
              required
            />
            {touched.title && !title && (
              <p className="text-sm text-red-500 mt-1">Please add a title</p>
            )}
          </div>

          {/* Activity Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              What type of activity?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={`group relative flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-200 ${
                    selectedType === type.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleActivityTypeChange(type.value)}
                >
                  {selectedType === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`text-xl transition-all duration-200 ${
                      selectedType === type.value
                        ? "scale-110"
                        : "group-hover:scale-105"
                    }`}
                  >
                    {type.icon}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        selectedType === type.value
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      Up to {type.defaults.maxParticipants + 1} people
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              When is it happening?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-medium text-gray-600"
                  htmlFor="date"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                    touched.date && !date
                      ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } focus:outline-none`}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => handleBlur("date")}
                  required
                />
                {touched.date && !date && (
                  <p className="text-xs text-red-500 mt-1">Required</p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  className="block text-xs font-medium text-gray-600"
                  htmlFor="time"
                >
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 ${
                    touched.time && !time
                      ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  } focus:outline-none`}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={() => handleBlur("time")}
                  required
                />
                {touched.time && !time && (
                  <p className="text-xs text-red-500 mt-1">Required</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <LocationInput value={location} onChange={setLocation} required />

          {/* Dynamic Activity-Specific Fields */}
          {currentActivityType?.fields && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {currentActivityType.label} Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(currentActivityType.fields).map(
                  ([fieldKey, fieldConfig]) => (
                    <div key={fieldKey} className="space-y-1">
                      <label
                        className="block text-xs font-medium text-gray-600"
                        htmlFor={fieldKey}
                      >
                        {fieldConfig.label}
                      </label>

                      {fieldConfig.type === "distance" ? (
                        // Special rendering for distance fields with unit selector
                        <div className="flex gap-2">
                          <input
                            id={fieldKey}
                            type="number"
                            min="0"
                            step="0.1"
                            className="flex-1 px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                            placeholder={fieldConfig.placeholder}
                            value={dynamicFields[fieldKey] || ""}
                            onChange={(e) =>
                              updateDynamicField(fieldKey, e.target.value)
                            }
                          />
                          <select
                            className="px-3 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200 min-w-[80px]"
                            value={
                              distanceUnits[fieldKey] || fieldConfig.defaultUnit
                            }
                            onChange={(e) =>
                              updateDistanceUnit(fieldKey, e.target.value)
                            }
                          >
                            {fieldConfig.units.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        // Regular input for non-distance fields
                        <input
                          id={fieldKey}
                          type={fieldConfig.type}
                          className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                          placeholder={fieldConfig.placeholder}
                          value={dynamicFields[fieldKey] || ""}
                          onChange={(e) =>
                            updateDynamicField(fieldKey, e.target.value)
                          }
                        />
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Max Participants */}
          <div className="space-y-3">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="maxParticipants"
              >
                How many can join?
              </label>
              <p className="text-xs text-gray-500">
                Not including you as the organizer
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="maxParticipants"
                type="number"
                min={1}
                max={20}
                className={`w-24 px-4 py-3 border rounded-xl text-center font-medium transition-all duration-200 ${
                  touched.maxParticipants &&
                  (!maxParticipants || maxParticipants < 1)
                    ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                } focus:outline-none`}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                onBlur={() => handleBlur("maxParticipants")}
                required
              />
              <div className="flex-1 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-blue-900">
                  Total group size: {maxParticipants ? maxParticipants + 1 : 1}{" "}
                  people
                </p>
                <p className="text-xs text-blue-600 mt-1">Including you</p>
              </div>
            </div>
            {touched.maxParticipants &&
              (!maxParticipants || maxParticipants < 1) && (
                <p className="text-sm text-red-500">
                  At least 1 person should be able to join
                </p>
              )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="description"
            >
              Anything else to share? (optional)
            </label>
            <textarea
              id="description"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px] resize-none transition-all duration-200 placeholder-gray-400"
              placeholder="e.g., What to bring, meeting point details, skill level expected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Who can see and join?
            </label>
            <div className="space-y-3">
              <label
                className={`relative flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                  visibility === "all-friends"
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="all-friends"
                  checked={visibility === "all-friends"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">All Friends</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Everyone you're friends with can see and join
                  </div>
                </div>
                {visibility === "all-friends" && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>

              <label
                className={`relative flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                  visibility === "specific-friends"
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="specific-friends"
                  checked={visibility === "specific-friends"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Select Friends
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    You'll choose which friends to invite after creating
                  </div>
                </div>
                {visibility === "specific-friends" && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>

              <label
                className={`relative flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                  visibility === "public"
                    ? "border-blue-200 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Public</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Anyone nearby can discover and join your activity
                  </div>
                </div>
                {visibility === "public" && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                  ⚠️
                </div>
                <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-green-800 font-medium">
                  Activity created! Taking you there now...
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="flex items-center justify-center gap-3">
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Activity...
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    Create Activity
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* Friend Invite Modal */}
        <FriendInviteModal
          isOpen={showInviteModal}
          onClose={handleSkipInvites}
          activity={createdActivity}
          onInvitesSent={handleInvitesSent}
        />
      </div>
    </div>
  );
}
