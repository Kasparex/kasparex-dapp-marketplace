'use client';

import { useState, useRef } from 'react';
import { DevelopmentSidebar } from '@/components/updates/DevelopmentSidebar';
import { UpdatesTimeline } from '@/components/UpdatesTimeline';
import { UpdatesEditor, type UpdatesEditorHandle } from '@/components/UpdatesEditor';
import type { TimelineEntry, Category } from '@/lib/updates';
import { HubDocPageShell } from '@/components/hub/HubDocPageShell';
import { HubListingTitleRow } from '@/components/hub/HubListingTitleRow';
import { HubBenefitsPanel } from '@/components/hub/HubBenefitsPanel';

export default function UpdatesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const editorRef = useRef<UpdatesEditorHandle>(null);

  const isEditingEnabled = process.env.NEXT_PUBLIC_ENABLE_TIMELINE_EDITING === 'true';

  const handleEdit = (entry: TimelineEntry, category: Category) => {
    editorRef.current?.openEditForm(entry, category);
  };

  return (
    <HubDocPageShell projectId="kasparex-dapps" sidebar={<DevelopmentSidebar />}>
      <HubListingTitleRow
        projectId="kasparex-dapps"
        title="Development timeline"
        count={1}
        countLabel="hub roadmap"
        benefits={<HubBenefitsPanel variant="compact" className="w-full" />}
      />
      <p className="kx-body -mt-4 mb-8 max-w-3xl">
        Track website developments, tasks, ideas, and bug fixes. Deployments are automatically tracked via GitHub Actions when you push to main.
      </p>

      <div className="mb-8">
        <UpdatesEditor
          ref={editorRef}
          onEntryAdded={() => setRefreshKey((prev) => prev + 1)}
          onEntryUpdated={() => setRefreshKey((prev) => prev + 1)}
          onEntryDeleted={() => setRefreshKey((prev) => prev + 1)}
        />
      </div>

      <UpdatesTimeline
        onEdit={isEditingEnabled ? handleEdit : undefined}
        refreshKey={refreshKey}
        showEditButton={isEditingEnabled}
      />
    </HubDocPageShell>
  );
}
