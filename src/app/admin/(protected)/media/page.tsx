import { portfolioIconNameSchema } from "@/contracts/portfolio-presentation.contract";
import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import { MediaMetadataEditor } from "../../_components/AdminEditors";
import { NewMediaBlockUploader } from "../../_components/MediaUploader";

const iconName = (value: string | null) => portfolioIconNameSchema.safeParse(value).data || null;

export default async function AdminMediaPage() {
  await adminAuthService.requireAdmin();
  const media = await portfolioAdministrationService.getMediaBlocks();

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Media</h1>
        <p className="mt-2 text-muted">
          Replace managed files safely, then maintain reusable media metadata and accessibility
          text.
        </p>
      </div>
      <NewMediaBlockUploader />
      <div className="space-y-4">
        {media.map((item) => (
          <MediaMetadataEditor
            key={item.id}
            item={{
              id: item.id,
              iconName: iconName(item.iconBlock.iconName),
              label: item.iconBlock.label,
              copy: item.iconBlock.copy,
              colour: null,
              source: item.source,
              type: item.type,
              altText: item.altText,
            }}
          />
        ))}
      </div>
    </section>
  );
}
