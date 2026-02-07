'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompis } from '@/lib/kaspa/api';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { createProduct } from '@/lib/store/products';
import type { ProductCategory, ProductNetwork } from '@/lib/store/types';
import { useRouter } from 'next/navigation';

const LISTING_FEE_KAS = 50;
const LISTING_FEE_TREASURY = process.env.NEXT_PUBLIC_STORE_TREASURY_ADDRESS || '';

export function StoreProductForm() {
    const router = useRouter();
    const { state } = useKaspaWallet();
    const { upload } = useIPFSUpload();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        priceKAS: '',
        category: 'Software' as ProductCategory,
        network: 'L1' as ProductNetwork,
    });

    const [thumbnailCid, setThumbnailCid] = useState<string | null>(null);
    const [assetCids, setAssetCids] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<'form' | 'payment' | 'complete'>('form');

    const categories: ProductCategory[] = ['Software', 'Art', 'Music', 'Templates', 'Other'];

    const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const cid = await upload(file, { filename: file.name });
        if (cid) setThumbnailCid(cid);
    };

    const handleAssetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const cids: string[] = [];
        for (const file of files) {
            const cid = await upload(file, { filename: file.name });
            if (cid) cids.push(cid);
        }
        setAssetCids((prev) => [...prev, ...cids]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.priceKAS || !thumbnailCid || !state.isConnected) return;

        setIsProcessing(true);
        setStep('payment');

        try {
            const sompiAmount = kasToSompis(LISTING_FEE_KAS);
            const result = await sendKaspaTransaction(state.provider!, {
                to: LISTING_FEE_TREASURY,
                amount: sompiAmount.toString(),
            });

            if (result.status === 'failed') throw new Error(result.error);

            await createProduct({
                ...formData,
                priceKAS: parseFloat(formData.priceKAS),
                sellerAddress: state.address!,
                thumbnailCid,
                assetCids,
                status: 'active',
            }, result.txHash);

            setStep('complete');
            setTimeout(() => router.push('/studio'), 2000);
        } catch (err: any) {
            setError(err.message);
            setStep('form');
        } finally {
            setIsProcessing(false);
        }
    };

    if (step === 'payment') return (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#02abb8] mx-auto mb-6"></div>
            <p className="text-zinc-500 font-black uppercase tracking-widest">Processing Layer Transaction...</p>
        </div>
    );

    if (step === 'complete') return (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px]">
            <div className="text-6xl mb-6">✅</div>
            <p className="text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest">Product Listed Successfully!</p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="k-form-group">
                        <label className="k-label">Product Title</label>
                        <input
                            type="text"
                            className="k-input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Epic Software Tool..."
                            required
                        />
                    </div>
                    <div className="k-form-group">
                        <label className="k-label">Category</label>
                        <select
                            className="k-select"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="k-form-group">
                        <label className="k-label">Price (KAS)</label>
                        <input
                            type="number"
                            className="k-input"
                            value={formData.priceKAS}
                            onChange={e => setFormData({ ...formData, priceKAS: e.target.value })}
                            placeholder="100"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="k-form-group">
                        <label className="k-label">Description</label>
                        <textarea
                            className="k-textarea h-full"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what makes this product special..."
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="k-form-group">
                    <label className="k-label">Thumbnail Image</label>
                    <div className="relative group">
                        <input type="file" className="k-input opacity-0 absolute inset-0 cursor-pointer z-10" onChange={handleThumbnailChange} accept="image/*" />
                        <div className="k-input flex items-center justify-center border-dashed border-2 group-hover:border-[#02abb8] transition-colors">
                            {thumbnailCid ? "✅ Thumbnail Uploaded" : "📁 Choose Thumbnail"}
                        </div>
                    </div>
                </div>
                <div className="k-form-group">
                    <label className="k-label">Product Assets (Multiple)</label>
                    <div className="relative group">
                        <input type="file" multiple className="k-input opacity-0 absolute inset-0 cursor-pointer z-10" onChange={handleAssetChange} />
                        <div className="k-input flex items-center justify-center border-dashed border-2 group-hover:border-[#02abb8] transition-colors">
                            {assetCids.length > 0 ? `✅ ${assetCids.length} Assets Selected` : "📁 Upload Assets"}
                        </div>
                    </div>
                </div>
            </div>

            {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}

            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Listing Fee: <span className="text-[#02abb8]">{LISTING_FEE_KAS} KAS</span>
                </div>
                <button
                    type="submit"
                    disabled={!state.isConnected || isProcessing}
                    className="px-12 py-4 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50"
                >
                    Publish Product
                </button>
            </div>
        </form>
    );
}
