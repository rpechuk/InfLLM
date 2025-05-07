import ChatPane from "@/components/ChatPane";
import Pane from "@/components/Pane";

export default function Home() {
  return (
    <div className="h-screen w-full bg-gray-100 dark:bg-[#101014] flex flex-col flex-1 p-4">
      <div className="w-full flex gap-8 px-6 flex-1 h-full">
        <Pane className="w-1/2 h-full flex-1"><ChatPane /></Pane>
        <div className="w-1/2 h-full flex flex-col gap-4">
          <Pane className="h-1/2">
            <div className="flex w-full h-full justify-center items-center">
              <h1 className="text-2xl font-bold">PLACEHOLDER 1</h1>
            </div>
          </Pane>
          <Pane className="h-1/2">
            <div className="flex w-full h-full justify-center items-center">
              <h1 className="text-2xl font-bold">PLACEHOLDER 2</h1>
            </div>
          </Pane>
        </div>
      </div>
    </div>
  );
}
