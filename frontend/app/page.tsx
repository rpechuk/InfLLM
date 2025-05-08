import ChatPane from "@/components/ChatPane";
import Pane from "@/components/Pane";
import ContextManagerPanel from "@/components/ContextManagerPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-1 flex-col bg-gray-100 p-4 dark:bg-[#101014]">
      <div className="flex h-full w-full flex-1 gap-8 px-6">
        <Pane className="h-full w-7/12 flex-1">
          <ChatPane />
        </Pane>
        <div className="flex h-full w-5/12 flex-col gap-4">
          <ContextManagerPanel />
        </div>
      </div>
    </div>
  );
}
