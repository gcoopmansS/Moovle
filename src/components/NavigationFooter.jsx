import { Home, Plus, Users } from "lucide-react";

export default function NavigationFooter({
  onClickingCreate,
  onClickingFeed,
  onClickingFriends,
  selectedButton,
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
      <div className="max-w-md mx-auto px-6 py-3 flex items-center justify-around">
        <button
          onClick={onClickingFeed}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 min-w-[64px] ${
            selectedButton === "feed"
              ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Feed</span>
        </button>

        <button
          onClick={onClickingCreate}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 min-w-[64px] ${
            selectedButton === "create"
              ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg"
              : "text-gray-600 hover:text-green-600 hover:bg-green-50"
          }`}
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-medium">Create</span>
        </button>

        <button
          onClick={onClickingFriends}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 min-w-[64px] ${
            selectedButton === "friends"
              ? "bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg"
              : "text-gray-600 hover:text-orange-600 hover:bg-orange-50"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs font-medium">Friends</span>
        </button>
      </div>
    </footer>
  );
}
