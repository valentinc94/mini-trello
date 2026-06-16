import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = "error", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-green-50 dark:bg-green-900/30",
    error: "bg-red-50 dark:bg-red-900/30",
    info: "bg-blue-50 dark:bg-blue-900/30",
  }[type];

  const textColor = {
    success: "text-green-800 dark:text-green-300",
    error: "text-red-800 dark:text-red-300",
    info: "text-blue-800 dark:text-blue-300",
  }[type];

  const borderColor = {
    success: "border-green-200 dark:border-green-800",
    error: "border-red-200 dark:border-red-800",
    info: "border-blue-200 dark:border-blue-800",
  }[type];

  const icon = {
    success: (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[type];

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-300 ${bgColor} ${borderColor}`}>
      {icon}
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      <button onClick={onClose} className={`ml-2 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${textColor}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
