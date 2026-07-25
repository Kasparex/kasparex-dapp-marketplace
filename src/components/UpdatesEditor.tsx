'use client';

import { useState, useImperativeHandle, forwardRef } from 'react';
import type { TimelineEntry, Category, EntryType, EntryStatus, EntryPriority } from '@/lib/updates';
import { getCategoryLabel } from '@/lib/updates';
import { useKxSystemDialog } from '@/hooks/useKxSystemDialog';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';

interface UpdatesEditorProps {
  onEntryAdded?: () => void;
  onEntryUpdated?: () => void;
  onEntryDeleted?: () => void;
}

export interface UpdatesEditorHandle {
  openEditForm: (entry: TimelineEntry, category: Category) => void;
}

export const UpdatesEditor = forwardRef<UpdatesEditorHandle, UpdatesEditorProps>(
  ({ onEntryAdded, onEntryUpdated, onEntryDeleted }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ entry: TimelineEntry; category: Category } | null>(null);
  const [category, setCategory] = useState<Category>('updates');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EntryType>('other');
  const [status, setStatus] = useState<EntryStatus | ''>('');
  const [priority, setPriority] = useState<EntryPriority | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { confirm, alert } = useKxSystemDialog();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('other');
    setStatus('');
    setPriority('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingEntry(null);
    setCategory('updates');
  };

  const openAddForm = (cat: Category) => {
    resetForm();
    setCategory(cat);
    setIsOpen(true);
  };

  const openEditForm = (entry: TimelineEntry, cat: Category) => {
    setEditingEntry({ entry, category: cat });
    setCategory(cat);
    setTitle(entry.title);
    setDescription(entry.description);
    setType(entry.type);
    setStatus(entry.status || '');
    setPriority(entry.priority || '');
    setDate(entry.date.split('T')[0]);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      await alert({
        title: 'Missing fields',
        message: 'Title and description are required.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const entryData: Partial<TimelineEntry> = {
        title: title.trim(),
        description: description.trim(),
        type,
        date: new Date(date).toISOString(),
        ...(status && { status: status as EntryStatus }),
        ...(priority && { priority: priority as EntryPriority }),
      };

      if (editingEntry) {
        // Update existing entry
        const response = await fetch('/api/updates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            id: editingEntry.entry.id,
            entry: entryData,
          }),
        });

        const result = await response.json();
        if (result.success) {
          onEntryUpdated?.();
          setIsOpen(false);
          resetForm();
        } else {
          await alert({
            title: 'Update failed',
            message: result.error || 'Failed to update entry',
          });
        }
      } else {
        // Add new entry
        const response = await fetch('/api/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            entry: entryData,
          }),
        });

        const result = await response.json();
        if (result.success) {
          onEntryAdded?.();
          setIsOpen(false);
          resetForm();
        } else {
          await alert({
            title: 'Add failed',
            message: result.error || 'Failed to add entry',
          });
        }
      }
    } catch (error: any) {
      await alert({
        title: 'Error',
        message: error.message || 'An error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingEntry) return;
    const ok = await confirm({
      title: 'Delete entry',
      message: 'Are you sure you want to delete this entry?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/updates?category=${category}&id=${editingEntry.entry.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        onEntryDeleted?.();
        setIsOpen(false);
        resetForm();
      } else {
        await alert({
          title: 'Delete failed',
          message: result.error || 'Failed to delete entry',
        });
      }
    } catch (error: any) {
      await alert({
        title: 'Error',
        message: error.message || 'An error occurred',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Expose openEditForm to parent via ref
  useImperativeHandle(ref, () => ({
    openEditForm,
  }));

  const entryTypes: EntryType[] = ['deployment', 'feature', 'improvement', 'fix', 'other'];
  const statuses: EntryStatus[] = ['completed', 'in-progress', 'pending'];
  const priorities: EntryPriority[] = ['high', 'medium', 'low'];
  const categories: Category[] = ['updates', 'tasks', 'ideas', 'bugFixes'];

  // Check if editing is enabled (only show for admins)
  const isEditingEnabled = process.env.NEXT_PUBLIC_ENABLE_TIMELINE_EDITING === 'true';

  if (!isEditingEnabled) {
    return null; // Hide editor completely for regular users
  }

  return (
    <>
      {/* Add Entry Buttons */}
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => openAddForm(cat)}
            className="px-4 py-2 bg-[#02abb8] hover:bg-[#0299a6] text-white rounded-lg transition-colors text-sm font-medium"
          >
            + Add {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      {/* Editor Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Category
                </label>
                <KxFormDropdown
                  ariaLabel="Entry category"
                  value={category}
                  onChange={(next) => setCategory(next as Category)}
                  options={categories.map((cat) => ({
                    value: cat,
                    label: getCategoryLabel(cat),
                  }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
                  required
                  placeholder="Enter title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
                  required
                  placeholder="Enter description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Type
                  </label>
                  <KxFormDropdown
                    ariaLabel="Entry type"
                    value={type}
                    onChange={(next) => setType(next as EntryType)}
                    options={entryTypes.map((t) => ({
                      value: t,
                      label: t.charAt(0).toUpperCase() + t.slice(1),
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {(category === 'tasks' || category === 'bugFixes') && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Status
                  </label>
                  <KxFormDropdown
                    ariaLabel="Entry status"
                    value={status}
                    onChange={(next) => setStatus(next as EntryStatus | '')}
                    placeholder="None"
                    options={[
                      { value: '', label: 'None' },
                      ...statuses.map((s) => ({
                        value: s,
                        label: s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' '),
                      })),
                    ]}
                  />
                </div>
              )}

              {(category === 'tasks' || category === 'ideas' || category === 'bugFixes') && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Priority
                  </label>
                  <KxFormDropdown
                    ariaLabel="Entry priority"
                    value={priority}
                    onChange={(next) => setPriority(next as EntryPriority | '')}
                    placeholder="None"
                    options={[
                      { value: '', label: 'None' },
                      ...priorities.map((p) => ({
                        value: p,
                        label: p.charAt(0).toUpperCase() + p.slice(1),
                      })),
                    ]}
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  {editingEntry && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#02abb8] hover:bg-[#0299a6] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingEntry ? 'Update' : 'Add Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

UpdatesEditor.displayName = 'UpdatesEditor';

