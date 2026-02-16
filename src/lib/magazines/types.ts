export type ContributorRole = 'Author' | 'Co-Author' | 'Writer' | 'Designer' | 'Editor' | 'Photographer' | 'vBlog Author' | 'Treasury';

export interface ContributorShare {
    address: string;
    role: ContributorRole;
    sharePercentage: number;
}

export interface MagazineIssue {
    id: string;
    issueNumber: number;
    title: string;
    description: string;
    priceKAS: number;
    publishDate: string;
    coverImage: string;
    previewImages: string[];
    cid: string; // CID of the full content (PDF or modular content)
    contributors: ContributorShare[];
    status: 'draft' | 'published';
    tags: string[];
    category: string;
    isPurchased?: boolean; // Client-side hydration
    treasuryPercentage: number; // Percentage allocated to Kasparex Treasury
}

export interface Magazine {
    id: string;
    slug: string;
    name: string;
    description: string;
    author: string;
    ownerAddress: string; // Wallet address of the magazine owner
    coverImage: string;
    category: string;
    totalIssues: number;
}

export type MagazineSortOption = 'newest' | 'oldest' | 'price-low-high' | 'price-high-low' | 'alphabetical-az' | 'alphabetical-za';
