/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await AuthService.login(username, password);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (user: string) => {
    setUsername(user);
    setPassword("password123");
  };

  return (
    <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
      <div className="flex flex-col items-center mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(37,99,235,0.2)]">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500">Sign in to continue to your workspace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username or Email</label>
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
            <input
              autoFocus
              type="text"
              name="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400 font-medium"
              placeholder="name@company.com"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 text-slate-900 text-sm rounded-xl pl-11 pr-11 py-3 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400 font-medium"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-xs font-semibold text-center animate-in fade-in slide-in-from-top-1 bg-red-50/50 py-2 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-[0_4px_12px_rgba(37,99,235,0.1)] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-3">Quick Login (Click to fill)</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fillCredentials("demo")}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-600 transition-all active:scale-95"
          >
            demo
          </button>
          <button
            type="button"
            onClick={() => fillCredentials("jane")}
            className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-600 transition-all active:scale-95"
          >
            jane
          </button>
        </div>
      </div>
    </div>
  );
};
