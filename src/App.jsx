import { useState } from "react";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import AuthPage from "./pages/AuthPage";

import ActivityFeed from "./components/ActivityFeed";
import Header from "./components/Header";
import NavigationFooter from "./components/NavigationFooter";
import ActivityForm from "./components/ActivityForm";
import Friends from "./components/Friends";

function App() {
  const { user, loading, signOut } = useSupabaseAuth();
  const [selectedButton, setSelectedButton] = useState("feed");

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <AuthPage />;

  function renderMainContent() {
    if (selectedButton === "create") {
      // ActivityForm should call Supabase (createActivity) and then fire onCreated
      return <ActivityForm onCreated={() => setSelectedButton("feed")} />;
    } else if (selectedButton === "feed") {
      // ActivityFeed should fetch from Supabase (fetchFeed)
      return <ActivityFeed />;
    } else if (selectedButton === "friends") {
      return <Friends />;
    } else if (selectedButton === "profile") {
      return (
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2">Profile</h2>
          <div className="text-gray-700 mb-4">{user.email ?? user.id}</div>
          <button className="px-3 py-2 border rounded" onClick={signOut}>
            Sign out
          </button>
        </div>
      );
    }
  }

  function handleFooterClick(buttonClicked) {
    setSelectedButton(buttonClicked);
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
