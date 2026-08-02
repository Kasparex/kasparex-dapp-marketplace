'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { TooltipProvider } from '@/components/ui/Tooltip';
import type { GameDeckResource } from '@/components/games/panels/GameDeckPanel';
import { gameDeckRefineResource } from '@/components/games/panels/GameDeckRefineControls';
import { UnifiedGameLayout } from '@/components/games/layout/UnifiedGameLayout';
import {
  GameOverviewTip,
  GameOverviewTitleBlock,
  GAME_OVERVIEW_ACCENT_LINK,
} from '@/components/games/panels/GameOverviewSections';
import { RewardsPreview } from '@/components/games/modules/RewardsPreview';
import { MilestonesPanel } from '@/components/games/modules/MilestonesPanel';
import { GameActivityStatusDot, type GameActivityHealth } from '@/components/games/GameActivityStatusDot';
import type { GameTab } from '@/components/games/layout/GameTabs';
import {
  IconComments,
  IconMilestones,
  IconOverview,
  IconPlay,
  IconRewards,
  IconShop,
} from '@/components/games/icons/TabIcons';
import { useGameCommentsTabs, gameCommentsArticleId } from '@/components/games/comments/gameComments';
import { useGameMilestones } from '@/hooks/useGameMilestones';
import { useCipherVaults } from '@/hooks/useCipherVaults';
import { CipherVaultsEntryPanel } from '@/components/game/cipher-vaults/CipherVaultsEntryPanel';
import { CipherVaultsPlayPanel } from '@/components/game/cipher-vaults/CipherVaultsPlayPanel';
import { CipherVaultsShopPanel } from '@/components/game/cipher-vaults/CipherVaultsShopPanel';
import { CIPHER_REFINE_MIN, type CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import { KX_PROSE, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { getCipherVaultTier } from '@/lib/game/cipher-vaults-config';

const CommentsSection = dynamic(() => import('@/components/vblog/CommentsSection').then((m) => m.CommentsSection), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
      Loading comments…
    </div>
  ),
});

