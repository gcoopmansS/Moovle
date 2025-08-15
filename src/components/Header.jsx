import { Bell, MessageCircle, UserCircleIcon } from "lucide-react";

export default function Header({ children }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">SportsBuddy</h1>
        <div className="flex items-center space-x-3">
          <button>
            <Bell className="h-6 w-6 mr-4" />
          </button>
          <button>
            <MessageCircle className="h-6 w-6" />
          </button>
          <button>
            <UserCircleIcon className="h-6 w-6 ml-4" />
          </button>
          {children}
        </div>
      </div>
    </header>
  );
}
