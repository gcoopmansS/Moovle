import { useState } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

export default function AuthPage() {
  const {
    signInWithGithub,
    signInWithEmail,
    signInWithPassword /*, signUpWithPassword*/,
  } = useSupabaseAuth();

  // Magic link state
  const [emailMagic, setEmailMagic] = useState("");
  const [sent, setSent] = useState(false);

  // Password form state
  const [emailPwd, setEmailPwd] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleGithub() {
    setErr("");
    setLoading(true);
    try {
      await signInWithGithub();
    } catch (e) {
      setErr(e.message || "GitHub sign-in failed.");
      setLoading(false);
    }
  }

  async function handleMagic(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await signInWithEmail(emailMagic);
      setSent(true);
    } catch (e) {
      setErr(e.message || "Failed to send magic link.");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-7 border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-2">
          Sign in to SportsBuddy
        </h2>

        {/* GitHub */}
        <button
          type="button"
          onClick={handleGithub}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold rounded-xl px-4 py-3 hover:bg-gray-800 transition disabled:opacity-60"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.09.79 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z" />
          </svg>
          Continue with GitHub
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        {/* Password login */}
        <form onSubmit={handlePassword} className="grid gap-3">
          <label className="text-sm font-medium text-gray-700">
            Email & password
          </label>
          <input
            className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="email"
            placeholder="alice@test.com"
            value={emailPwd}
            onChange={(e) => setEmailPwd(e.target.value)}
            disabled={loading}
            required
          />
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
            className="p-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Optional divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400">or</span>
          </div>
        </div>

        {/* Magic link */}
        {sent ? (
          <div className="text-sm text-gray-700 text-center">
            Check your email for the magic link.
          </div>
        ) : (
          <form onSubmit={handleMagic} className="grid gap-3">
            <label className="text-sm font-medium text-gray-700">
              Magic link
            </label>
            <input
              className="p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="email"
              placeholder="you@example.com"
              value={emailMagic}
              onChange={(e) => setEmailMagic(e.target.value)}
              disabled={loading}
              required
            />
            <button
              className="p-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        {err && <div className="text-red-600 text-sm text-center">{err}</div>}

        <p className="text-xs text-gray-400 text-center mt-2">
          By continuing you agree to our terms.
        </p>
      </div>
    </div>
  );
}
