// src/components/ActivityTemplates.jsx
import {
  LiaRunningSolid,
  LiaBikingSolid,
  LiaWalkingSolid,
} from "react-icons/lia";
import { IoTennisballOutline } from "react-icons/io5";
import { Clock, Zap, Heart, Trophy } from "lucide-react";

const templates = [
  {
    id: "morning-run",
    title: "Morning Run",
    type: "running",
    icon: <LiaRunningSolid className="w-6 h-6" />,
    color: "from-red-500 to-orange-500",
    distance: "5km",
    description: "Start your day with an energizing morning run!",
    maxParticipants: 6,
    defaultTime: "07:00",
  },
  {
    id: "evening-bike",
    title: "Evening Bike Ride",
    type: "cycling",
    icon: <LiaBikingSolid className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    distance: "15km",
    description: "Enjoy a scenic bike ride as the sun sets.",
    maxParticipants: 8,
    defaultTime: "18:00",
  },
  {
    id: "tennis-match",
    title: "Tennis Match",
    type: "tennis",
    icon: <IoTennisballOutline className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    distance: "1-2 hours",
    description: "Looking for a tennis partner for a friendly match!",
    maxParticipants: 4,
    defaultTime: "19:00",
  },
  {
    id: "nature-walk",
    title: "Nature Walk",
    type: "walking",
    icon: <LiaWalkingSolid className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    distance: "3km",
    description: "Take a peaceful walk and enjoy nature together.",
    maxParticipants: 10,
    defaultTime: "16:00",
  },
];

const difficultyBadges = {
  easy: {
    icon: <Heart className="w-3 h-3" />,
    label: "Easy",
    color: "bg-green-100 text-green-700",
  },
  moderate: {
    icon: <Clock className="w-3 h-3" />,
    label: "Moderate",
    color: "bg-yellow-100 text-yellow-700",
  },
  intense: {
    icon: <Zap className="w-3 h-3" />,
    label: "Intense",
    color: "bg-red-100 text-red-700",
  },
  competitive: {
    icon: <Trophy className="w-3 h-3" />,
    label: "Competitive",
    color: "bg-purple-100 text-purple-700",
  },
};

export default function ActivityTemplates({ onTemplateSelect }) {
  const getDifficultyForTemplate = (templateId) => {
    switch (templateId) {
      case "morning-run":
        return "moderate";
      case "evening-bike":
        return "moderate";
      case "tennis-match":
        return "competitive";
      case "nature-walk":
        return "easy";
      default:
        return "easy";
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Quick Start Templates
        </h3>
        <p className="text-sm text-gray-500">Or create from scratch below</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => {
          const difficulty = getDifficultyForTemplate(template.id);
          const badge = difficultyBadges[difficulty];

          return (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-white shadow-lg`}
                >
                  {template.icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 group-hover:text-gray-700">
                      {template.title}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📍 {template.distance}</span>
                    <span>👥 {template.maxParticipants} max</span>
                    <span>🕐 {template.defaultTime}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
