import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import { ExperienceEditor, RelationEditor } from "../../_components/AdminEditors";

const dateOnly = (value: Date | null) => (value ? value.toISOString().slice(0, 10) : null);

export default async function AdminExperiencesPage() {
  await adminAuthService.requireAdmin();
  const [experiences, icons] = await Promise.all([
    portfolioAdministrationService.getExperiences(),
    portfolioAdministrationService.getIconBlocks(),
  ]);

  const options = icons.map(({ id, label }) => ({ id, label }));

  return (
    <section className="space-y-7">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Experience</h1>
        <p className="mt-2 text-muted">
          Ordered experience entries, role context, date ranges and related icons.
        </p>
      </div>
      <ExperienceEditor />
      {experiences.map((item) => (
        <div key={item.id} className="space-y-3">
          <ExperienceEditor
            item={{
              id: item.id,
              title: item.title,
              tag: item.tag,
              copy: item.copy,
              insight: item.insight,
              role: item.role,
              startDate: dateOnly(item.startDate),
              endDate: dateOnly(item.endDate),
              order: item.order,
            }}
          />
          <RelationEditor
            title={`${item.title} icons`}
            options={options}
            initial={item.iconBlocks.map((relation) => ({
              id: relation.iconBlockId,
              label: relation.iconBlock.label,
              order: relation.order,
            }))}
            owner={{ type: "experience", id: item.id }}
          />
        </div>
      ))}
    </section>
  );
}
