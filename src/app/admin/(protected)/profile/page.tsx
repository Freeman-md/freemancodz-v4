import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import { ProfileEditor, RelationEditor } from "../../_components/AdminEditors";

const collections = [
  "AUDIENCE",
  "PRINCIPLES",
  "THINKING_PRINCIPLES",
  "PROCESS_PRINCIPLES",
  "CONTROL_PRINCIPLES",
  "OUTCOMES",
] as const;

export default async function AdminProfilePage() {
  await adminAuthService.requireAdmin();
  const [profile, icons] = await Promise.all([
    portfolioAdministrationService.getProfile(),
    portfolioAdministrationService.getIconBlocks(),
  ]);

  const options = icons.map(({ id, label }) => ({ id, label }));

  return (
    <section className="space-y-7">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-2 text-muted">
          Edit the singleton profile and its explicit ordered collections.
        </p>
      </div>
      <ProfileEditor profile={profile} />
      <div className="space-y-4">
        {collections.map((collection) => (
          <RelationEditor
            key={collection}
            title={collection.replaceAll("_", " ").toLowerCase()}
            options={options}
            initial={profile.iconCollections
              .filter((item) => item.collection === collection)
              .map((item) => ({
                id: item.iconBlockId,
                label: item.iconBlock.label,
                order: item.order,
              }))}
            owner={{ type: "profile", collection }}
          />
        ))}
      </div>
    </section>
  );
}
