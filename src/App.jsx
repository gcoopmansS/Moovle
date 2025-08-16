import { useState, useEffect, useCallback } from "react";
import { useSupabaseAuth } from "./hooks/useSupabaseAuth";
import { supabase } from "./lib/supabase";
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
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        let avatarUrl = data.avatar_url;

        // If avatar_url exists and looks like a storage path (not a full URL),
        // generate a fresh signed URL
        if (avatarUrl && !avatarUrl.startsWith("http")) {
          try {
            const { data: signed, error: signErr } = await supabase.storage
              .from("avatars")
              .createSignedUrl(avatarUrl, 60 * 60 * 24); // 24 hours
            if (!signErr && signed?.signedUrl) {
              avatarUrl = signed.signedUrl;
            }
          } catch (signError) {
            console.error("Error generating signed URL:", signError);
            // Keep the original path, fallback will handle it
          }
        }

        setUserProfile({
          ...data,
          avatar_url: avatarUrl,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

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
      return <ProfilePage onProfileUpdate={fetchUserProfile} />;
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
      <Header
        onProfileClick={handleProfileClick}
        onSignOut={handleSignOut}
        user={{
          ...user,
          display_name: userProfile?.display_name,
          avatar_url: userProfile?.avatar_url,
        }}
      />
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
