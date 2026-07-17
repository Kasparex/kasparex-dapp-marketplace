'use client';

import { useMemo, useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useGenesisDapp } from '@/hooks/useGenesisDapp';
import { useGenesisWidgetRail } from '@/hooks/useGenesisWidgetRail';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { Alert } from '@/components/Alert';
import {
  CovenantTabPanel,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { GenesisMessageList } from '@/components/dapps/genesis/GenesisMessageList';
import {
  genesisPlainTextLength,
  GENESIS_MESSAGE_LIMITS,
  validateGenesisMessageHtml,
} from '@/lib/genesis/limits';
import { computeGenesisMessageQuote } from '@/lib/genesis/pricing';
import { normalizeQuillHtml } from '@/lib/richText/html';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';

type TabId = 'create' | 'messages' | 'metadata';

const RECENT_PREVIEW_COUNT = 10;

const CAPSULE_HEADING = 'Leave Your Message.';
const CAPSULE_DESCRIPTION =
  'Publish a rich-text note on Kaspa L1. Your message stays on-chain forever and appears in the Hub Capsule archive.';

export function GenesisDappWidget({ dapp }: { dapp?: DApp }) {
  const { state: kaspaState } = useKaspaWallet();
  const { tier, balance: krexBalance } = useKREXBalance();
  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  const [contentHtml, setContentHtml] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    messages,
    isLoading,
    error,
    leaveMessage,
    deleteMessage,
    refreshMessages,
    messageCount,
  } = useGenesisDapp();

  useRegisterWidgetTabLabel('messages', `Messages (${messageCount})`, [messageCount]);

  const plainLen = genesisPlainTextLength(contentHtml);
  const validationError = useMemo(() => {
    const normalized = normalizeQuillHtml(contentHtml);
    if (!normalized) return null;
    return validateGenesisMessageHtml(normalized);
  }, [contentHtml]);

  const quote = useMemo(() => {
    const normalized = normalizeQuillHtml(contentHtml);
    if (!normalized || validationError || !kaspaState.address) return null;
    return computeGenesisMessageQuote(normalized, kaspaState.address, tier);
  }, [contentHtml, validationError, kaspaState.address, tier]);

  const handleSubmit = async () => {
    if (!dapp) return;
    const normalized = normalizeQuillHtml(contentHtml);
    const err = validateGenesisMessageHtml(normalized);
    if (err) return;

    setIsSubmitting(true);
    setSuccess(null);
    try {
      await leaveMessage(normalized, dapp);
      setContentHtml('');
      setSuccess('Your message was published on-chain and added to the Capsule archive.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  useGenesisWidgetRail(quote, krexBalance ?? 0, tier, {
    enabled: tab === 'create' && kaspaState.isConnected,
    flowBusy: isSubmitting,
    alerts:
      (validationError && contentHtml.trim()) || error || success ? (
        <div className="space-y-2">
          {validationError && contentHtml.trim() ? (
            <Alert type="warning" compact region>
              {validationError}
            </Alert>
          ) : null}
          {error ? (
            <Alert type="error" title="Error" compact region>
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert type="success" compact region onDismiss={() => setSuccess(null)}>
              {success}
            </Alert>
          ) : null}
        </div>
      ) : null,
    primaryAction: (
      <button
        type="button"
        disabled={
          isSubmitting ||
          isLoading ||
          !contentHtml.trim() ||
          Boolean(validationError) ||
          !quote
        }
        onClick={() => void handleSubmit()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? 'Publishing...'
          : quote
            ? `Leave message (${quote.totalKas.toFixed(2)} KAS)`
            : 'Leave message'}
      </button>
    ),
    deps: [
      tab,
      isSubmitting,
      isLoading,
      contentHtml,
      validationError,
      quote,
      kaspaState.isConnected,
      error,
      success,
    ],
  });

  if (!kaspaState.isConnected) {
    return (
      <DAppWidgetShell
        title="Interact"
        heading={CAPSULE_HEADING}
        description={CAPSULE_DESCRIPTION}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400 text-center py-6">
          Connect your wallet to use Kaspa Capsule.
        </p>
      </DAppWidgetShell>
    );
  }

  if (tab === 'create') {
    return (
      <div className="space-y-8">
        <DAppWidgetShell title="Interact" heading={CAPSULE_HEADING} description={CAPSULE_DESCRIPTION}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <KxFormFieldLabel>Your message</KxFormFieldLabel>
              <span
                className={`text-xs tabular-nums ${
                  plainLen > GENESIS_MESSAGE_LIMITS.max || plainLen < GENESIS_MESSAGE_LIMITS.min
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {plainLen} / {GENESIS_MESSAGE_LIMITS.max}
              </span>
            </div>
            <KxRichTextEditor
              value={contentHtml}
              onChange={setContentHtml}
              placeholder="Share your thoughts with future generations of the Kaspa ecosystem..."
              minRows={18}
              maxLength={GENESIS_MESSAGE_LIMITS.max}
              disabled={isSubmitting}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Minimum {GENESIS_MESSAGE_LIMITS.min} characters. Rich formatting is stored in your on-chain payload.
            </p>
          </div>

          {quote ? (
            <div className={`${KX_FORM_PANEL} space-y-2 text-xs text-zinc-600 dark:text-zinc-400`}>
              <DAppSectionHeader title="On-chain payload" className="!mb-0" />
              <div className="flex justify-between gap-2">
                <span>Payload bytes</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {quote.payloadBytes}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Chunk estimate ({quote.chunkSizeBytes} B each)</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {quote.chunkCount}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 pt-1">
                More text means more payload chunks and a higher size fee. See the calculation breakdown for your total.
              </p>
            </div>
          ) : null}
        </DAppWidgetShell>

        <div className={`${KX_FORM_PANEL} space-y-4`}>
          <DAppSectionHeader title="Recent messages" className="!mb-0" />
          <GenesisMessageList
            messages={messages}
            isLoading={isLoading}
            walletAddress={kaspaState.address}
            limit={RECENT_PREVIEW_COUNT}
            onSeeMore={() => navigateTab('messages')}
            onDeleteMessage={deleteMessage}
            emptyLabel="No messages yet. Yours could be the first."
          />
        </div>
      </div>
    );
  }

  if (tab === 'messages') {
    return (
      <CovenantTabPanel
        title="Messages"
        heading="Capsule messages"
        description="Every message published through Kaspa Capsule, newest first. Filter by author or search the archive."
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void refreshMessages()}
            className="text-xs text-[#02abb8] hover:underline"
          >
            Refresh
          </button>
        </div>
        <GenesisMessageList
          messages={messages}
          isLoading={isLoading}
          walletAddress={kaspaState.address}
          showFilters
          onDeleteMessage={deleteMessage}
        />
      </CovenantTabPanel>
    );
  }

  if (tab === 'metadata') {
    return (
      <CovenantTabPanel
        title="Metadata"
        heading="On-chain references"
        description="Payload templates and message lineage. Covenant deploy wiring will attach when native covenant transactions ship."
      >
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-300 space-y-3">
          <p>
            Kaspa Capsule messages use a canonical JSON payload (author + rich content) split into{' '}
            {180}-byte chunks for Kaspa L1 storage, matching the vBlog article model.
          </p>
          <p className="text-xs text-zinc-500">
            Payments settle via the standard L1 treasury flow today. Each message includes an explorer link to its
            commit transaction.
          </p>
          <p className="text-xs font-mono text-zinc-500">
            {messageCount} message{messageCount === 1 ? '' : 's'} in Hub archive
          </p>
        </div>
      </CovenantTabPanel>
    );
  }

  return null;
}
