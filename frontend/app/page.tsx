import ChatPane from "@/components/ChatPane";
import Pane from "@/components/Pane";

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-1 flex-col bg-gray-100 p-4 dark:bg-[#101014]">
      <div className="flex h-full w-full flex-1 gap-8 px-6">
        <Pane className="h-full w-1/2 flex-1">
          <ChatPane />
        </Pane>
        <div className="flex h-full w-1/2 flex-col gap-4">
          <Pane className="h-1/2">
            <div className="flex h-full w-full items-center justify-center">
              <h1 className="text-2xl font-bold">PLACEHOLDER 1</h1>
            </div>
          </Pane>
          <Pane className="h-1/2">
            <div className="flex h-full w-full items-center justify-center">
              <h1 className="text-2xl font-bold">PLACEHOLDER 2</h1>
            </div>
          </Pane>
        </div>
      </div>
    </div>
  );
}
