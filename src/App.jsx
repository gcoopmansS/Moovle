import { useState } from "react";

import ActivityFeed from "./components/ActivityFeed";
import Header from "./components/Header";
import NavigationFooter from "./components/NavigationFooter";
import ActivityForm from "./components/ActivityForm";
import Friends from "./components/Friends";

// Initial activities data
const initialActivities = [
  {
    id: "1",
    title: "Morning Run in Central Park",
    type: "running",
    date: "2025-01-15",
    time: "07:00",
    location: "Central Park, NY",
    distance: "5km",
    maxParticipants: 4,
    description:
      "Easy pace morning run to start the day. Perfect for beginners!",
    creator: {
      id: "1",
      name: "Alex Johnson",
      avatar:
        "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
    },
    participants: [
      {
        id: "1",
        name: "Alex Johnson",
        avatar:
          "https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      },
      {
        id: "2",
        name: "Sarah Wilson",
        avatar:
          "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      },
    ],
    createdAt: "2025-01-14T10:30:00Z",
  },
  {
    id: "2",
    title: "Evening Cycle Along the River",
    type: "cycling",
    date: "2025-01-15",
    time: "18:30",
    location: "Hudson River Greenway",
    distance: "15km",
    maxParticipants: 6,
    description:
      "Scenic evening cycle ride. Moderate pace with stops for photos.",
    creator: {
      id: "3",
      name: "Mike Chen",
      avatar:
        "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
    },
    participants: [
      {
        id: "3",
        name: "Mike Chen",
        avatar:
          "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      },
    ],
    createdAt: "2025-01-14T14:15:00Z",
  },
  {
    id: "3",
    title: "Tennis Match - Looking for Partner",
    type: "tennis",
    date: "2025-01-16",
    time: "16:00",
    location: "City Tennis Courts",
    distance: "1 hour",
    maxParticipants: 2,
    description:
      "Looking for a tennis partner for a friendly match. Intermediate level.",
    creator: {
      id: "4",
      name: "Emma Davis",
      avatar:
        "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
    },
    participants: [
      {
        id: "4",
        name: "Emma Davis",
        avatar:
          "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
      },
    ],
    createdAt: "2025-01-14T16:45:00Z",
  },
];

function App() {
  const [selectedButton, setSelectedButton] = useState("feed");
  const [activities, setActivities] = useState(initialActivities);

  function handleAddActivity(newActivity) {
    setActivities((prev) => [
      {
        ...newActivity,
        id: (prev.length + 1).toString(),
        creator: {
          id: "me",
          name: "You",
          avatar:
            "https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff",
        },
        participants: [
          {
            id: "me",
            name: "You",
            avatar:
              "https://ui-avatars.com/api/?name=You&background=0D8ABC&color=fff",
          },
        ],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setSelectedButton("feed");
  }

  function renderMainContent() {
    if (selectedButton === "create") {
      return <ActivityForm onAddActivity={handleAddActivity} />;
    } else if (selectedButton === "feed") {
      return <ActivityFeed activities={activities} />;
    } else if (selectedButton === "friends") {
      return <Friends />;
    } else if (selectedButton === "profile") {
      return <div className="p-4">User Profile Information Goes Here</div>;
    }
  }

  function handleFooterClick(buttonClicked) {
    if (buttonClicked === "create") {
      setSelectedButton("create");
    } else if (buttonClicked === "feed") {
      setSelectedButton("feed");
    } else if (buttonClicked === "friends") {
      setSelectedButton("friends");
    } else if (buttonClicked === "profile") {
      setSelectedButton("profile");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <main className="pt-16 pb-20">{renderMainContent()}</main>
      <NavigationFooter
        onClickingCreate={() => handleFooterClick("create")}
        onClickingFeed={() => handleFooterClick("feed")}
        onClickingFriends={() => handleFooterClick("friends")}
        onClickingProfile={() => handleFooterClick("profile")}
        selectedButton={selectedButton}
      />
    </div>
  );
}

export default App;
