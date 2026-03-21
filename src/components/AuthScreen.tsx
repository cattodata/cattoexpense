"use client";

import { useState } from "react";
import { LogIn, UserPlus, Loader2, ShieldCheck } from "lucide-react";
import { login, register } from "@/lib/auth";
import type { User } from "@/lib/auth";

interface AuthScreenProps {
  onAuth: (user: User) => void;
  onSkip: () => void;
}

export default function AuthScreen({ onAuth, onSkip }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let user: User;
      if (mode === "login") {
        user = await login(username.trim(), password);
      } else {
        if (!displayName.trim()) {
          throw new Error("Please enter your display name");
        }
        user = await register(username.trim(), displayName.trim(), password);
      }
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] font-[family-name:var(--font-jakarta)] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--catto-primary-20)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-sm font-bold text-[var(--catto-slate-900)]">
              CE
            </div>
            <span className="text-lg font-extrabold tracking-tight text-[var(--catto-slate-900)]">CattoExpense</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--catto-green-600)]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-bold hidden sm:inline">100% Local Processing</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Welcome */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[var(--catto-primary)] flex items-center justify-center text-2xl font-black text-[var(--catto-slate-900)] mx-auto mb-4">
              🐱
            </div>
            <h1 className="text-3xl font-black text-[var(--catto-slate-900)]">
              {mode === "login" ? "Welcome Back! 😸" : "Join CattoExpense! 🐾"}
            </h1>
            <p className="text-[var(--catto-slate-500)] mt-2">
              {mode === "login"
                ? "Sign in to see your analysis history"
                : "Create an account to save your analyses"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[var(--catto-slate-100)] shadow-xl p-6 space-y-4">
            {/* Mode Toggle */}
            <div className="flex rounded-full bg-[var(--catto-slate-50)] p-1">
              <button
                onClick={() => { setMode("login"); setError(null); }}
                aria-pressed={mode === "login"}
                className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-full text-sm font-bold transition-all ${
                  mode === "login"
                    ? "bg-white shadow-sm text-[var(--catto-slate-900)]"
                    : "text-[var(--catto-slate-400)] hover:text-[var(--catto-slate-600)]"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </button>
              <button
                onClick={() => { setMode("register"); setError(null); }}
                aria-pressed={mode === "register"}
                className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-full text-sm font-bold transition-all ${
                  mode === "register"
                    ? "bg-white shadow-sm text-[var(--catto-slate-900)]"
                    : "text-[var(--catto-slate-400)] hover:text-[var(--catto-slate-600)]"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" /> Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--catto-slate-700)] mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your_username"
                  required
                  className="w-full rounded-lg border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none"
                />
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--catto-slate-700)] mb-1">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name 🐱"
                    required
                    className="w-full rounded-lg border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--catto-slate-700)] mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-[var(--catto-primary-20)] px-3 py-2.5 text-sm text-[var(--catto-slate-800)] focus:ring-2 focus:ring-[var(--catto-primary)] focus:border-[var(--catto-primary)] outline-none"
                />
                {mode === "register" && (
                  <div className="mt-1.5">
                    {password.length === 0 ? (
                      <p className="text-xs text-[var(--catto-slate-400)]">Minimum 8 characters</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((i) => {
                            const strength = password.length < 8 ? 0 : password.length < 10 ? 1 : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3 : 2;
                            const colors = ["bg-[var(--catto-red-400)]", "bg-[var(--catto-orange-400)]", "bg-[var(--catto-blue-400)]", "bg-[var(--catto-green-500)]"];
                            return <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength - 1] : "bg-[var(--catto-slate-200)]"}`} />;
                          })}
                        </div>
                        <p className="text-xs text-[var(--catto-slate-400)]">
                          {password.length < 8 ? "Too short — minimum 8 characters" : password.length < 10 ? "Weak — try longer" : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? "Strong" : /[A-Z]/.test(password) && /[0-9]/.test(password) ? "Good — add symbols for stronger" : "Fair — add uppercase & numbers"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-[var(--catto-red-600)] bg-[var(--catto-red-50)] rounded-xl px-4 py-2 border border-[var(--catto-red-100)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full catto-btn-primary justify-center py-2.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {mode === "login" ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  <>
                    {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {mode === "login" ? "Sign In" : "Create Account"}
                  </>
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--catto-slate-100)]" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-[var(--catto-slate-400)]">or</span></div>
            </div>

            <button
              onClick={onSkip}
              className="w-full catto-btn-secondary justify-center py-2.5 text-sm"
            >
              Continue without account 🐾
            </button>
          </div>

          <p className="text-center text-xs text-[var(--catto-slate-400)] mt-4">
            All data is stored locally in your browser — nothing is sent to any server 🔒
          </p>
        </div>
      </main>
    </div>
  );
}
