'use client';

import { ChroniclesFilterDropdown } from '@/components/chronicles/ChroniclesFilterDropdown';

export type VBlogSortOption =
    | 'newest'
    | 'oldest'
    | 'alphabetical-az'
    | 'alphabetical-za';

interface VBlogSortFiltersProps {
    sortBy: VBlogSortOption;
    onSortChange: (sort: VBlogSortOption) => void;
}

export function VBlogSortFilters({ sortBy, onSortChange }: VBlogSortFiltersProps) {
    return (
        <ChroniclesFilterDropdown
            ariaLabel="Sort articles"
            value={sortBy}
            onChange={(v) => onSortChange((v || 'newest') as VBlogSortOption)}
            allLabel="Newest first"
            options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
                { value: 'alphabetical-az', label: 'Title A-Z' },
                { value: 'alphabetical-za', label: 'Title Z-A' },
            ]}
            minWidthClassName="min-w-[180px]"
        />
    );
}
