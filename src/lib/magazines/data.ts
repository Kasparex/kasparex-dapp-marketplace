'use client';

import { Magazine, MagazineIssue } from './types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

const STORAGE_KEYS = {
    magazines: 'kasparex_magazines',
    issues: 'kasparex_magazine_issues',
    purchased: 'kasparex_purchased_issues',
} as const;

/**
 * Get all magazines
 */
export function getAllMagazines(): Magazine[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.magazines);
        if (!stored) return getDefaultMagazines();
        return JSON.parse(stored);
    } catch (error) {
        console.error('Error loading magazines:', error);
        return getDefaultMagazines();
    }
}

/**
 * Get magazine by slug
 */
export function getMagazineBySlug(slug: string): Magazine | null {
    const magazines = getAllMagazines();
    return magazines.find(m => m.slug === slug) || null;
}

/**
 * Get magazines by owner address
 */
export function getMagazinesByOwner(address: string): Magazine[] {
    const magazines = getAllMagazines();
    let needle: string;
    try {
        needle = normalizeKaspaAddress(address).toLowerCase();
    } catch {
        needle = address.trim().toLowerCase();
    }
    return magazines.filter((m) => {
        try {
            return normalizeKaspaAddress(m.ownerAddress).toLowerCase() === needle;
        } catch {
            return false;
        }
    });
}

/**
 * Get issues for a magazine
 */
export function getIssuesForMagazine(magazineId: string): MagazineIssue[] {
    if (typeof window === 'undefined') return [];

    try {
        const stored = localStorage.getItem(STORAGE_KEYS.issues);
        const allIssues: MagazineIssue[] = stored ? JSON.parse(stored) : getDefaultIssues();

        // Filter by magazine ID and check purchase status
        const purchased = getPurchasedIssueIds();

        return allIssues
            .filter(issue => issue.id.startsWith(magazineId))
            .map(issue => ({
                ...issue,
                isPurchased: purchased.includes(issue.id)
            }))
            .sort((a, b) => b.issueNumber - a.issueNumber);
    } catch (error) {
        console.error('Error loading issues:', error);
        return [];
    }
}

/**
 * Get purchased issue IDs
 */
export function getPurchasedIssueIds(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.purchased);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        return [];
    }
}

/**
 * Mark an issue as purchased
 */
export function markIssueAsPurchased(issueId: string): void {
    if (typeof window === 'undefined') return;
    const purchased = getPurchasedIssueIds();
    if (!purchased.includes(issueId)) {
        purchased.push(issueId);
        localStorage.setItem(STORAGE_KEYS.purchased, JSON.stringify(purchased));
    }
}

