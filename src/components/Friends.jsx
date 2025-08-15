import { Search } from "lucide-react";
import { useState } from "react";

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("friends");

  // Mock data for demonstration
  const [myFriends] = useState([
    {
      id: "gil",
      name: "Gil",
      avatar:
        "https://ui-avatars.com/api/?name=Gil&background=0D8ABC&color=fff",
    },
    {
      id: "eva",
      name: "Eva",
      avatar:
        "https://ui-avatars.com/api/?name=Eva&background=0D8ABC&color=fff",
    },
    {
      id: "tom",
      name: "Tom",
      avatar:
        "https://ui-avatars.com/api/?name=Tom&background=0D8ABC&color=fff",
    },
  ]);
  const [pendingRequests] = useState([
    {
      id: "alex",
      name: "Alex",
      avatar:
        "https://ui-avatars.com/api/?name=Alex&background=0D8ABC&color=fff",
    },
  ]);

  // Filtered friends for search
  const filteredFriends = myFriends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Friends</h2>
        <p className="text-gray-600 mb-6">
          Connect with your friends and join activities together!
        </p>
      </div>
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search friends..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "friends"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          My Friends ({myFriends.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all relative ${
            activeTab === "requests"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Requests
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("discover")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === "discover"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Discover
        </button>
      </div>
      {/* Tab Content */}
      {activeTab === "friends" && (
        <div>
          {filteredFriends.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No friends found.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredFriends.map((f) => (
                <li key={f.id} className="py-3 flex items-center gap-3">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 text-base">
                      {f.name}
                    </span>
                    <span className="text-xs text-gray-400">@{f.id}</span>
                  </div>
                  {/* Optionally, add a message or remove button here */}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === "requests" && (
        <div>
          {pendingRequests.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No requests.</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {pendingRequests.map((r) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="w-10 h-10 rounded-full border border-gray-200 shadow-sm object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 text-base">
                      {r.name}
                    </span>
                    <span className="text-xs text-gray-400">@{r.id}</span>
                  </div>
                  <button className="ml-auto bg-blue-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-600">
                    Accept
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {activeTab === "discover" && (
        <div className="text-gray-500 text-center py-8">
          Feature coming soon!
        </div>
      )}
    </div>
  );
}
