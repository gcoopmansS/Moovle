import { useState } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

export default function AuthPage() {
  const { signInWithPassword, signInWithGoogle } = useSupabaseAuth();

  // Password form state
  const [emailPwd, setEmailPwd] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handlePassword(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithPassword(emailPwd, password);
      // success → hook will update session; page will redirect to app
    } catch (e) {
      setErr(e.message || "Email/password sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setErr("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // success → will redirect to Google OAuth
    } catch (e) {
      setErr(e.message || "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-7 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-2">
          Sign in to SportsBuddy
        </h2>

        {/* Password login */}
        <form onSubmit={handlePassword} className="grid gap-3">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent "
            type="email"
            placeholder="alice@test.com"
            value={emailPwd}
            onChange={(e) => setEmailPwd(e.target.value)}
            disabled={loading}
            required
          />
          <label className="text-sm font-medium text-gray-700">Password</label>
          <input
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            className="p-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60 cursor-pointer"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        {err && <div className="text-red-600 text-sm text-center">{err}</div>}

        <p className="text-xs text-gray-400 text-center mt-2">
          By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}
