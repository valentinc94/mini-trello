import React, { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, rightElement, className = "", id, ...props }) => {
  const inputId = id || props.name;
  
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={`w-full rounded-xl border px-4 py-3 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-[3px] focus:ring-blue-500/30 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm ${
            error ? "border-red-500 bg-red-50 focus:ring-red-500/30" : "border-gray-200 bg-white hover:border-gray-300"
          } ${rightElement ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
