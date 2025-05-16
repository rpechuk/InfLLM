"use client";

import React, { useState } from "react";
import ChatPane from "@/components/ChatPane";
import Pane from "@/components/Pane";
import ContextManagerPanel from "@/components/ContextManagerPanel";

export default function Home() {
  const [chatFinishedCount, setChatFinishedCount] = useState(0);

  // This function will be called by ChatPane when a chat finishes
  const handleChatFinished = () => {
    setChatFinishedCount((c) => c + 1);
  };

  return (
    <div className="flex h-screen w-full flex-1 flex-col bg-gray-100 p-4 dark:bg-[#101014]">
      <div className="flex h-full w-full flex-1 gap-8 px-6">
        <Pane className="h-full w-7/12 flex-1">
          <ChatPane onChatFinished={handleChatFinished} />
        </Pane>
        <div className="flex h-full w-5/12 flex-col gap-4">
          <ContextManagerPanel refreshSignal={chatFinishedCount} />
        </div>
      </div>
    </div>
  );
}
