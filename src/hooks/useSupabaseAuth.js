import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

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

  async function signInWithEmail(email) {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async function signInWithGithub() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin,
        scopes: "read:user user:email",
      },
    });
    if (error) throw error;
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
    signInWithEmail,
    signInWithGithub,
    signOut,
  };
}