function slugifyMagazineSlug(input: string): string {
    return input
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

/**
 * Highest issueNumber for magazineId (0 if none yet).
 */
export function nextIssueNumberForMagazine(magazineId: string): number {
    const issues = getIssuesForMagazine(magazineId);
    const max = issues.reduce((a, x) => Math.max(a, x.issueNumber), 0);
    return max + 1;
}

/**
 * Persist a magazine publication (creator flow). Merges into localStorage catalogs.
 */
export function savePublishedMagazineIssue(magazine: Magazine, issue: MagazineIssue): void {
    if (typeof window === 'undefined') return;

    const magazinesRaw = [...getAllMagazines()];
    const ix = magazinesRaw.findIndex((m) => m.id === magazine.id || m.slug === magazine.slug);
    const nextTotals = Math.max(ix >= 0 ? magazinesRaw[ix]!.totalIssues : 0, issue.issueNumber);
    const mergedMag: Magazine =
        ix >= 0 ? { ...magazinesRaw[ix]!, ...magazine, totalIssues: Math.max(nextTotals, magazine.totalIssues) } : { ...magazine };
    if (ix >= 0) magazinesRaw[ix] = mergedMag;
    else magazinesRaw.push({ ...mergedMag });

    localStorage.setItem(STORAGE_KEYS.magazines, JSON.stringify(magazinesRaw));

    const storedIssues = localStorage.getItem(STORAGE_KEYS.issues);
    const fallback = storedIssues ? (JSON.parse(storedIssues) as MagazineIssue[]) : getDefaultIssues();
    const list: MagazineIssue[] = Array.isArray(fallback) ? [...fallback] : getDefaultIssues();
    const ji = list.findIndex((i) => i.id === issue.id);
    const entry: MagazineIssue = { ...issue, status: 'published' };
    if (ji >= 0) list[ji] = entry;
    else list.push(entry);
    localStorage.setItem(STORAGE_KEYS.issues, JSON.stringify(list));
}

/** Create or reuse a slugged magazine heading for dashboard ownership. */
export function buildMagazineStubForSlug(args: {
    slug: string;
    displayName: string;
    ownerNorm: string;
}): Magazine {
    const slugCandidate = slugifyMagazineSlug(args.slug || args.displayName || 'magazine');
    const slug = slugCandidate || `zine-${Math.random().toString(36).slice(2, 9)}`;
    const ownerKey = args.ownerNorm.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(-8) || Math.random().toString(36).slice(2, 8);
    const id = `mag-${slug.replace(/-/g, '')}-${ownerKey}`;
    return {
        id,
        slug,
        name: args.displayName.trim() || args.slug.trim() || 'My magazine',
        description: '',
        author: args.ownerNorm,
        ownerAddress: args.ownerNorm,
        coverImage: '/img/magazines/kaspa-insider-cover.jpg',
        category: 'Creator',
        totalIssues: 0,
    };
}

/**
 * Default magazines for initial state
 */
function getDefaultMagazines(): Magazine[] {
    return [
        {
            id: 'mag-kaspa-insider',
            slug: 'kaspa-insider',
            name: 'Kaspa Insider',
            description: 'The premier magazine for deep dives into Kaspa technology, ecosystem growth, and community spotlights.',
            author: 'Kasparex Editorial',
            ownerAddress: 'kaspa:qeditorial_treasury',
            coverImage: '/img/magazines/kaspa-insider-cover.jpg',
            category: 'Ecosystem',
            totalIssues: 3,
        },
        {
            id: 'mag-crypto-future',
            slug: 'crypto-future',
            name: 'Crypto Future',
            description: 'Exploring the intersection of BlockDAG, Layer 2 solutions, and the future of decentralized finance.',
            author: 'Crypto Insights Team',
            ownerAddress: 'kaspa:qinsights_team',
            coverImage: '/img/magazines/crypto-future-cover.jpg',
            category: 'Technology',
            totalIssues: 1,
        },
        {
            id: 'mag-krc20',
            slug: 'krc20-magazine',
            name: 'KRC20 Magazine',
            description: 'The ultimate insider\'s guide to the ever-evolving world of the Kaspa network, curated by the legendary Krex himself.',
            author: 'Krex',
            ownerAddress: 'kaspa:qkrex_official',
            coverImage: '/img/magazines/krc20-cover.jpg',
            category: 'KRC20',
            totalIssues: 1,
        }
    ];
}

/**
 * Default issues for initial state
 */
function getDefaultIssues(): MagazineIssue[] {
    return [
        {
            id: 'mag-kaspa-insider-1',
            issueNumber: 1,
            title: 'Genesis: The Rise of Kaspa',
            description: 'In-depth coverage of Kaspa launch, the GHOSTDAG protocol, and the vision for the fastest BlockDAG.',
            priceKAS: 10,
            publishDate: '2025-10-15T12:00:00Z',
            coverImage: '/img/magazines/kaspa-insider-cover.jpg',
            previewImages: ['/img/magazines/preview-1.jpg', '/img/magazines/preview-2.jpg'],
            cid: 'QmGenesisKaspaIssue1',
            contributors: [
                { address: 'kaspa:qauthor1', role: 'Author', sharePercentage: 50 },
                { address: 'kaspa:qeditor1', role: 'Editor', sharePercentage: 25 },
                { address: 'kaspa:qdesigner1', role: 'Designer', sharePercentage: 20 },
                { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
            ],
            status: 'published',
            tags: ['history', 'ghostdag', 'mining'],
            category: 'Ecosystem',
            treasuryPercentage: 5,
        },
        {
            id: 'mag-kaspa-insider-2',
            issueNumber: 2,
            title: 'The 10 BPS Era',
            description: 'Technical deep dive into the 10 blocks per second upgrade and what it means for scalability.',
            priceKAS: 15,
            publishDate: '2026-01-20T12:00:00Z',
            coverImage: '/img/magazines/kaspa-insider-cover.jpg',
            previewImages: ['/img/magazines/preview-3.jpg'],
            cid: 'Qm10BPSEraIssue2',
            contributors: [
                { address: 'kaspa:qauthor2', role: 'Author', sharePercentage: 55 },
                { address: 'kaspa:qdesigner1', role: 'Designer', sharePercentage: 40 },
                { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
            ],
            status: 'published',
            tags: ['scalability', 'performance', 'mainnet'],
            category: 'Technology',
            treasuryPercentage: 5,
        },
        {
            id: 'mag-krc20-1',
            issueNumber: 1,
            title: 'Welcome to KRC20',
            description: 'Discover the world of KRC20 tokens, the legends behind them, and how to get started in the new era of Kaspa.',
            priceKAS: 20,
            publishDate: '2026-02-06T12:00:00Z',
            coverImage: '/img/magazines/krc20-cover.jpg',
            previewImages: ['/img/magazines/krc20-cover.jpg'],
            cid: 'QmKRC20Issue1',
            contributors: [
                { address: 'kaspa:qkrex', role: 'Author', sharePercentage: 95 },
                { address: 'kaspa:qtreasury123', role: 'Treasury', sharePercentage: 5 },
            ],
            status: 'published',
            tags: ['krc20', 'krex', 'guide'],
            category: 'KRC20',
            treasuryPercentage: 5,
        }
    ];
}
