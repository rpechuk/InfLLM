import React, { useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      className="ml-2 px-2 py-0.5 text-xs bg-gray-700 text-white rounded hover:bg-gray-600 focus:outline-none"
      onClick={async (e) => {
        e.preventDefault();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title="Copy code to clipboard"
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const markdownComponents = {
  code({ node, className, children, ...props }: React.ComponentProps<"code"> & { node?: any }) {
    const codeString = String(children).replace(/\n$/, "");
    // Treat as code block if multi-line (contains a newline)
    if (codeString.includes('\n')) {
      const match = /language-(\w+)/.exec(className || "");
      return (
        <div className="relative group my-1">
          <SyntaxHighlighter
            style={oneDark}
            language={match ? match[1] : undefined}
            PreTag="div"
            customStyle={{ margin: 0, borderRadius: "0.5rem", background: "#282c34" }}
          >
            {codeString}
          </SyntaxHighlighter>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={codeString} />
          </div>
        </div>
      );
    }
    // Otherwise, treat as inline code (single line)
    return (
      <code className="rounded bg-gray-800 px-1 py-0.5 text-pink-300 align-baseline" style={{ margin: 0, fontFamily: 'inherit', fontSize: '0.95em', fontWeight: 500, letterSpacing: '0.01em' }} {...props}>
        {children}
      </code>
    );
  },
  p({ children, ...props }: any) {
    if (
      Array.isArray(children) &&
      children.length === 1 &&
      ["pre", "blockquote", "hr", "ul", "ol"].includes((children[0] as any)?.type)
    ) {
      return <>{children}</>;
    }
    return (
      <p className="mb-1 whitespace-pre-line" {...props}>
        {children}
      </p>
    );
  },
  a({ ...props }: any) {
    return (
      <a
        className="text-blue-400 underline"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  table({ ...props }: any) {
    return <table className="my-2 border border-gray-700" {...props} />;
  },
  th({ ...props }: any) {
    return (
      <th
        className="border border-gray-700 bg-gray-700 px-2 py-1"
        {...props}
      />
    );
  },
  td({ ...props }: any) {
    return <td className="border border-gray-700 px-2 py-1" {...props} />;
  },
  li({ ...props }: any) {
    return <li className="ml-4 list-disc mb-0.5" {...props} />;
  },
  ul({ ...props }: any) {
    return <ul className="mb-1 ml-6 list-disc" {...props} />;
  },
  ol({ ...props }: any) {
    return <ol className="mb-1 ml-6 list-decimal" {...props} />;
  },
  hr() {
    return <hr className="my-3 border-t-2 border-gray-500" />;
  },
  input({ type, checked, ...props }: any) {
    // For GFM checklists
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          className="mr-2 accent-blue-500"
          {...props}
        />
      );
    }
    return <input type={type} checked={checked} {...props} />;
  },
  // Headings
  h1({ children, ...props }: any) {
    return <h1 className="text-3xl font-bold mt-4 mb-2" {...props}>{children}</h1>;
  },
  h2({ children, ...props }: any) {
    return <h2 className="text-2xl font-bold mt-4 mb-2" {...props}>{children}</h2>;
  },
  h3({ children, ...props }: any) {
    return <h3 className="text-xl font-bold mt-4 mb-2" {...props}>{children}</h3>;
  },
  h4({ children, ...props }: any) {
    return <h4 className="text-lg font-bold mt-4 mb-2" {...props}>{children}</h4>;
  },
  h5({ children, ...props }: any) {
    return <h5 className="text-base font-bold mt-4 mb-2" {...props}>{children}</h5>;
  },
  h6({ children, ...props }: any) {
    return <h6 className="text-sm font-bold mt-4 mb-2" {...props}>{children}</h6>;
  },
  // Blockquote
  blockquote({ children, ...props }: any) {
    return (
      <blockquote className="border-l-4 border-gray-700 pl-4 my-0.5 h-fit text-gray-300" {...props}>
        {children}
      </blockquote>
    );
  },
};

const MarkdownRenderer: React.FC<{ children: string }> = ({ children }) => (
  <div className="font-mono text-base text-green-200">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownComponents}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default MarkdownRenderer; 