import { FaFileAlt } from "react-icons/fa";

export default function FilePill({ name, onRemove, inline = false }: { name: string; onRemove?: () => void; inline?: boolean }) {
  return (
    <span className={`flex items-center bg-gray-800 text-gray-100 rounded-full ${inline ? 'px-2 py-0.5 text-xs' : 'px-3 py-1'} mr-2 mb-2 shadow border border-gray-700 group transition-all`}>
      <FaFileAlt className={`mr-2 text-blue-300 ${inline ? 'text-base' : 'text-lg'}`} />
      <span className={`font-mono ${inline ? 'text-xs' : 'text-xs'} max-w-[120px] truncate`} title={name}>{name}</span>
      {!inline && (
        <button
          type="button"
          className="ml-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          tabIndex={0}
        >
          ×
        </button>
      )}
    </span>
  );
} 