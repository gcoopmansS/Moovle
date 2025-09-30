import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ensureOAuthProfile } from "../utils/oauthProfile";

export function useSupabaseAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(false);
      
      // Handle OAuth profile creation/update on sign in
      if (event === 'SIGNED_IN' && session?.user) {
        ensureOAuthProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signInWithPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUpWithPassword(email, password) {
    // optional (for in-app signup)
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
        scopes: "email profile",
      },
    });
    if (error) throw error;
  }

  async function signInWithFacebook() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error);
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithPassword,
    signUpWithPassword, // optional
    signInWithGoogle,
    signInWithFacebook, // optional
    signOut,
  };
}
