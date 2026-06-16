"use client";

import React, { useState } from "react";
import { AuthService } from "@/services/auth.service";

export const LogoutButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setIsLoading(false);
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <svg className="w-5 h-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      {isLoading ? "Logging out..." : "Log out"}
    </button>
  );
};
