import React, { useState } from "react";
import { authService } from "../services/firebase";
import { Sparkles, ArrowRight, Lock, Mail } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      // This helper tries to login, and if user doesn't exist, registers them
      const user = await authService.loginOrRegister(email, password);
      if (user.email) {
        onLoginSuccess(user.email);
      }
    } catch (err: any) {
      console.error("Auth failed", err);
      let msg = "Authentication failed. Please check your credentials.";
      if (err.code === "auth/weak-password")
        msg = "Password should be at least 6 characters.";
      if (err.code === "auth/invalid-email") msg = "Invalid email address.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-white/50 p-8 md:p-12 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-gemini-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-gemini-200">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Salt Analysis
          </h1>
          <p className="text-slate-500">Sign in to track your progress.</p>
          <p className="text-xs text-slate-400 mt-1">
            If you don't have an account, one will be created for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 ml-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                id="email"
                required
                className="w-full pl-10 pr-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none transition-all"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="pass"
              className="block text-sm font-medium text-slate-700 ml-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                id="pass"
                required
                minLength={6}
                className="w-full pl-10 pr-5 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-gemini-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-gemini-600 text-white font-semibold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-slate-200 mt-2"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
