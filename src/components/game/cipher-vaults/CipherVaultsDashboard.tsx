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
import {
  CIPHER_REFINE_MIN,
  bankFragmentsForClear,
  getCipherLevel,
  getCipherVaultTier,
  type CipherVaultTierId,
} from '@/lib/game/cipher-vaults-config';
import { KX_PROSE, KX_PROSE_PARAGRAPH } from '@/lib/ui/kxTypography';
import { CardsFilterBar } from '@/components/games/CardsFilterBar';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';

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

  const playHealth: GameActivityHealth = game.state.activeLevel
    ? 'active'
    : game.covenantActive
      ? 'inactive'
      : 'exhausted';

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
                      ? 'Level in progress'
                      : playHealth === 'inactive'
                        ? 'Covenant open'
                        : 'Covenant closed'
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
      collections_complete: game.state.highestClearedLevel >= 8 ? 1 : 0,
      refinement_points: game.state.refinementPointsTotal,
      cipher_fragments: game.state.fragmentsEarnedLifetime,
    }),
    [
      game.state.ledger,
      game.state.highestClearedLevel,
      game.state.refinementPointsTotal,
      game.state.fragmentsEarnedLifetime,
    ],
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
                  ? 'Level in progress'
                  : playHealth === 'inactive'
                    ? 'Covenant open'
                    : 'Covenant closed'
              }
            />
          </span>
        ),
        subValue: game.covenantActive ? 'Covenant open · clear levels' : 'Pay entry to open covenant',
        description: 'In-game currency',
        tooltip:
          'Cipher Fragments bank when you clear a level. Seal points track correct placements. Refine fragments below into Hub points.',
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
      game.covenantActive,
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
    'Pay once to open a Cipher Vault covenant. Clear growing grid levels, bank Cipher Fragments, and refine them into Hub points.';

  const bankPreview = game.bankPreview(selectedTierId, []);
  const bankForLevel = (levelId: number) => {
    const level = getCipherLevel(levelId);
    if (!level) return 0;
    const vaultMult =
      game.state.fragmentMult ||
      (game.state.vaultTierId ? getCipherVaultTier(game.state.vaultTierId)?.fragmentMult : 1) ||
      1;
    return bankFragmentsForClear({
      bankReward: level.bankReward,
      vaultMult,
      addonFragmentMult: 1,
      boosterMult: game.boosterMult,
      wardenMult: game.wardenStack.fragmentMult,
    });
  };

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
        deckFooter={<span>Clear levels. Bank fragments. Refine to Hub.</span>}
        asideExtras={
          <CipherVaultsEntryPanel
            selectedTierId={selectedTierId}
            onSelectTier={setSelectedTierId}
            runActive={game.covenantActive}
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
            ) : null}

            <GameOverviewTitleBlock
              as="h3"
              kicker="How it works"
              title="One payment. Many levels."
              subtitle="Covenant window, growing grids, fog seals."
            />
            <p className={KX_PROSE_PARAGRAPH}>{description}</p>
            <p className={KX_PROSE_PARAGRAPH}>
              Pay entry once to open a timed covenant. Inside that window you climb levels: 3×3 up through 6×6, with
              fog hiding seal cells on harder stages. Correct swaps earn seal points. Only a verified clear banks Cipher
              Fragments. Paying again resets cleared levels so you can replay the ladder.
            </p>
            <GameOverviewTip title="Covenant tip">
              Seal Fragment unlocks levels 1–3. Master Covenant unlocks the full 1–8 ladder. Chrono Seals and Cipher
              Wardens extend the window without wiping progress.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 1"
              title="Open a track"
              subtitle="Calculation breakdown: vault class + add-ons."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Choose a vault track, optional Extra Swaps / Chrono Buffer / Fragment Amplifier / Second Seal, then pay
              with KAS or KREX. Vault Pass opens Seal Fragment without a cash entry.
            </p>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 2"
              title="Clear levels"
              subtitle="Growing grids. Fog. Level timers."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Start any unlocked uncleared level. Match your grid to the Vault Seal. Higher levels enlarge the board
              and veil seal cells. Submit when sealed to bank fragments, then climb the next level without paying again.
            </p>
            <GameOverviewTip title="Warden tip">
              Cipher Warden NFTs add swaps, level time, fragment mult, and covenant window while slotted. First slot is
              free.
            </GameOverviewTip>

            <GameOverviewTitleBlock
              as="h3"
              kicker="Step 3"
              title="Refine on Hub"
              subtitle="Cipher Fragments → redeem points."
            />
            <p className={KX_PROSE_PARAGRAPH}>
              Refine at least {CIPHER_REFINE_MIN.toLocaleString()} Cipher Fragments from the Game Deck into Hub points.
            </p>
          </article>
        )}

        {tab === 'play' && (
          <CipherVaultsPlayPanel
            covenantActive={game.covenantActive}
            covenantMsLeft={game.covenantMsLeft}
            activeLevel={game.state.activeLevel}
            activeLevelSolveMsLeft={game.activeLevelSolveMsLeft}
            clearedLevels={game.state.clearedLevels}
            maxUnlockedLevel={game.maxUnlockedLevel}
            vaultTierId={game.state.vaultTierId}
            sealPoints={game.state.sealPoints}
            boosterMult={game.boosterMult}
            retriesLeft={game.state.retriesLeft}
            inventory={game.state.inventory}
            wardenSlots={game.state.wardenSlots}
            slotUnlockKas={game.wardenSlotUnlockKas}
            submitting={submitting}
            getKasPriceAfterDiscount={game.getKasPriceAfterDiscount}
            bankForLevel={bankForLevel}
            onStartLevel={(id) => game.startLevel(id)}
            onSubmit={async (moves) => {
              setSubmitting(true);
              try {
                await game.submitLevel(moves);
              } finally {
                setSubmitting(false);
              }
            }}
            onAbandon={() => game.abandonLevel()}
            onRetry={() => game.retryLevel()}
            onConsumeHint={game.consumeRuneHint}
            onSealPointsDelta={game.addSealPoints}
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
            <GamePanelCard title="Vault checkpoints" hint="Verified level clears for this wallet.">
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                Cleared levels record moves, fragments banked, and seal points. Use this as your audit trail for Hub
                Rewards.
              </p>
              <CardsFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                category={category}
                onCategoryChange={setCategory}
                categories={['1', '2', '3', '4', '5', '6', '7', '8']}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <tr>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Level</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Moves</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Fragments</th>
                      <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Track</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let list = [...(game.state.ledger ?? [])];
                      if (searchQuery) {
                        const q = searchQuery.toLowerCase();
                        list = list.filter(
                          (e) =>
                            String(e.levelId).includes(q) ||
                            e.tierId.toLowerCase().includes(q) ||
                            e.entryTxHash?.toLowerCase().includes(q),
                        );
                      }
                      if (category !== 'all') {
                        list = list.filter((e) => String(e.levelId) === category);
                      }
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
                            Lv {e.levelId} · {getCipherLevel(e.levelId)?.name ?? 'Level'}
                          </td>
                          <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                            {e.moves}/{e.moveLimit}
                          </td>
                          <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                            {(e.fragmentsBanked ?? 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-zinc-600 dark:text-zinc-400">
                            {getCipherVaultTier(e.tierId)?.label ?? e.tierId}
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
            subtitle="Level clears and lifetime fragments raise your Player level."
          />
        )}

        {tab === 'comments' && (
          <CommentsSection articleId={gameCommentsArticleId('cipher-vaults')} dappSectionHeader />
        )}
      </UnifiedGameLayout>
    </TooltipProvider>
  );
}
