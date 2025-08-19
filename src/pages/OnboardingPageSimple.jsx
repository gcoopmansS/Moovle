import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { MapPin } from "lucide-react";
import LocationInput from "../components/LocationInput";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const handleComplete = async (e) => {
    e.preventDefault();

    if (!location.trim()) {
      alert("Please enter your location to continue");
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No user found");
      }

      // Update user profile with location and mark onboarding as complete
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        location: location,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Navigate to main app
      navigate("/app", { replace: true });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      alert("Failed to save your information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Moovle!
          </h1>
          <p className="text-gray-600">
            Let's get you set up to find sports activities in your area
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleComplete} className="space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <MapPin className="w-4 h-4" />
              Where are you located?
            </label>
            <LocationInput
              value={location}
              onChange={handleLocationChange}
              placeholder="Enter your city, state, country"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              We'll use this to show you activities and sports buddies nearby
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !location.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up your profile..." : "Get Started"}
          </button>
        </form>

        {/* Skip Option */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/app", { replace: true })}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
