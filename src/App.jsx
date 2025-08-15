import { useState } from "react";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import AuthPage from "./pages/AuthPage";

import ActivityFeed from "./components/ActivityFeed";
import Header from "./components/Header";
import NavigationFooter from "./components/NavigationFooter";
import ActivityForm from "./components/ActivityForm";
import Friends from "./components/Friends";
import ProfilePage from "./components/ProfilePage";

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
      return <ProfilePage />;
    }
  }

  function handleFooterClick(buttonClicked) {
    setSelectedButton(buttonClicked);
  }

  function handleProfileClick() {
    setSelectedButton("profile");
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header onProfileClick={handleProfileClick} onSignOut={handleSignOut} />
      <main className="pt-16 pb-20">{renderMainContent()}</main>
      <NavigationFooter
        onClickingCreate={() => handleFooterClick("create")}
        onClickingFeed={() => handleFooterClick("feed")}
        onClickingFriends={() => handleFooterClick("friends")}
        selectedButton={selectedButton}
      />
    </div>
  );
}

export default App;
