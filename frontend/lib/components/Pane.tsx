import React from "react";

interface PaneProps {
  children: React.ReactNode;
  className?: string;
}

export default function Pane({ children, className = "" }: PaneProps) {
  return (
    <div
      className={`bg-background relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-700 shadow-lg dark:bg-[#18181b] ${className}`}
    >
      {children}
    </div>
  );
}
