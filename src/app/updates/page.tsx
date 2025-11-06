'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UpdatesTimeline } from '@/components/UpdatesTimeline';
import { UpdatesEditor, type UpdatesEditorHandle } from '@/components/UpdatesEditor';
import type { TimelineEntry, Category } from '@/lib/updates';

export default function UpdatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const editorRef = useRef<UpdatesEditorHandle>(null);

  const handleEdit = (entry: TimelineEntry, category: Category) => {
    editorRef.current?.openEditForm(entry, category);
  };

  const handleEntryAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEntryUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEntryDeleted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Development Timeline
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Track website developments, tasks, ideas, and bug fixes. Deployments are automatically tracked via GitHub Actions when you push to main.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap"
            >
              ← Back to Categories
            </Link>
          </div>
          
          <div className="mb-8">
            <UpdatesEditor
              ref={editorRef}
              onEntryAdded={handleEntryAdded}
              onEntryUpdated={handleEntryUpdated}
              onEntryDeleted={handleEntryDeleted}
            />
          </div>

          <UpdatesTimeline onEdit={handleEdit} refreshKey={refreshKey} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

