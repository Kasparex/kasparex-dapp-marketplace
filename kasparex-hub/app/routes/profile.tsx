import { Header } from "~/components/layout/Header";
import { Footer } from "~/components/layout/Footer";
import { useKaspaWallet } from "~/lib/kaspa/provider";
import { KaspaL1WalletConnect } from "~/components/wallets/KaspaL1WalletConnect";
import { NFTStatusBox } from "~/components/nft/NFTStatusBox";
import { useNFTStatus } from "~/hooks/useNFTStatus";
import { getBestGatewayUrl } from "~/lib/ipfs/gateway";

export const meta = () => {
  return [
    { title: "Kasparex Hub - Profile" },
    {
      name: "description",
      content: "View your wallet and NFT status in the Kasparex ecosystem.",
    },
  ];
};

function formatKas(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export default function Profile() {
  const { address, isConnected, balance, network } = useKaspaWallet();
  const { nfts, isLoading: nftsLoading } = useNFTStatus();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">
            Profile & Wallet
          </h1>

          {/* Wallet Connection Section */}
          <div className="mb-8 p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              Wallet Connection
            </h2>

            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Connect with{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                KasWare
              </span>{" "}
              or{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                Kastle
              </span>{" "}
              to view balances and your NFTs.
            </p>

            <KaspaL1WalletConnect variant="comfortable" />

            {isConnected && address && (
              <div className="space-y-4 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Address
                  </label>
                  <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">
                    {address}
                  </div>
                </div>
                {network && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Network
                    </label>
                    <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100">
                      {network}
                    </div>
                  </div>
                )}
                {balance !== null && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Balance
                    </label>
                    <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100">
                      {formatKas(balance)} KAS
                    </div>
                  </div>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Copy address, refresh balance, or disconnect from the wallet
                  menu on the button above.
                </p>
              </div>
            )}
          </div>

          {/* NFT Status Section */}
          {isConnected && (
            <div className="mb-8">
              <NFTStatusBox />
            </div>
          )}

          {/* NFT Gallery Section */}
          {isConnected && (
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Your NFTs
              </h2>

              {nftsLoading ? (
                <div className="text-zinc-600 dark:text-zinc-400">
                  Loading NFTs...
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-zinc-600 dark:text-zinc-400">
                  No NFTs found in your wallet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {nfts.map((nft) => {
                    const imageUri = `${nft.collectionConfig.baseUri}/${nft.tokenId}.png`;
                    const imageUrl = getBestGatewayUrl(
                      imageUri.replace(/^ipfs:\/\//, "")
                    );

                    return (
                      <div
                        key={`${nft.collection}-${nft.tokenId}`}
                        className="bg-zinc-50 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                      >
                        <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                          <img
                            src={imageUrl}
                            alt={`${nft.collection} #${nft.tokenId}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                            {nft.collection}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            #{nft.tokenId}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
