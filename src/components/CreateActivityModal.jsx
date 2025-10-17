import { useState } from "react";
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Users, Check, Plus, X } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { ActivityService } from "../services";
import LocationInput from "./LocationInput";
import FriendInviteModal from "./FriendInviteModal";

const activityTypes = [
  {
    value: "running",
    label: "Running",
    icon: <LiaRunningSolid className="size-6" />,
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
    icon: <LiaBikingSolid className="size-6" />,
    fields: {
      distance: {
        label: "Distance",
        type: "distance",
        units: ["km", "mi"],
        defaultUnit: "km",
        placeholder: "20",
      },
      pace: {
        label: "Pace (optional)",
        placeholder: "e.g. 25 km/h, moderate pace",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 4,
      defaultTime: "09:00",
    },
  },
  {
    value: "tennis",
    label: "Tennis",
    icon: <IoTennisballOutline className="size-6" />,
    fields: {
      level: {
        label: "Skill Level",
        placeholder: "e.g. Beginner, Intermediate, Advanced",
        type: "text",
      },
    },
    defaults: {
      maxParticipants: 3,
      defaultTime: "18:00",
    },
  },
  {
    value: "walking",
    label: "Walking",
    icon: <LiaWalkingSolid className="size-6" />,
    fields: {
      distance: {
        label: "Distance",
        type: "distance",
        units: ["m", "km", "mi"],
        defaultUnit: "km",
        placeholder: "3",
      },
    },
    defaults: {
      maxParticipants: 5,
      defaultTime: "10:00",
    },
  },
];

export default function CreateActivityModal({
  isOpen,
  onClose,
  onActivityCreated,
}) {
  const { user } = useSupabaseAuth();
  const [selectedType, setSelectedType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(null);
  const [maxParticipants, setMaxParticipants] = useState(3);
  const [visibility, setVisibility] = useState("all-friends");
  const [dynamicFields, setDynamicFields] = useState({});
  const [distanceUnits, setDistanceUnits] = useState({});
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [createdActivity, setCreatedActivity] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentActivityType = activityTypes.find(
    (type) => type.value === selectedType
  );

  const handleActivityTypeChange = (typeValue) => {
    setSelectedType(typeValue);
    const newType = activityTypes.find((type) => type.value === typeValue);
    if (newType) {
      setMaxParticipants(newType.defaults.maxParticipants);
      setTime(newType.defaults.defaultTime);
      // Reset dynamic fields when changing activity type
      setDynamicFields({});
      setDistanceUnits({});
    }
  };

  const updateDynamicField = (fieldKey, value) => {
    setDynamicFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const updateDistanceUnit = (fieldKey, unit) => {
    setDistanceUnits((prev) => ({
      ...prev,
      [fieldKey]: unit,
    }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleClose = () => {
    // Reset form
    setSelectedType("");
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation(null);
    setMaxParticipants(3);
    setVisibility("all-friends");
    setDynamicFields({});
    setDistanceUnits({});
    setTouched({});
    setSaving(false);
    setErrorMsg("");
    setShowSuccessMessage(false);
    setCreatedActivity(null);
    setShowInviteModal(false);
    onClose();
  };

  // Validation function to check if form can be submitted
  const isFormValid = () => {
    return (
      selectedType &&
      title.trim() &&
      date &&
      time &&
      location &&
      location.place_name &&
      location.place_name.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setErrorMsg("");

    try {
      // Combine date and time into starts_at
      const starts_at = `${date}T${time}:00`;

      // Prepare activity data with properly formatted distance values
      const activityData = {
        userId: user.id,
        title,
        description,
        type: selectedType,
        starts_at,
        place_name: location?.place_name,
        lat: location?.lat,
        lng: location?.lng,
        max_participants: maxParticipants,
        visibility: visibility === "all-friends" ? "friends" : "private", // Map to database values
      };

      // Add dynamic fields
      if (currentActivityType?.fields) {
        Object.entries(currentActivityType.fields).forEach(
          ([fieldKey, fieldConfig]) => {
            const value = dynamicFields[fieldKey];
            if (value !== undefined && value !== "") {
              if (fieldConfig.type === "distance") {
                const unit = distanceUnits[fieldKey] || fieldConfig.defaultUnit;
                // Format distance as string (e.g., "10km") as expected by the API
                activityData[fieldKey] = `${value}${unit}`;
              } else {
                activityData[fieldKey] = value;
              }
            }
          }
        );
      }

      const newActivity = await ActivityService.createActivity(activityData);
      setCreatedActivity(newActivity);
      setShowSuccessMessage(true);

      // Navigate based on visibility setting
      setTimeout(() => {
        if (visibility === "specific-friends") {
          setShowInviteModal(true);
        } else {
          onActivityCreated?.(newActivity);
          handleClose();
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to create activity:", error);
      setErrorMsg(
        error.message || "Failed to create activity. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleInvitesSent = () => {
    setShowInviteModal(false);
    onActivityCreated?.(createdActivity);
    handleClose();
  };

  const handleSkipInvites = () => {
    setShowInviteModal(false);
    onActivityCreated?.(createdActivity);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-white/40 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/40 bg-white/95 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-minimal"
                style={{ background: "var(--color-dark-cyan)" }}
              >
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-onyx">
                  Create Activity
                </h2>
                <p className="text-sm text-onyx/70">
                  Organize something amazing for your friends
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 flex items-center justify-center transition-all duration-200 hover:scale-105 border border-white/40"
            >
              <X className="w-4 h-4 text-onyx/70" />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <form
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                onSubmit={handleSubmit}
              >
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label
                      className="block text-sm font-medium text-onyx mb-2"
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
                      <p className="text-sm text-keppel mt-1">
                        Please add a title
                      </p>
                    )}
                  </div>

                  {/* Activity Type */}
                  <div>
                    <label className="block text-sm font-medium text-onyx mb-2">
                      What type of activity?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {activityTypes.map((type) => (
                        <button
                          type="button"
                          key={type.value}
                          className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 shadow-minimal hover:scale-105 ${
                            selectedType === type.value
                              ? "border-dark_cyan/50 bg-dark_cyan/10 text-dark_cyan"
                              : "border-white/40 bg-white/60 backdrop-blur-sm text-onyx/70 hover:border-keppel/30 hover:bg-white/80"
                          }`}
                          onClick={() => handleActivityTypeChange(type.value)}
                        >
                          {selectedType === type.value && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-dark_cyan rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          <div
                            className={`transition-all duration-200 ${
                              selectedType === type.value
                                ? "scale-110"
                                : "group-hover:scale-105"
                            }`}
                          >
                            {type.icon}
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-medium text-sm">
                              {type.label}
                            </div>
                            <div
                              className={`text-xs ${
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
                  <div>
                    <label className="block text-sm font-medium text-onyx mb-2">
                      When is it happening?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        id="date"
                        type="date"
                        className={`px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-minimal ${
                          touched.date && !date
                            ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                            : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                        } focus:outline-none`}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onBlur={() => handleBlur("date")}
                        required
                      />
                      <input
                        id="time"
                        type="time"
                        className={`px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl transition-all duration-200 shadow-minimal ${
                          touched.time && !time
                            ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                            : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                        } focus:outline-none`}
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        onBlur={() => handleBlur("time")}
                        required
                      />
                    </div>
                    {(touched.date && !date) || (touched.time && !time) ? (
                      <p className="text-sm text-keppel mt-1">
                        Date and time are required
                      </p>
                    ) : null}
                  </div>

                  {/* Location */}
                  <div>
                    <LocationInput
                      value={location}
                      onChange={setLocation}
                      required
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  {/* Dynamic Activity-Specific Fields */}
                  {currentActivityType?.fields && (
                    <div className="space-y-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 shadow-minimal">
                      <h3 className="text-sm font-medium text-onyx">
                        {currentActivityType.label} Details
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(currentActivityType.fields).map(
                          ([fieldKey, fieldConfig]) => (
                            <div key={fieldKey}>
                              <label
                                className="block text-xs font-medium text-onyx/70 mb-1"
                                htmlFor={fieldKey}
                              >
                                {fieldConfig.label}
                              </label>
                              {fieldConfig.type === "distance" ? (
                                <div className="flex gap-2">
                                  <input
                                    id={fieldKey}
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    className="flex-1 px-3 py-2.5 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 shadow-minimal"
                                    placeholder={fieldConfig.placeholder}
                                    value={dynamicFields[fieldKey] || ""}
                                    onChange={(e) =>
                                      updateDynamicField(
                                        fieldKey,
                                        e.target.value
                                      )
                                    }
                                  />
                                  <select
                                    className="px-3 py-2.5 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 min-w-[70px] shadow-minimal"
                                    value={
                                      distanceUnits[fieldKey] ||
                                      fieldConfig.defaultUnit
                                    }
                                    onChange={(e) =>
                                      updateDistanceUnit(
                                        fieldKey,
                                        e.target.value
                                      )
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
                                <input
                                  id={fieldKey}
                                  type={fieldConfig.type}
                                  className="w-full px-3 py-2.5 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 transition-all duration-200 shadow-minimal"
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
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label
                        className="block text-sm font-medium text-onyx mb-2"
                        htmlFor="maxParticipants"
                      >
                        How many can join?
                      </label>
                      <input
                        id="maxParticipants"
                        type="number"
                        min={1}
                        max={20}
                        className={`w-full px-4 py-3 border bg-white/80 backdrop-blur-sm rounded-xl text-center font-medium transition-all duration-200 shadow-minimal ${
                          touched.maxParticipants &&
                          (!maxParticipants || maxParticipants < 1)
                            ? "border-keppel/50 focus:border-keppel focus:ring-1 focus:ring-keppel/30"
                            : "border-white/40 focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30"
                        } focus:outline-none`}
                        value={maxParticipants}
                        onChange={(e) =>
                          setMaxParticipants(Number(e.target.value))
                        }
                        onBlur={() => handleBlur("maxParticipants")}
                        required
                      />
                    </div>
                    <div className="flex-1 p-4 bg-dark_cyan/10 rounded-xl border border-white/40">
                      <p className="text-sm font-medium text-dark_cyan">
                        Total: {maxParticipants ? maxParticipants + 1 : 1}{" "}
                        people
                      </p>
                      <p className="text-xs text-dark_cyan/70">Including you</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      className="block text-sm font-medium text-onyx mb-2"
                      htmlFor="description"
                    >
                      Anything else to share? (optional)
                    </label>
                    <textarea
                      id="description"
                      className="w-full px-4 py-3 border border-white/40 bg-white/80 backdrop-blur-sm rounded-xl focus:outline-none focus:border-dark_cyan focus:ring-1 focus:ring-dark_cyan/30 min-h-[80px] resize-none transition-all duration-200 placeholder-onyx/50 shadow-minimal"
                      placeholder="e.g., What to bring, meeting point details, skill level expected..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Visibility Options */}
                  <div>
                    <label className="block text-sm font-medium text-onyx mb-2">
                      Who can see and join?
                    </label>
                    <div className="space-y-2">
                      <label
                        className={`relative flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
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
                          className="w-4 h-4 text-dark_cyan mt-0.5 accent-dark_cyan"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-onyx text-sm">
                            All Friends
                          </div>
                          <div className="text-xs text-onyx/70 mt-0.5">
                            Everyone you're friends with can see and join
                          </div>
                        </div>
                        {visibility === "all-friends" && (
                          <div className="w-5 h-5 bg-dark_cyan rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </label>

                      <label
                        className={`relative flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
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
                          className="w-4 h-4 text-dark_cyan mt-0.5 accent-dark_cyan"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-onyx text-sm">
                            Select Friends
                          </div>
                          <div className="text-xs text-onyx/70 mt-0.5">
                            You'll choose which friends to invite after creating
                          </div>
                        </div>
                        {visibility === "specific-friends" && (
                          <div className="w-5 h-5 bg-dark_cyan rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Full Width Bottom Section */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Error Message */}
                  {errorMsg && (
                    <div className="p-4 bg-keppel/10 border border-keppel/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-keppel flex-shrink-0 mt-0.5">
                          ⚠️
                        </div>
                        <p className="text-sm text-keppel font-medium">
                          {errorMsg}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Success Message */}
                  {showSuccessMessage && (
                    <div className="p-4 bg-hookers_green/10 border border-hookers_green/30 rounded-xl animate-fade-in">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-hookers_green rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm text-hookers_green font-medium">
                          Activity created!{" "}
                          {visibility === "specific-friends"
                            ? "Choose friends to invite..."
                            : "Taking you there now..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={saving || !isFormValid()}
                    className="w-full bg-keppel hover:bg-keppel/90 text-white font-medium py-3 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Activity...
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          {visibility === "all-friends"
                            ? "Create & Share with Friends"
                            : "Create & Invite Specific Friends"}
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Friend Invite Modal */}
      <FriendInviteModal
        isOpen={showInviteModal}
        onClose={handleSkipInvites}
        activity={createdActivity}
        onInvitesSent={handleInvitesSent}
      />
    </>
  );
}
