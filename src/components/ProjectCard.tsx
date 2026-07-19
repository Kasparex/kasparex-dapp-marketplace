'use client';

import Image from 'next/image';
import { HubProject } from '@/lib/hubProjects';
import { hubProjectListingAccent } from '@/lib/hub/hubProjectListingAccent';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KX_LISTING_CATEGORY_CHIP } from '@/lib/ui/kxLayout';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';
import { KxBadge } from '@/components/ui/KxBadge';

interface ProjectCardProps {
  project: HubProject;
}

function statusBadgeVariant(status: HubProject['status']) {
  if (status === 'demo') return 'sky' as const;
  if (status === 'beta') return 'violet' as const;
  if (status === 'coming-soon') return 'amber' as const;
  return 'zinc' as const;
}

function statusLabel(status: HubProject['status']) {
  if (status === 'demo') return 'Demo';
  if (status === 'beta') return 'Beta';
  if (status === 'coming-soon') return 'Coming soon';
  return status;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const accent = hubProjectListingAccent(project.id);

  return (
    <KxListingCard
      href={project.route}
      accent={accent}
      className="relative flex flex-col min-h-0"
    >
      <KxListingCardMedia aspectClass="aspect-video">
        <Image
          src={project.featuredImage}
          alt={project.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex-1 min-h-0">
        {project.status !== 'available' ? (
          <div className="absolute top-4 right-4 z-10">
            <KxBadge variant={statusBadgeVariant(project.status)}>{statusLabel(project.status)}</KxBadge>
          </div>
        ) : null}

        <div className="mb-2 pr-24">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h3>
        </div>

        <div className="mb-3 flex-grow min-h-0">
          <p className={KX_CARD_EXCERPT}>{project.description}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className={KX_LISTING_CATEGORY_CHIP}>
            <span>{project.category}</span>
          </div>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
