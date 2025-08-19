"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils"; // se já tiver util de classNames

export default function AppAlert({ 
  type = "info", 
  title, 
  message, 
  onClose 
}) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    error: <AlertCircle className="h-5 w-5 text-red-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  // Fecha sozinho após 4s
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={cn(
        "fixed top-5 right-5 z-50 w-[90%] max-w-sm rounded-lg border p-4 shadow-lg animate-in fade-in slide-in-from-top-2",
        styles[type]
      )}
    >
      <div className="flex items-start gap-3">
        {icons[type]}
        <div className="flex-1">
          {title && <div className="font-semibold">{title}</div>}
          {message && <p className="text-sm">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
