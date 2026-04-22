import { KrexNodeDocsGuide } from './KrexNodeDocsGuide';
import { KrexNodeSetupGuide } from './KrexNodeSetupGuide';

/**
 * Legacy bundle of setup + docs (e.g. external embeds). Prefer `KrexNodeSetupGuide` / `KrexNodeDocsGuide` on `/nodes`.
 */
export function KrexNodeRunGuideContent() {
  return (
    <div className="space-y-10">
      <KrexNodeSetupGuide />
      <KrexNodeDocsGuide />
    </div>
  );
}
