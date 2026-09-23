import { portfolioIconNameSchema } from "@/contracts/portfolio-presentation.contract";
import { adminAuthService, portfolioAdministrationService } from "@/modules/composition";
import { ActionEditor, IconEditor } from "../../_components/AdminEditors";

const iconName = (value: string | null) => portfolioIconNameSchema.safeParse(value).data || null;

export default async function AdminReusablePage() {
  await adminAuthService.requireAdmin();
  const [icons, actions] = await Promise.all([
    portfolioAdministrationService.getIconBlocks(),
    portfolioAdministrationService.getActionBlocks(),
  ]);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reusable blocks</h1>
        <p className="mt-2 text-muted">
          Shared icons and actions. Referenced records cannot be deleted until their relationships
          are removed.
        </p>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Icons</h2>
        <IconEditor />
        {icons
          .filter((item) => !actions.some(({ id }) => id === item.id))
          .map((item) => (
            <IconEditor
              key={item.id}
              item={{
                id: item.id,
                iconName: iconName(item.iconName),
                label: item.label,
                copy: item.copy,
                colour: null,
              }}
            />
          ))}
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Actions</h2>
        <ActionEditor />
        {actions.map((item) => (
          <ActionEditor
            key={item.id}
            item={{
              id: item.id,
              iconName: iconName(item.iconBlock.iconName),
              label: item.iconBlock.label,
              copy: item.iconBlock.copy,
              colour: null,
              variant: item.variant,
              url: item.url,
              assistantMessage: item.assistantMessage,
            }}
          />
        ))}
      </div>
    </section>
  );
}
