import { portfolioIconNameSchema } from "@/contracts/portfolio-presentation.contract";
import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import { MediaMetadataEditor } from "../../_components/AdminEditors";
import { MediaUploader } from "../../_components/MediaUploader";

const iconName = (value: string | null) => portfolioIconNameSchema.safeParse(value).data || null;

export default async function AdminMediaPage() {
  await adminAuthService.requireAdmin();
  const [media, projects] = await Promise.all([
    portfolioAdministrationService.getMediaBlocks(),
    portfolioAdministrationService.getProjects(),
  ]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Media</h1>
        <p className="mt-2 text-muted">
          Replace managed files safely, then maintain reusable media metadata and accessibility
          text.
        </p>
      </div>
      <MediaUploader
        media={media.map((item) => ({
          id: item.id,
          label: item.iconBlock.label,
          source: item.source,
          type: item.type,
        }))}
        projectCovers={projects
          .filter((project) => project.cover)
          .map((project) => ({ id: project.id, label: project.title }))}
      />
      <div className="space-y-4">
        <MediaMetadataEditor />
        {media.map((item) => (
          <MediaMetadataEditor
            key={item.id}
            item={{
              id: item.id,
              iconName: iconName(item.iconBlock.iconName),
              label: item.iconBlock.label,
              copy: item.iconBlock.copy,
              colour: null,
              type: item.type,
              source: item.source,
              altText: item.altText,
            }}
          />
        ))}
      </div>
    </section>
  );
}