const TABS = [
  { id: 'overview', label: 'Overview', icon: <IconOverview /> },
  { id: 'play', label: 'Play', icon: <IconPlay /> },
  { id: 'shop', label: 'Shop', icon: <IconShop /> },
  { id: 'rewards', label: 'Rewards', icon: <IconRewards /> },
  { id: 'milestones', label: 'Milestones', icon: <IconMilestones /> },
  { id: 'comments', label: 'Comments', icon: <IconComments /> },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CipherVaultsDashboard(props: {
  featuredImage?: string;
  loreStory?: string;
  gameDescription?: string;
  gameName?: string;
  game: any;
}) {
  const game = useCipherVaults();
  const [tab, setTab] = useState<TabId>('play');
  const [refineAmount, setRefineAmount] = useState<number | ''>('');
  const [selectedTierId, setSelectedTierId] = useState<CipherVaultTierId>('seal');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');

  const playHealth: GameActivityHealth = game.runActive
    ? 'active'
    : game.state.activeRun
      ? 'exhausted'
      : 'inactive';

  const tabsBase = useGameCommentsTabs(TABS as unknown as GameTab<TabId>[], 'cipher-vaults');
  const tabs = useMemo(
    () =>
      tabsBase.map((t) =>
        t.id === 'play'
          ? {
              ...t,
              rightAdornment: (
                <GameActivityStatusDot
                  health={playHealth}
                  title={
                    playHealth === 'active'
                      ? 'Vault covenant active'
                      : playHealth === 'exhausted'
                        ? 'Run loading / expired'
                        : 'No active vault'
                  }
                />
              ),
            }
          : t,
      ),
    [tabsBase, playHealth],
  );

  const milestoneProgress = useMemo(
    () => ({
      cipher_clears: (game.state.ledger ?? []).length,
      collections_complete:
        new Set((game.state.ledger ?? []).map((e) => e.tierId)).size >= 5 ? 1 : 0,
      refinement_points: game.state.refinementPointsTotal,
      cipher_fragments: game.state.fragmentsEarnedLifetime,
    }),
    [game.state.ledger, game.state.refinementPointsTotal, game.state.fragmentsEarnedLifetime],
  );
  const { level: playerLevel } = useGameMilestones('cipher-vaults', milestoneProgress);

  const refineFragments = game.refineFragments;
  const deckResources: GameDeckResource[] = useMemo(
    () => [
      {
        id: 'fragments',
        label: 'Cipher Fragments',
        value: (
          <span className="inline-flex items-center gap-2 text-lg font-black tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-xl">
            {game.state.cipherFragments.toLocaleString()}
            <GameActivityStatusDot
              health={playHealth}
              title={
                playHealth === 'active'
                  ? 'Vault covenant active'
                  : playHealth === 'exhausted'
                    ? 'Run loading / expired'
                    : 'No active vault'
              }
            />
          </span>
        ),
        subValue: game.runActive ? 'Covenant open' : 'Pay entry to open a vault',
        description: 'In-game currency',
        tooltip:
          'Cipher Fragments bank when you clear a vault. Refine them below into Hub redeem points on /rewards.',
        accent: 'games' as const,
        onClick: () => setTab('play'),
      },
      gameDeckRefineResource({
        amount: refineAmount,
        onAmountChange: setRefineAmount,
        minAmount: game.refineMin,
        maxAmount: Math.floor(game.state.cipherFragments),
        refining: game.refining,
        onRefine: (n) => {
          void refineFragments(n).then((res) => {
            if (res) setRefineAmount('');
          });
        },
        description: `Min ${game.refineMin} fragments → Hub points on /rewards`,
        tooltip:
          'Enter how many Cipher Fragments to refine. Each fragment credits exactly 1 Hub redeem point on /rewards.',
      }),
    ],
    [
      game.state.cipherFragments,
      game.runActive,
      game.refineMin,
      game.refining,
      refineFragments,
      refineAmount,
      playHealth,
    ],
  );

  const categories = (props.game?.categories ?? []) as string[];
  const tags = (props.game?.tags ?? []) as string[];
  const gameName = props.gameName ?? props.game?.name ?? "Krex’s Cipher Vaults";
  const description =
    props.gameDescription?.trim() ||
    'Open timed Cipher Vault covenants on the Kaspa network. Solve rune grids, bank Cipher Fragments, and refine them into Hub redeem points.';

  const bankPreview = game.bankPreview(selectedTierId, []);

  return (
    <TooltipProvider>
      <UnifiedGameLayout
        tabs={tabs as any}
        currentTab={tab}
        onTabChange={setTab}
        resources={deckResources}
        playerLevel={playerLevel}
        game={{
          ...(props.game ?? {}),
          name: gameName,
          description: props.gameDescription ?? props.game?.description ?? '',
          featuredImage: props.featuredImage || props.game?.featuredImage,
          image: props.game?.image,
          categories,
          tags,
        }}
        deckFooter={<span>Clear vaults. Bank fragments. Refine to Hub.</span>}
        asideExtras={
          <CipherVaultsEntryPanel
            selectedTierId={selectedTierId}
            onSelectTier={setSelectedTierId}
            runActive={Boolean(game.state.activeRun)}
            ownedAddons={game.state.ownedAddons}
            booster={game.state.booster}
            inventory={game.state.inventory}
            paying={game.paying}
            error={game.lastError}
            success={game.lastSuccess}
            bankPreview={bankPreview}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onPay={async (args) => {
              const ok = await game.startVault(args);
              if (ok) setTab('play');
              return ok;
            }}
          />
        }
      >
        {tab === 'overview' && (
          <article className={`${KX_PROSE} px-1 pt-6 sm:px-3 lg:px-4`}>
            {props.loreStory?.trim() ? (
              <>
                <GameOverviewTitleBlock
                  as="h2"
                  kicker="Lore"
                  title="From the field"
                  subtitle="Cipher Vault story and world context."
                />
                {props.loreStory
                  .trim()
                  .split(/\n\s*\n+/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para) => (
                    <p key={para.slice(0, 48)} className={KX_PROSE_PARAGRAPH}>
                      {para}
                    </p>
                  ))}
                <GameOverviewTip title="World tip">
                  Browse{' '}
                  <Link href="/chronicles/chapters" className={GAME_OVERVIEW_ACCENT_LINK}>
                    Chronicles chapters
                  </Link>{' '}
                  and{' '}
                  <Link href="/chronicles/characters" className={GAME_OVERVIEW_ACCENT_LINK}>
                    character dossiers
                  </Link>{' '}
                  for ARIA, Krex, Vector, and Tessa lore.
                </GameOverviewTip>
              </>
            ) : (
              <GameOverviewTitleBlock
                as="h2"
                kicker="Lore"
                title={gameName}
                subtitle="Cipher Vault story and world context."
              />
            )}

            <GameOverviewTitleBlock
              as="h3"
              kicker="Rewards"
              title="How rewards work"
              subtitle="Vault clears, Shop tools, and Hub refine points."
            />
            <p className={KX_PROSE_PARAGRAPH}>{description}</p>
            <p className={KX_PROSE_PARAGRAPH}>
              Cipher Vaults are covenant-style chambers. You pay to open a timed seal, reconstruct the scrambled rune
              grid before the countdown ends, and bank Cipher Fragments on a verified clear. Fragments refine 1:1 into
              Hub redeem points when you have at least {CIPHER_REFINE_MIN.toLocaleString()}.
            </p>
            <GameOverviewTip title="Covenant tip">
              Entry starts at 10 KAS for Seal Fragment. Higher vault classes cost more, scramble deeper, and pay more
              fragments. Chrono Seals and Cipher Warden NFTs extend the broader covenant window without wiping your
              puzzle.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 1"
              title="Open a vault"
              subtitle="Pay entry from the Calculation breakdown."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Choose a vault class (Seal Fragment through Master Covenant), optional add-ons (Extra Swaps, Chrono
              Buffer, Fragment Amplifier, Second Seal), then pay with KAS or KREX. Vault Passes from the Shop can open
              Seal Fragment without a cash entry.
            </p>
            <GameOverviewTip title="Entry tip">
              Shop boosters apply while active. Entry add-ons attach to the covenant you are about to open. Select them
              before you pay.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 2"
              title="Solve the Cipher Grid"
              subtitle="Swap runes, race the timer, submit when sealed."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Match your grid to the Vault Seal target with swaps only. Correct tiles highlight with the Hub accent.
              Use Rune Hints from the Shop if you get stuck. Slot Cipher Warden NFTs below the grid for extra swaps,
              time, and fragment multipliers.
            </p>
            <GameOverviewTip title="Warden tip">
              Standard Wardens add +1 swap and +1 minute. Partner, Premium, Diamond, and Rarest scale further, and also
              extend the covenant window while slotted.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 3"
              title="Refine on Hub"
              subtitle="Turn Cipher Fragments into redeem points."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Refine at least {CIPHER_REFINE_MIN.toLocaleString()} Cipher Fragments from the Game Deck into Hub points,
              then spend them on the Rewards catalog when distribution is open.
            </p>
          </article>
        )}

        {tab === 'play' && (
          <CipherVaultsPlayPanel
            run={game.state.activeRun}
            runActive={game.runActive}
            puzzle={game.puzzle}
            solveMsLeft={game.solveMsLeft}
            covenantMsLeft={game.covenantMsLeft}
            boosterMult={game.boosterMult}
            inventory={game.state.inventory}
            wardenSlots={game.state.wardenSlots}
            slotUnlockKas={game.wardenSlotUnlockKas}
            submitting={submitting}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onSubmit={async (moves) => {
              const rid = game.state.activeRun?.runId;
              if (!rid) return;
              setSubmitting(true);
              try {
                const res = await game.submitRun(rid, moves);
                if (res?.solved) setTab('rewards');
              } finally {
                setSubmitting(false);
              }
            }}
            onFailed={() => {
              void (async () => {
                if ((game.state.activeRun?.retriesLeft ?? 0) > 0) {
                  await game.retryRun();
                  return;
                }
                await game.cancelRun(game.state.activeRun?.runId);
              })();
            }}
            onCancel={() => {
              void game.cancelRun(game.state.activeRun?.runId);
            }}
            onRetry={() => game.retryRun()}
            onResume={() => {
              void game.loadActiveRun();
            }}
            onConsumeHint={game.consumeRuneHint}
            onSetWarden={game.setWarden}
            onClearWarden={game.clearWarden}
            onPurchaseWardenSlots={game.purchaseWardenSlots}
          />
        )}

        {tab === 'shop' && (
          <CipherVaultsShopPanel
            inventory={game.state.inventory}
            booster={game.state.booster}
            buyBusyId={game.buyBusyId}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            onBuy={game.buyShopItem}
          />
        )}

        {tab === 'rewards' && (
          <div className="space-y-6">
            <RewardsPreview showLink={true} />
            <GamePanelCard title="Vault checkpoints" hint="Verified clears for this wallet.">
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Cleared covenants record moves, fragments banked, and entry receipts. Use these as your audit trail for
                Hub Rewards.
              </p>
              <CardsFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                category={category}
                onCategoryChange={setCategory}
                categories={['seal', 'rune', 'null', 'aria', 'master']}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <tr>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Vault</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Moves</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Fragments</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let list = [...(game.state.ledger ?? [])];
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        list = list.filter(
                          (e) =>
                            e.tierId.toLowerCase().includes(q) ||
                            e.entryTxHash?.toLowerCase().includes(q),
                        );
                      }
                      if (category !== 'all') list = list.filter((e) => e.tierId === category);
                      if (sortBy === 'price_asc') list.sort((a, b) => a.moves - b.moves);
                      else if (sortBy === 'price_desc') list.sort((a, b) => b.moves - a.moves);
                      else list.sort((a, b) => b.solvedAt - a.solvedAt);

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                              No clears match your filters.
                            </td>
                          </tr>
                        );
                      }
                      return list.map((e) => (
                        <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                          <td className="p-3 text-zinc-600 dark:text-zinc-400">
                            {new Date(e.solvedAt).toLocaleString()}
                          </td>
                          <td className="p-3 text-zinc-800 dark:text-zinc-200">
                            {getCipherVaultTier(e.tierId as CipherVaultTierId)?.label ?? e.tierId}
                          </td>
                          <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                            {e.moves}/{e.moveLimit}
                          </td>
                          <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                            {(e.fragmentsBanked ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-xs text-zinc-500 dark:text-zinc-500">
                            {e.entryTxHash ? `${e.entryTxHash.slice(0, 10)}…` : 'pass'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </GamePanelCard>
          </div>
        )}

        {tab === 'milestones' && (
          <MilestonesPanel
            gameId="cipher-vaults"
            progress={milestoneProgress}
            kicker="Progress"
            title="Milestones"
            subtitle="Vault clears and lifetime fragments raise your Player level."
          />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('cipher-vaults')} dappSectionHeader />
        )}
      </UnifiedGameLayout>
    </TooltipProvider>
  );
}
