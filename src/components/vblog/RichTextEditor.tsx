'use client';

import { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import react-quill to avoid SSR issues - only load on client
const ReactQuill = dynamic(
  () => {
    if (typeof window === 'undefined') {
      return Promise.resolve({ default: () => null });
    }
    return import('react-quill').catch((err) => {
      console.error('Failed to load react-quill:', err);
      return { default: () => null };
    });
  },
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-48 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading editor...</p>
      </div>
    ),
  }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  maxLength,
  disabled = false,
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(false);

  // Ensure component only renders on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load CSS only on client side using link tag injection
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      // Check if the CSS is already loaded
      const existingLink = document.getElementById('react-quill-css');
      if (!existingLink) {
        // Use local CSS file from public directory
        const link = document.createElement('link');
        link.id = 'react-quill-css';
        link.rel = 'stylesheet';
        link.href = '/quill.snow.css';
        link.onload = () => setCssLoaded(true);
        link.onerror = () => {
          // Fallback to CDN if local file fails
          const cdnLink = document.createElement('link');
          cdnLink.id = 'react-quill-css';
          cdnLink.rel = 'stylesheet';
          cdnLink.href = 'https://cdn.jsdelivr.net/npm/react-quill@2.0.0/dist/quill.snow.css';
          cdnLink.onload = () => setCssLoaded(true);
          document.head.appendChild(cdnLink);
        };
        document.head.appendChild(link);
      } else {
        setCssLoaded(true);
      }
    }
  }, [isMounted]);

  // Hooks must be called before any conditional returns
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'blockquote', 'code-block'],
        ['clean'],
      ],
    }),
    []
  );

  // Don't render until mounted on client
  if (!isMounted) {
    return (
      <div className="w-full h-48 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading editor...</p>
      </div>
    );
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'align',
    'link',
    'blockquote',
    'code-block',
  ];

  const handleChange = (content: string) => {
    // Remove HTML tags to count characters
    const textContent = content.replace(/<[^>]*>/g, '');
    if (maxLength && textContent.length > maxLength) {
      return; // Don't update if over limit
    }
    onChange(content);
  };

  // Count characters (without HTML tags)
  const characterCount = value.replace(/<[^>]*>/g, '').length;

  // Fallback to textarea if ReactQuill fails to load
  if (!isMounted || typeof window === 'undefined') {
    return (
      <div className="w-full h-48 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        className="bg-white dark:bg-zinc-900"
      />
      {maxLength && (
        <div className={`text-xs mt-2 text-right ${
          characterCount > maxLength
            ? 'text-red-500'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}>
          {characterCount} / {maxLength} characters
        </div>
      )}
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 14px;
          font-family: inherit;
          min-height: 200px;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
          color: rgb(24 24 27);
        }
        .dark .rich-text-editor .ql-editor {
          color: rgb(244 244 245);
        }
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: rgb(228 228 231);
          background: rgb(255 255 255);
        }
        .dark .rich-text-editor .ql-toolbar {
          border-color: rgb(39 39 42);
          background: rgb(24 24 27);
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: rgb(228 228 231);
        }
        .dark .rich-text-editor .ql-container {
          border-color: rgb(39 39 42);
        }
        .rich-text-editor .ql-stroke {
          stroke: rgb(63 63 70);
        }
        .dark .rich-text-editor .ql-stroke {
          stroke: rgb(161 161 170);
        }
        .rich-text-editor .ql-fill {
          fill: rgb(63 63 70);
        }
        .dark .rich-text-editor .ql-fill {
          fill: rgb(161 161 170);
        }
        .rich-text-editor .ql-picker-label {
          color: rgb(63 63 70);
        }
        .dark .rich-text-editor .ql-picker-label {
          color: rgb(161 161 170);
        }
      `}</style>
    </div>
  );
}


