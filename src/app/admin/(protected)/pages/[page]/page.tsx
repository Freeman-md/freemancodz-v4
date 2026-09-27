import { notFound } from "next/navigation";
import type { ContentBlockNode } from "@/modules/portfolio/types";
import { adminAuthService, portfolioAdministrationService } from "@/modules/composition";
import { portfolioPageSchema } from "@/contracts/portfolio-admin.contract";
import { ContentBlockEditor } from "../../../_components/AdminEditors";

const paths = { home: "/", work: "/work", about: "/about", audit: "/audit" } as const;

export function generateStaticParams() {
  return Object.keys(paths).map((page) => ({ page }));
}

function present(block: ContentBlockNode): {
  id: string;
  url: string;
  eyebrow: string | null;
  title: string | null;
  copy: string | null;
  order: number | null;
  children: ReturnType<typeof present>[];
  icons: Array<{ id: string; label: string; order: number }>;
  media: Array<{ id: string; label: string; order: number }>;
  actions: Array<{ id: string; label: string; order: number }>;
} {
  return {
    id: block.id,
    url: block.url,
    eyebrow: block.eyebrow,
    title: block.title,
    copy: block.copy,
    order: block.order,
    children: block.children.map(({ child }) => present(child)),
    icons: block.iconBlocks.map((item) => ({
      id: item.iconBlockId,
      label: item.iconBlock.label,
      order: item.order,
    })),
    media: block.mediaBlocks.map((item) => ({
      id: item.mediaBlockId,
      label: item.mediaBlock.iconBlock.label,
      order: item.order,
    })),
    actions: block.actionBlocks.map((item) => ({
      id: item.actionBlockId,
      label: item.actionBlock.iconBlock.label,
      order: item.order,
    })),
  };
}

export default async function AdminPageEditor({ params }: { params: Promise<{ page: string }> }) {
  await adminAuthService.requireAdmin();
  const parsed = portfolioPageSchema.safeParse((await params).page);

  if (!parsed.success) {
    notFound();
  }

  const [blocks, icons, media, actions] = await Promise.all([
    portfolioAdministrationService.getPageContent(paths[parsed.data]),
    portfolioAdministrationService.getIconBlocks(),
    portfolioAdministrationService.getMediaBlocks(),
    portfolioAdministrationService.getActionBlocks(),
  ]);

  const options = {
    icons: icons.map(({ id, label }) => ({ id, label })),
    media: media.map(({ id, iconBlock }) => ({ id, label: iconBlock.label })),
    actions: actions.map(({ id, iconBlock }) => ({ id, label: iconBlock.label })),
  };

  return (
    <section className="space-y-7">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight capitalize">{parsed.data} page</h1>
        <p className="mt-2 text-muted">
          Edit approved semantic sections. Static presentation exceptions remain in the frontend.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {Object.keys(paths).map((page) => (
            <a
              key={page}
              href={`/admin/pages/${page}`}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm capitalize hover:border-signal-300"
            >
              {page}
            </a>
          ))}
        </nav>
      </div>
      <div className="space-y-4">
        {blocks.map((block) => (
          <ContentBlockEditor key={block.id} block={present(block)} options={options} />
        ))}
      </div>
    </section>
  );
}
