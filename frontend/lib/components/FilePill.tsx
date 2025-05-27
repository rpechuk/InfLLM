import { FaFileAlt, FaTimes } from "react-icons/fa";
import { FaFloppyDisk } from "react-icons/fa6";
import { useState, useEffect } from "react";
import MarkdownRenderer from "./MarkdownRenderer";

interface FilePillProps {
  name: string;
  onRemove?: () => void;
  inline?: boolean;
  iconType?: 'file' | 'floppy';
  fileContent?: string | (() => Promise<string>);
}

export default function FilePill({ 
  name, 
  onRemove, 
  inline = false, 
  iconType = 'file',
  fileContent 
}: FilePillProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const IconComponent = iconType === 'floppy' ? FaFloppyDisk : FaFileAlt;
  const isMarkdownFile = name.toLowerCase().match(/\.(md|markdown|txt)$/);

  const loadContent = async () => {
    if (!fileContent) return;
    
    if (typeof fileContent === 'string') {
      setContent(fileContent);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await fileContent();
      setContent(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileContent) {
      setShowModal(true);
      setShowViewer(false);
      await loadContent();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setContent('');
    setError(null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  // Load content for hover preview if it's a string
  useEffect(() => {
    if (showViewer && typeof fileContent === 'string') {
      setContent(fileContent);
    }
  }, [showViewer, fileContent]);

  const renderContent = (size: 'small' | 'large') => {
    const textSize = size === 'small' ? 'text-xs' : 'text-sm';
    
    if (isLoading) {
      return (
        <div className={`${textSize} text-gray-400 flex items-center justify-center py-8`}>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <span className="ml-2">Loading...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className={`${textSize} text-red-400 flex items-center justify-center py-8`}>
          <span>Error: {error}</span>
        </div>
      );
    }
    
    if (isMarkdownFile && content) {
      return (
        <div className={`${textSize} leading-relaxed`}>
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>
      );
    }
    
    return (
      <pre className={`${textSize} text-gray-300 whitespace-pre-wrap font-mono leading-relaxed`}>
        {content || ''}
      </pre>
    );
  };

  const hasContent = fileContent !== undefined;
  const canShowHoverPreview = hasContent && typeof fileContent === 'string';

  return (
    <>
      <div 
        className="relative"
        onMouseEnter={() => canShowHoverPreview && setShowViewer(true)}
        onMouseLeave={() => setShowViewer(false)}
      >
        {/* Hover Viewer - only show for string content */}
        {showViewer && canShowHoverPreview && !inline && (
          <div 
            className="absolute bottom-full left-0 mb-2 w-[35vw] max-h-60 bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-50 overflow-hidden cursor-pointer"
            onClick={openModal}
          >
            <div className="bg-gray-800 px-3 py-2 border-b border-gray-600 flex items-center justify-between">
              <span className="text-gray-200 text-sm font-medium truncate">{name}</span>
              <span className="text-gray-400 text-xs ml-2 whitespace-nowrap">Click to expand</span>
            </div>
            <div className="p-3 max-h-48 overflow-hidden">
              {renderContent('small')}
            </div>
          </div>
        )}
        
        {/* File Pill */}
        <span 
          className={`inline-flex items-center bg-gray-800 text-gray-100 rounded-full border border-gray-700 group transition-all ${
            hasContent ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'
          } ${
            inline ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'
          } mr-2 mb-2 shadow`}
          onClick={hasContent ? openModal : undefined}
        >
          <IconComponent className={`${iconType === 'floppy' ? 'text-green-300' : 'text-blue-300'} ${inline ? 'text-xs mr-1.5' : 'text-sm mr-2'}`} />
          <span className={`font-mono max-w-[120px] truncate`} title={name}>
            {name}
          </span>
          {!inline && onRemove && (
            <button
              type="button"
              className="ml-2 p-0.5 text-gray-400 hover:text-red-400 transition-all rounded-full hover:bg-gray-600 flex items-center justify-center"
              aria-label={`Remove ${name}`}
              onClick={handleRemove}
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </span>
      </div>

      {/* Modal */}
      {showModal && hasContent && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl max-w-[80vw] w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-600 flex items-center justify-between">
              <span className="text-gray-200 text-lg font-medium truncate">{name}</span>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-200 rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <FaTimes className="text-lg" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(80vh-4rem)] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {renderContent('large')}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 