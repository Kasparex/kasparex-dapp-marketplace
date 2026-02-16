'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DevelopmentSidebar } from '@/components/updates/DevelopmentSidebar';
import { UpdatesTimeline } from '@/components/UpdatesTimeline';
import { UpdatesEditor, type UpdatesEditorHandle } from '@/components/UpdatesEditor';
import type { TimelineEntry, Category } from '@/lib/updates';

export default function UpdatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const editorRef = useRef<UpdatesEditorHandle>(null);
  
  // Check if editing is enabled (only for admins)
  const isEditingEnabled = process.env.NEXT_PUBLIC_ENABLE_TIMELINE_EDITING === 'true';

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
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          <DevelopmentSidebar />
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Development Timeline
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8">
                Track website developments, tasks, ideas, and bug fixes. Deployments are automatically tracked via GitHub Actions when you push to main.
              </p>
              
              <div className="mb-8">
                <UpdatesEditor
                  ref={editorRef}
                  onEntryAdded={handleEntryAdded}
                  onEntryUpdated={handleEntryUpdated}
                  onEntryDeleted={handleEntryDeleted}
                />
              </div>

              <UpdatesTimeline 
                onEdit={isEditingEnabled ? handleEdit : undefined} 
                refreshKey={refreshKey}
                showEditButton={isEditingEnabled}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

