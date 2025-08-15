import { Home, Plus, User, Users } from "lucide-react";

export default function NavigationFooter({
  onClickingCreate,
  onClickingFeed,
  onClickingFriends,
  onClickingProfile,
  selectedButton,
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100">
      <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around">
        <button
          onClick={onClickingFeed}
          className={`p-3 flex flex-col items-center rounded-xl hover:bg-blue-500  hover:text-white ${
            selectedButton === "feed" ? "bg-blue-500 text-white" : ""
          }`}
        >
          <Home className="h-6 w-6" />
          <p>Feed</p>
        </button>
        <button
          onClick={onClickingCreate}
          className={`p-3 flex flex-col items-center rounded-xl hover:bg-green-500  hover:text-white  ${
            selectedButton === "create" ? "bg-green-500  text-white" : ""
          }`}
        >
          <Plus className="h-6 w-6" />
          <p>Create</p>
        </button>
        <button
          onClick={onClickingFriends}
          className={`p-3 flex flex-col items-center rounded-xl hover:bg-orange-500 hover:text-white ${
            selectedButton === "friends" ? "bg-orange-500 text-white" : ""
          }`}
        >
          <Users className="h-6 w-6" />
          <p>Friends</p>
        </button>
        <button
          onClick={onClickingProfile}
          className={`p-3 flex flex-col items-center rounded-xl hover:bg-purple-500  hover:text-white ${
            selectedButton === "profile" ? "bg-purple-500 text-white" : ""
          }`}
        >
          <User className="h-6 w-6" />
          <p>Profile</p>
        </button>
      </div>
    </footer>
  );
}
