// src/services/authService.js
import { supabase } from "../lib/supabase.js";
import { validateProfile, sanitizeInput } from "../utils/validation.js";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../constants/app.js";

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signInWithPassword(email, password) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Successfully signed in!",
        data: data.user,
      };
    } catch (error) {
      console.error("Password sign-in failed:", error);
      throw new Error(error.message || "Invalid email or password");
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUpWithPassword(email, password, profileData = {}) {
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Validate profile data if provided
    if (profileData.display_name) {
      const validation = validateProfile(profileData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: sanitizeInput(profileData.display_name || ""),
            bio: sanitizeInput(profileData.bio || ""),
          },
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: "Account created! Please check your email to confirm.",
        data: data.user,
      };
    } catch (error) {
      console.error("Sign-up failed:", error);
      throw new Error(error.message || "Failed to create account");
    }
  }

  /**
   * Sign in with Google OAuth
   */
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          scopes: "email profile",
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: "Redirecting to Google...",
        data,
      };
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw new Error(error.message || "Google sign-in failed");
    }
  }

  /**
   * Sign in with Facebook OAuth
   */
  static async signInWithFacebook() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: window.location.origin,
          scopes: "email",
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: "Redirecting to Facebook...",
        data,
      };
    } catch (error) {
      console.error("Facebook sign-in failed:", error);
      throw new Error(error.message || "Facebook sign-in failed");
    }
  }

  /**
   * Sign in with magic link (passwordless)
   */
  static async signInWithMagicLink(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      return {
        success: true,
        message: "Check your email for the login link!",
        data: null,
      };
    } catch (error) {
      console.error("Magic link sign-in failed:", error);
      throw new Error(error.message || "Failed to send magic link");
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      return {
        success: true,
        message: "Successfully signed out",
        data: null,
      };
    } catch (error) {
      console.error("Sign-out failed:", error);
      throw new Error(error.message || "Failed to sign out");
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email) {
    if (!email) {
      throw new Error("Email is required");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address");
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      return {
        success: true,
        message: "Password reset email sent! Check your inbox.",
        data: null,
      };
    } catch (error) {
      console.error("Password reset failed:", error);
      throw new Error(error.message || "Failed to send reset email");
    }
  }

  /**
   * Update password (when user is logged in)
   */
  static async updatePassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters");
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return {
        success: true,
        message: "Password updated successfully!",
        data: null,
      };
    } catch (error) {
      console.error("Password update failed:", error);
      throw new Error(error.message || "Failed to update password");
    }
  }

  /**
   * Refresh current session
   */
  static async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      return {
        success: true,
        message: "Session refreshed",
        data: data.session,
      };
    } catch (error) {
      console.error("Session refresh failed:", error);
      throw new Error(error.message || "Failed to refresh session");
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      return data.session;
    } catch (error) {
      console.error("Failed to get session:", error);
      return null;
    }
  }

  /**
   * Get current user
   */
  static async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;

      return data.user;
    } catch (error) {
      console.error("Failed to get user:", error);
      return null;
    }
  }
}
