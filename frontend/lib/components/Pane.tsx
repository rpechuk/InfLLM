import React from "react";

interface PaneProps {
  children: React.ReactNode;
  className?: string;
}

export default function Pane({ children, className = "" }: PaneProps) {
  return (
    <div
      className={`bg-background dark:bg-[#18181b] rounded-xl shadow-lg border border-gray-700 flex flex-col w-full h-full overflow-hidden relative ${className}`}
    >
      {children}
    </div>
  );
} 