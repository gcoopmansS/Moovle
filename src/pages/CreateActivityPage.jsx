import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Users, Check, Plus } from "lucide-react";
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
    <div className="min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-sm p-8 rounded-2xl text-center mb-10 border border-white/40 shadow-minimal">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center shadow-minimal"
            style={{ background: "var(--color-dark-cyan)" }}
          >
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-medium text-onyx mb-3">
            Create Activity
          </h1>
          <p className="text-onyx/70">
            Organize something amazing for your friends
          </p>
        </div>

        {/* Main Form */}
        <form className="space-y-8" onSubmit={handleSubmit}>
          {/* Title */}
          <div className="space-y-1">
            <label
              className="block text-sm font-medium text-onyx"
              htmlFor="title"
            >
              What are you organizing?
            </label>
            <input
              id="title"
              type="text"
              className={`w-full px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl text-onyx placeholder-onyx/50 transition-all duration-200 shadow-minimal ${
                touched.title && !title
                  ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                  : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
              } focus:outline-none`}
              placeholder="e.g., Morning jog around the park"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleBlur("title")}
              required
            />
            {touched.title && !title && (
              <p className="text-sm text-keppel mt-1">Please add a title</p>
            )}
          </div>

          {/* Activity Type */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-onyx">
              What type of activity?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {activityTypes.map((type) => (
                <button
                  type="button"
                  key={type.value}
                  className={`group relative flex items-center gap-3 px-4 py-4 rounded-2xl border transition-all duration-300 shadow-minimal hover:scale-105 ${
                    selectedType === type.value
                      ? "border-dark_cyan/50 bg-dark_cyan/10 text-dark_cyan"
                      : "border-white/40 bg-white/60 backdrop-blur-sm text-onyx/70 hover:border-keppel/30 hover:bg-white/80"
                  }`}
                  onClick={() => handleActivityTypeChange(type.value)}
                >
                  {selectedType === type.value && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-dark_cyan rounded-full flex items-center justify-center">
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
                          ? "text-dark_cyan/80"
                          : "text-onyx/50"
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
            <label className="block text-sm font-medium text-onyx">
              When is it happening?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  className="block text-xs font-medium text-onyx/70"
                  htmlFor="date"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  className={`w-full px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-minimal ${
                    touched.date && !date
                      ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                      : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                  } focus:outline-none`}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onBlur={() => handleBlur("date")}
                  required
                />
                {touched.date && !date && (
                  <p className="text-xs text-keppel mt-1">Required</p>
                )}
              </div>
              <div className="space-y-1">
                <label
                  className="block text-xs font-medium text-onyx/70"
                  htmlFor="time"
                >
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  className={`w-full px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-minimal ${
                    touched.time && !time
                      ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                      : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                  } focus:outline-none`}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  onBlur={() => handleBlur("time")}
                  required
                />
                {touched.time && !time && (
                  <p className="text-xs text-keppel mt-1">Required</p>
                )}
              </div>
            </div>
          </div>

          {/* Location */}
          <LocationInput value={location} onChange={setLocation} required />

          {/* Dynamic Activity-Specific Fields */}
          {currentActivityType?.fields && (
            <div className="space-y-4 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-minimal">
              <h3 className="text-sm font-medium text-onyx mb-3">
                {currentActivityType.label} Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(currentActivityType.fields).map(
                  ([fieldKey, fieldConfig]) => (
                    <div key={fieldKey} className="space-y-1">
                      <label
                        className="block text-xs font-medium text-onyx/70"
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
                            className="flex-1 px-4 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 shadow-minimal"
                            placeholder={fieldConfig.placeholder}
                            value={dynamicFields[fieldKey] || ""}
                            onChange={(e) =>
                              updateDynamicField(fieldKey, e.target.value)
                            }
                          />
                          <select
                            className="px-3 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 min-w-[80px] shadow-minimal"
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
                          className="w-full px-4 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 shadow-minimal"
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
                className="block text-sm font-medium text-onyx mb-1"
                htmlFor="maxParticipants"
              >
                How many can join?
              </label>
              <p className="text-xs text-onyx/60">
                Not including you as the organizer
              </p>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="maxParticipants"
                type="number"
                min={1}
                max={20}
                className={`w-24 px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl text-center font-medium transition-all duration-200 shadow-minimal ${
                  touched.maxParticipants &&
                  (!maxParticipants || maxParticipants < 1)
                    ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                    : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                } focus:outline-none`}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                onBlur={() => handleBlur("maxParticipants")}
                required
              />
              <div className="flex-1 p-3 bg-dark_cyan/10 rounded-xl border border-white/40">
                <p className="text-sm font-medium text-dark_cyan">
                  Total group size: {maxParticipants ? maxParticipants + 1 : 1}{" "}
                  people
                </p>
                <p className="text-xs text-dark_cyan/70 mt-1">Including you</p>
              </div>
            </div>
            {touched.maxParticipants &&
              (!maxParticipants || maxParticipants < 1) && (
                <p className="text-sm text-keppel">
                  At least 1 person should be able to join
                </p>
              )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label
              className="block text-sm font-medium text-onyx"
              htmlFor="description"
            >
              Anything else to share? (optional)
            </label>
            <textarea
              id="description"
              className="w-full px-4 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 min-h-[100px] resize-none transition-all duration-200 placeholder-onyx/50 shadow-minimal"
              placeholder="e.g., What to bring, meeting point details, skill level expected..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Visibility Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-onyx">
              Who can see and join?
            </label>
            <div className="space-y-3">
              <label
                className={`relative flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                  visibility === "all-friends"
                    ? "border-dark_cyan/50 bg-dark_cyan/10"
                    : "border-white/40 hover:border-keppel/30 bg-white/60 backdrop-blur-sm"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="all-friends"
                  checked={visibility === "all-friends"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-5 h-5 text-dark_cyan mt-0.5 accent-dark_cyan"
                />
                <div className="flex-1">
                  <div className="font-medium text-onyx">All Friends</div>
                  <div className="text-sm text-onyx/70 mt-1">
                    Everyone you're friends with can see and join
                  </div>
                </div>
                {visibility === "all-friends" && (
                  <div className="w-6 h-6 bg-dark_cyan rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </label>

              <label
                className={`relative flex items-start gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                  visibility === "specific-friends"
                    ? "border-dark_cyan/50 bg-dark_cyan/10"
                    : "border-white/40 hover:border-keppel/30 bg-white/60 backdrop-blur-sm"
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value="specific-friends"
                  checked={visibility === "specific-friends"}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-5 h-5 text-dark_cyan mt-0.5 accent-dark_cyan"
                />
                <div className="flex-1">
                  <div className="font-medium text-onyx">Select Friends</div>
                  <div className="text-sm text-onyx/70 mt-1">
                    You'll choose which friends to invite after creating
                  </div>
                </div>
                {visibility === "specific-friends" && (
                  <div className="w-6 h-6 bg-dark_cyan rounded-full flex items-center justify-center">
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
            <div className="p-4 bg-keppel/10 border border-keppel/30 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-keppel flex-shrink-0 mt-0.5">
                  ⚠️
                </div>
                <p className="text-sm text-keppel font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="p-4 bg-hookers_green/10 border border-hookers_green/30 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-hookers_green rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-hookers_green font-medium">
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
              className="w-full bg-dark_cyan hover:bg-dark_cyan/80 text-white font-medium py-4 rounded-2xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-minimal hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
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
