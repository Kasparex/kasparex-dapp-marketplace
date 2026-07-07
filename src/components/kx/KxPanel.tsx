import type { ReactNode } from 'react';
import { KX_PANEL, KX_PANEL_PADDING, KX_SURFACE_INSET } from '@/lib/hub/shellTokens';

type KxPanelVariant = 'surface' | 'inset';

const VARIANT_CLASS: Record<KxPanelVariant, string> = {
  surface: KX_PANEL,
  inset: KX_SURFACE_INSET,
};

export function KxPanel({
  children,
  variant = 'surface',
  padding = true,
  className = '',
  id,
}: {
  children: ReactNode;
  variant?: KxPanelVariant;
  padding?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`${VARIANT_CLASS[variant]} ${padding ? KX_PANEL_PADDING : ''} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
