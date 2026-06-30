import type { CovenantArtifactMeta, CovenantTemplate } from './types';

const ARTIFACT_BASE = '/covenant';

const cache = new Map<CovenantTemplate, CovenantArtifactMeta>();

export async function loadCovenantArtifact(
  template: CovenantTemplate
): Promise<CovenantArtifactMeta> {
  const cached = cache.get(template);
  if (cached) return cached;

  const res = await fetch(`${ARTIFACT_BASE}/${template}.json`, { cache: 'force-cache' });
  if (!res.ok) {
    throw new Error(`Covenant artifact not found: ${template}.json`);
  }
  const meta = (await res.json()) as CovenantArtifactMeta;
  if (meta.template !== template) {
    throw new Error(`Artifact template mismatch: expected ${template}, got ${meta.template}`);
  }
  cache.set(template, meta);
  return meta;
}

export function clearArtifactCache(): void {
  cache.clear();
}
