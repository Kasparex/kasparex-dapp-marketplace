/**
 * Turn [[type:slug|Label]] or [[type:slug]] into markdown links before react-markdown.
 * type: character | location | chapter | vehicle
 */
const WIKI =
  /\[\[(character|location|chapter|vehicle):([a-z0-9-]+)(?:\|([^\]]+))?\]\]/gi;

function hrefFor(type: string, slug: string): string {
  switch (type.toLowerCase()) {
    case 'character':
      return `/chronicles/characters/${slug}`;
    case 'location':
      return `/chronicles/locations/${slug}`;
    case 'chapter':
      return `/chronicles/chapters/${slug}`;
    case 'vehicle':
      return `/chronicles/vehicles/${slug}`;
    default:
      return '#';
  }
}

export function linkifyWikiTokens(markdown: string): string {
  return markdown.replace(WIKI, (_match, type: string, slug: string, label?: string) => {
    const text = (label ?? slug).trim();
    const href = hrefFor(type, slug);
    return `[${text}](${href})`;
  });
}
