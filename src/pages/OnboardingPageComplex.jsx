import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ChevronRight, ChevronLeft, MapPin, Heart, Target, Check } from "lucide-react";
import LocationInput from "../components/LocationInput";

// Sport options with icons and categories
const SPORTS_OPTIONS = [
  { id: "running", name: "Running", icon: "🏃‍♂️", category: "Cardio" },
  { id: "cycling", name: "Cycling", icon: "🚴‍♂️", category: "Cardio" },
  { id: "walking", name: "Walking", icon: "🚶‍♂️", category: "Low Impact" },
  { id: "tennis", name: "Tennis", icon: "🎾", category: "Racquet Sports" },
  { id: "basketball", name: "Basketball", icon: "🏀", category: "Team Sports" },
  { id: "soccer", name: "Soccer", icon: "⚽", category: "Team Sports" },
  { id: "swimming", name: "Swimming", icon: "🏊‍♂️", category: "Water Sports" },
  { id: "yoga", name: "Yoga", icon: "🧘‍♀️", category: "Wellness" },
  { id: "hiking", name: "Hiking", icon: "🥾", category: "Outdoor" },
  { id: "gym", name: "Gym Workout", icon: "💪", category: "Strength" },
  { id: "climbing", name: "Rock Climbing", icon: "🧗‍♂️", category: "Adventure" },
  { id: "badminton", name: "Badminton", icon: "🏸", category: "Racquet Sports" },
];

// Experience levels
const EXPERIENCE_LEVELS = [
  { id: "beginner", name: "Beginner", description: "Just getting started" },
  { id: "intermediate", name: "Intermediate", description: "Some experience" },
  { id: "advanced", name: "Advanced", description: "Very experienced" },
  { id: "expert", name: "Expert", description: "Competitive level" },
];

// Activity frequency options
const FREQUENCY_OPTIONS = [
  { id: "daily", name: "Daily", description: "Every day" },
  { id: "few-times-week", name: "3-4 times/week", description: "Most days" },
  { id: "weekly", name: "1-2 times/week", description: "Regular activity" },
  { id: "monthly", name: "Few times/month", description: "Occasional activity" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [onboardingData, setOnboardingData] = useState({
    location: null,
    sports: [],
    experience_level: "",
    activity_frequency: "",
    goals: [],
    availability: [],
  });

  const totalSteps = 5;

  // Get user session
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUser(session.user);
    };
    getUser();
  }, [navigate]);

  // Save onboarding data to profile
  const saveOnboardingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.email?.split("@")[0],
        location: onboardingData.location?.place_name || null,
        location_lat: onboardingData.location?.lat || null,
        location_lng: onboardingData.location?.lng || null,
        sports_preferences: onboardingData.sports,
        experience_level: onboardingData.experience_level,
        activity_frequency: onboardingData.activity_frequency,
        goals: onboardingData.goals,
        availability: onboardingData.availability,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

      if (error) throw error;

      // Navigate to main app
      navigate("/app");
    } catch (error) {
      console.error("Error saving onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      saveOnboardingData();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateOnboardingData = (field, value) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayItem = (field, item) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 1: return onboardingData.location !== null;
      case 2: return onboardingData.sports.length > 0;
      case 3: return onboardingData.experience_level !== "";
      case 4: return onboardingData.activity_frequency !== "";
      case 5: return true; // Goals are optional
      default: return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Welcome to Moovle!</h1>
            </div>
            <span className="text-sm text-gray-600">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-xl p-8">
            
            {/* Step 1: Location */}
            {currentStep === 1 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Where are you located?
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We'll show you activities and people nearby so you can easily connect with your local community.
                </p>
                
                <div className="max-w-md mx-auto">
                  <LocationInput
                    value={onboardingData.location}
                    onChange={(location) => updateOnboardingData("location", location)}
                    placeholder="Enter your city or neighborhood"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Sports Preferences */}
            {currentStep === 2 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  What activities do you enjoy?
                </h2>
                <p className="text-gray-600 mb-8">
                  Select all the sports and activities you're interested in. Don't worry, you can change these later!
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {SPORTS_OPTIONS.map((sport) => (
                    <button
                      key={sport.id}
                      onClick={() => toggleArrayItem("sports", sport.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        onboardingData.sports.includes(sport.id)
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-700"
                      }`}
                    >
                      <div className="text-2xl mb-2">{sport.icon}</div>
                      <div className="font-medium text-sm">{sport.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{sport.category}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Experience Level */}
            {currentStep === 3 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  What's your experience level?
                </h2>
                <p className="text-gray-600 mb-8">
                  This helps us match you with activities and people at a similar level.
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => updateOnboardingData("experience_level", level.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        onboardingData.experience_level === level.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{level.name}</div>
                      <div className="text-sm text-gray-600">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Activity Frequency */}
            {currentStep === 4 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  How often do you want to be active?
                </h2>
                <p className="text-gray-600 mb-8">
                  We'll recommend activities that match your desired frequency.
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <button
                      key={freq.id}
                      onClick={() => updateOnboardingData("activity_frequency", freq.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        onboardingData.activity_frequency === freq.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{freq.name}</div>
                      <div className="text-sm text-gray-600">{freq.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Goals (Optional) */}
            {currentStep === 5 && (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  You're all set!
                </h2>
                <p className="text-gray-600 mb-8">
                  Ready to start finding activities and connecting with people in your area.
                </p>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Your Profile Summary:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Location:</strong> {onboardingData.location?.place_name || "Not set"}</div>
                    <div><strong>Interests:</strong> {onboardingData.sports.length} activities selected</div>
                    <div><strong>Experience:</strong> {EXPERIENCE_LEVELS.find(l => l.id === onboardingData.experience_level)?.name}</div>
                    <div><strong>Frequency:</strong> {FREQUENCY_OPTIONS.find(f => f.id === onboardingData.activity_frequency)?.name}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  isStepValid() && !loading
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? "Saving..." : currentStep === totalSteps ? "Get Started" : "Next"}
                {!loading && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
