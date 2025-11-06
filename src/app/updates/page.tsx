'use client';

import { useState, useRef } from 'react';
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Development Timeline
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-8">
            Track website developments, tasks, ideas, and bug fixes. Updates automatically refresh every 30 seconds.
          </p>
          
          <div className="mb-8">
            <UpdatesEditor
              ref={editorRef}
              onEntryAdded={handleEntryAdded}
              onEntryUpdated={handleEntryUpdated}
              onEntryDeleted={handleEntryDeleted}
            />
          </div>

          <div key={refreshKey}>
            <UpdatesTimeline onEdit={handleEdit} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

