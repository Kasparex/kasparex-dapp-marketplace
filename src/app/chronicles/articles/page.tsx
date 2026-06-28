import { ChroniclesHaloHeader } from '@/components/chronicles/ChroniclesHaloHeader';
import { ArticlesListing } from '@/components/chronicles/ArticlesListing';

export default function ChroniclesArticlesPage() {
  return (
    <div>
      <ChroniclesHaloHeader
        kicker="Lore codex"
        title="Articles"
        titleAccent="Articles"
        subtitle="Community articles and extended lore submissions. Read fan-written expansions and official side stories."
        showDefaultActions
      />
      <ArticlesListing title="All articles" />
    </div>
  );
}
