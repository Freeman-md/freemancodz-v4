"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createContext, useContext, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import {
  updateContentBlockSchema,
  updateProfileSchema,
  upsertActionBlockSchema,
  upsertExperienceSchema,
  upsertIconBlockSchema,
  mediaMetadataSchema,
  upsertProjectSchema,
} from "@/contracts/portfolio-admin.contract";
import {
  portfolioIconNames,
  type PortfolioIconName,
} from "@/contracts/portfolio-presentation.contract";
import { PortfolioIcon } from "@/features/portfolio/components/PortfolioIcon";
import { Button } from "@/shared/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/Card";
import { Input } from "@/shared/components/ui/Input";
import { Label } from "@/shared/components/ui/Label";
import { Select } from "@/shared/components/ui/Select";
import { Textarea } from "@/shared/components/ui/Textarea";
import type { AdminActionResult, AdminActions } from "@/features/admin/types";
import { MediaUploader } from "./MediaUploader";

type ProfileValues = z.input<typeof updateProfileSchema>;
type ProjectValues = z.input<typeof upsertProjectSchema>;
type ExperienceValues = z.input<typeof upsertExperienceSchema>;
type IconValues = z.input<typeof upsertIconBlockSchema>;
type ActionValues = z.input<typeof upsertActionBlockSchema>;
type MediaValues = z.input<typeof mediaMetadataSchema>;
type ContentValues = z.input<typeof updateContentBlockSchema>;
type Submitter<T> = (input: T) => Promise<AdminActionResult>;
type RelationOption = { id: string; label: string };
type SelectedRelation = RelationOption & { order: number };

const AdminActionsContext = createContext<AdminActions | null>(null);

export function AdminActionsProvider({
  actions,
  children,
}: {
  actions: AdminActions;
  children: React.ReactNode;
}) {
  return <AdminActionsContext value={actions}>{children}</AdminActionsContext>;
}

function useAdminActions() {
  const actions = useContext(AdminActionsContext);

  if (!actions) {
    throw new Error("Admin actions are unavailable.");
  }

  return actions;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function Result({ result }: { result: AdminActionResult | null }) {
  return result ? (
    <p
      role="status"
      className={result.status === "success" ? "text-sm text-emerald-700" : "text-sm text-red-700"}
    >
      {result.message}
    </p>
  ) : null;
}

function DeleteButton({
  id,
  label,
  action,
}: {
  id: string;
  label: string;
  action: (input: unknown) => Promise<AdminActionResult>;
}) {
  const [confirming, setConfirming] = useState(false);

  const [result, setResult] = useState<AdminActionResult | null>(null);

  if (!confirming) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Delete
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 p-2">
      <span className="text-xs text-red-800">Delete “{label}”?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={async () => setResult(await action({ id }))}
      >
        Confirm delete
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Result result={result} />
    </div>
  );
}

function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border border-line">
      <CardHeader className="border-b border-line">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-5 py-5">{children}</CardContent>
    </Card>
  );
}

export function ProfileEditor({ profile }: { profile: ProfileValues }) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: profile,
  });

  return (
    <FormCard
      title="Core profile"
      description="The singleton identity used across the public portfolio."
    >
      <form
        className="grid gap-5 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => setResult(await actions.updateProfileAction(values)))}
      >
        <Field label="Name" error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} />
        </Field>
        <Field label="Title" error={form.formState.errors.title?.message}>
          <Input {...form.register("title")} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Positioning" error={form.formState.errors.positioning?.message}>
            <Textarea rows={4} {...form.register("positioning")} />
          </Field>
        </div>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field label="LinkedIn URL" error={form.formState.errors.linkedInUrl?.message}>
          <Input type="url" {...form.register("linkedInUrl")} />
        </Field>
        <Field label="GitHub URL" error={form.formState.errors.githubUrl?.message}>
          <Input type="url" {...form.register("githubUrl")} />
        </Field>
        <div className="flex items-end gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save profile
          </Button>
          <Result result={result} />
        </div>
      </form>
    </FormCard>
  );
}

export function RelationEditor({
  title,
  options,
  initial,
  owner,
}: {
  title: string;
  options: RelationOption[];
  initial: SelectedRelation[];
  owner:
    | {
        type: "profile";
        collection:
          | "AUDIENCE"
          | "PRINCIPLES"
          | "THINKING_PRINCIPLES"
          | "PROCESS_PRINCIPLES"
          | "CONTROL_PRINCIPLES"
          | "OUTCOMES";
      }
    | { type: "content"; id: string; relation: "children" | "icons" | "media" | "actions" }
    | { type: "experience"; id: string };
}) {
  const actions = useAdminActions();

  const [selected, setSelected] = useState(() => [...initial].sort((a, b) => a.order - b.order));

  const [result, setResult] = useState<AdminActionResult | null>(null);

  function toggle(option: RelationOption) {
    setSelected((items) =>
      items.some(({ id }) => id === option.id)
        ? items.filter(({ id }) => id !== option.id)
        : [...items, { ...option, order: items.length }],
    );
  }

  function move(index: number, direction: -1 | 1) {
    setSelected((items) => {
      const target = index + direction;

      if (target < 0 || target >= items.length) {
        return items;
      }

      const next = [...items];

      [next[index], next[target]] = [next[target], next[index]];

      return next;
    });
  }

  async function save() {
    const items = selected.map(({ id }, order) => ({ id, order }));

    if (owner.type === "profile") {
      setResult(await actions.updateProfileCollectionAction({ collection: owner.collection, items }));
    }

    if (owner.type === "content") {
      setResult(
        await actions.updateContentRelationsAction({ id: owner.id, relation: owner.relation, items }),
      );
    }

    if (owner.type === "experience") {
      setResult(await actions.updateExperienceIconsAction({ id: owner.id, items }));
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-line bg-slate-50 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            onClick={() => toggle(option)}
            className={`rounded-full border px-3 py-1 text-xs ${selected.some(({ id }) => id === option.id) ? "border-signal-400 bg-signal-50 text-signal-800" : "border-line bg-white"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <ol className="space-y-1">
        {selected.map((item, index) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
          >
            <span>
              {index + 1}. {item.label}
            </span>
            <span className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${item.label} up`}
                onClick={() => move(index, -1)}
              >
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${item.label} down`}
                onClick={() => move(index, 1)}
              >
                ↓
              </Button>
            </span>
          </li>
        ))}
      </ol>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" onClick={save}>
          Save relationships
        </Button>
        <Result result={result} />
      </div>
    </div>
  );
}

type AdminContentBlock = ContentValues & {
  url: string;
  children: AdminContentBlock[];
  icons: SelectedRelation[];
  media: SelectedRelation[];
  actions: SelectedRelation[];
};
type ReusableOptions = {
  icons: RelationOption[];
  media: RelationOption[];
  actions: RelationOption[];
};
export function ContentBlockEditor({
  block,
  options,
}: {
  block: AdminContentBlock;
  options: ReusableOptions;
}) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const form = useForm<ContentValues>({
    resolver: zodResolver(updateContentBlockSchema),
    defaultValues: block,
  });

  return (
    <div className="space-y-3">
      <FormCard
        title={block.title || block.eyebrow || "Untitled section"}
        description={`${block.url} · semantic section`}
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit(async (values) =>
            setResult(await actions.updateContentBlockAction(values)),
          )}
        >
          <input type="hidden" {...form.register("id")} />
          <Field label="Eyebrow">
            <Input {...form.register("eyebrow")} />
          </Field>
          <Field label="Title">
            <Input {...form.register("title")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Copy">
              <Textarea rows={5} {...form.register("copy")} />
            </Field>
          </div>
          <Field label="Order">
            <Input
              type="number"
              {...form.register("order", {
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
            />
          </Field>
          <div className="flex items-end gap-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save section
            </Button>
            <Result result={result} />
          </div>
          <div className="space-y-3 md:col-span-2">
            {block.children.length ? (
              <RelationEditor
                title="Child section order"
                options={block.children.map((child) => ({
                  id: child.id,
                  label: child.title || child.eyebrow || child.url,
                }))}
                initial={block.children.map((child, order) => ({
                  id: child.id,
                  label: child.title || child.eyebrow || child.url,
                  order,
                }))}
                owner={{ type: "content", id: block.id, relation: "children" }}
              />
            ) : null}
            <RelationEditor
              title="Reusable icons"
              options={options.icons}
              initial={block.icons}
              owner={{ type: "content", id: block.id, relation: "icons" }}
            />
            <RelationEditor
              title="Media blocks"
              options={options.media}
              initial={block.media}
              owner={{ type: "content", id: block.id, relation: "media" }}
            />
            <RelationEditor
              title="Actions"
              options={options.actions}
              initial={block.actions}
              owner={{ type: "content", id: block.id, relation: "actions" }}
            />
          </div>
        </form>
      </FormCard>
      {block.children.length ? (
        <div className="ml-4 space-y-3 border-l border-signal-200 pl-4">
          {block.children.map((child) => (
            <ContentBlockEditor key={child.id} block={child} options={options} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: PortfolioIconName | null) => void;
}) {
  const [search, setSearch] = useState("");

  const choices = useMemo(
    () =>
      portfolioIconNames
        .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 18),
    [search],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search approved icons"
          aria-label="Search icons"
        />
        <PortfolioIcon name={value} className="size-6 text-signal-700" aria-hidden />
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {choices.map((name) => (
          <button
            key={name}
            type="button"
            title={name}
            onClick={() => onChange(name)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-lg border p-2 text-[10px] ${value === name ? "border-signal-500 bg-signal-50" : "border-line bg-white"}`}
          >
            <PortfolioIcon name={name} className="size-4" aria-hidden />
            <span className="mt-1 max-w-full truncate">{name}</span>
          </button>
        ))}
      </div>
      <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
        Use no icon
      </Button>
    </div>
  );
}

export function IconEditor({ item }: { item?: IconValues & { id: string } }) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const form = useForm<IconValues>({
    resolver: zodResolver(upsertIconBlockSchema),
    defaultValues: item || { iconName: null, label: "", copy: null, colour: null },
  });

  const selectedIcon = useWatch({ control: form.control, name: "iconName" });

  const submit: Submitter<IconValues> = item
    ? (values) => actions.updateIconBlockAction({ ...values, id: item.id })
    : actions.createIconBlockAction;

  return (
    <FormCard title={item ? item.label : "New reusable icon"}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => setResult(await submit(values)))}
      >
        <Field label="Approved Lucide icon">
          <IconPicker
            value={selectedIcon}
            onChange={(value) => form.setValue("iconName", value, { shouldValidate: true })}
          />
        </Field>
        <Field label="Label">
          <Input {...form.register("label")} />
        </Field>
        <Field label="Copy">
          <Textarea {...form.register("copy")} />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Button type="submit">{item ? "Save icon" : "Create icon"}</Button>
          {item ? (
            <DeleteButton id={item.id} label={item.label} action={actions.deleteIconBlockAction} />
          ) : null}
          <Result result={result} />
        </div>
      </form>
    </FormCard>
  );
}

export function ProjectEditor({
  item,
  cover,
}: {
  item?: ProjectValues & { id: string };
  cover?: { source: string; type: "IMAGE" | "VIDEO" } | null;
}) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const defaults: ProjectValues = item || {
    slug: "",
    title: "",
    category: "",
    problem: "",
    solution: "",
    outcome: null,
    externalLinks: [],
    featured: false,
    order: 0,
    markdown: null,
    visualBlock: null,
    visualText: null,
  };

  const form = useForm<ProjectValues>({
    resolver: zodResolver(upsertProjectSchema),
    defaultValues: defaults,
  });

  const submit = item
    ? (values: ProjectValues) => actions.updateProjectAction({ ...values, id: item.id })
    : actions.createProjectAction;

  return (
    <FormCard title={item ? item.title : "New project"} description={item?.slug}>
      {item && cover ? (
        <MediaUploader
          owner={{ type: "project-cover", id: item.id }}
          source={cover.source}
          type={cover.type}
          title="Project cover image"
        />
      ) : null}
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => setResult(await submit(values)))}
      >
        <Field label="Title">
          <Input {...form.register("title")} />
        </Field>
        <Field label="Slug">
          <Input readOnly={Boolean(item)} {...form.register("slug")} />
          {item ? (
            <p className="text-xs text-muted">
              Slugs are immutable because public selectors and cache identity depend on them.
            </p>
          ) : null}
        </Field>
        <Field label="Category">
          <Input {...form.register("category")} />
        </Field>
        <Field label="Order">
          <Input type="number" {...form.register("order", { valueAsNumber: true })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Problem">
            <Textarea rows={4} {...form.register("problem")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Solution">
            <Textarea rows={4} {...form.register("solution")} />
          </Field>
        </div>
        <Field label="Outcome">
          <Textarea {...form.register("outcome")} />
        </Field>
        <Field label="Visual text">
          <Textarea {...form.register("visualText")} />
        </Field>
        <Field label="Approved visual">
          <Select {...form.register("visualBlock")}>
            <option value="">None</option>
            <option>Pay4MeVisual</option>
            <option>PortfolioAssistantVisual</option>
            <option>EmailWorkflowVisual</option>
          </Select>
        </Field>
        <Field label="External links (one per line)">
          <Textarea
            defaultValue={defaults.externalLinks.join("\n")}
            onChange={(event) =>
              form.setValue(
                "externalLinks",
                event.target.value
                  .split("\n")
                  .map((value) => value.trim())
                  .filter(Boolean),
              )
            }
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Project markdown">
            <Textarea rows={8} {...form.register("markdown")} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" {...form.register("featured")} /> Featured
        </label>
        <div className="flex flex-wrap items-end gap-4">
          <Button type="submit">{item ? "Save project" : "Create project"}</Button>
          {item ? (
            <DeleteButton id={item.id} label={item.title} action={actions.deleteProjectAction} />
          ) : null}
          <Result result={result} />
        </div>
      </form>
    </FormCard>
  );
}

export function ExperienceEditor({
  item,
}: {
  item?: Omit<ExperienceValues, "startDate" | "endDate"> & {
    id: string;
    startDate: string | null;
    endDate: string | null;
  };
}) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const defaults = item || {
    title: "",
    tag: null,
    copy: "",
    insight: null,
    role: null,
    startDate: null,
    endDate: null,
    order: 0,
  };

  const form = useForm<ExperienceValues>({
    resolver: zodResolver(upsertExperienceSchema),
    defaultValues: defaults,
  });

  const submit = item
    ? (values: ExperienceValues) => actions.updateExperienceAction({ ...values, id: item.id })
    : actions.createExperienceAction;

  return (
    <FormCard title={item ? item.title : "New experience"}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => setResult(await submit(values)))}
      >
        <Field label="Title">
          <Input {...form.register("title")} />
        </Field>
        <Field label="Tag">
          <Input {...form.register("tag")} />
        </Field>
        <Field label="Role">
          <Input {...form.register("role")} />
        </Field>
        <Field label="Order">
          <Input type="number" {...form.register("order", { valueAsNumber: true })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Copy">
            <Textarea rows={4} {...form.register("copy")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Insight">
            <Textarea {...form.register("insight")} />
          </Field>
        </div>
        <Field label="Start date">
          <Input
            type="date"
            {...form.register("startDate", {
              setValueAs: (value) => (value ? new Date(`${value}T00:00:00.000Z`) : null),
            })}
          />
        </Field>
        <Field label="End date">
          <Input
            type="date"
            {...form.register("endDate", {
              setValueAs: (value) => (value ? new Date(`${value}T00:00:00.000Z`) : null),
            })}
          />
        </Field>
        <div className="flex flex-wrap items-end gap-4">
          <Button type="submit">{item ? "Save experience" : "Create experience"}</Button>
          {item ? (
            <DeleteButton id={item.id} label={item.title} action={actions.deleteExperienceAction} />
          ) : null}
          <Result result={result} />
        </div>
      </form>
    </FormCard>
  );
}

export function ActionEditor({ item }: { item?: ActionValues & { id: string } }) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const defaults: ActionValues = item || {
    iconName: null,
    label: "",
    copy: null,
    colour: null,
    variant: "PRIMARY",
    url: null,
    assistantMessage: null,
  };

  const form = useForm<ActionValues>({
    resolver: zodResolver(upsertActionBlockSchema),
    defaultValues: defaults,
  });

  const selectedIcon = useWatch({ control: form.control, name: "iconName" });

  const submit = item
    ? (values: ActionValues) => actions.updateActionBlockAction({ ...values, id: item.id })
    : actions.createActionBlockAction;

  return (
    <FormCard title={item ? item.label : "New action"}>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => setResult(await submit(values)))}
      >
        <Field label="Label">
          <Input {...form.register("label")} />
        </Field>
        <Field label="Variant">
          <Select {...form.register("variant")}>
            <option>PRIMARY</option>
            <option>SECONDARY</option>
            <option>GHOST</option>
            <option>LINK</option>
          </Select>
        </Field>
        <Field label="URL or site path">
          <Input placeholder="/work or https://example.com" {...form.register("url")} />
        </Field>
        <Field label="Assistant message">
          <Textarea {...form.register("assistantMessage")} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Supporting copy">
            <Textarea {...form.register("copy")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Icon">
            <IconPicker
              value={selectedIcon}
              onChange={(value) => form.setValue("iconName", value)}
            />
          </Field>
        </div>
        <Button type="submit">{item ? "Save action" : "Create action"}</Button>
        {item ? (
          <DeleteButton id={item.id} label={item.label} action={actions.deleteActionBlockAction} />
        ) : null}
        <Result result={result} />
      </form>
    </FormCard>
  );
}

export function MediaMetadataEditor({
  item,
}: {
  item: MediaValues & { id: string; source: string; type: "IMAGE" | "VIDEO" };
}) {
  const actions = useAdminActions();

  const [result, setResult] = useState<AdminActionResult | null>(null);

  const form = useForm<MediaValues>({
    resolver: zodResolver(mediaMetadataSchema),
    defaultValues: item,
  });

  const selectedIcon = useWatch({ control: form.control, name: "iconName" });

  return (
    <FormCard title={item.label}>
      <MediaUploader
        owner={{ type: "media-block", id: item.id }}
        source={item.source}
        type={item.type}
        title="Managed media file"
      />
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) =>
          setResult(await actions.updateMediaBlockAction({ ...values, id: item.id })),
        )}
      >
        <Field label="Label">
          <Input {...form.register("label")} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Alternative text">
            <Input {...form.register("altText")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Supporting copy">
            <Textarea {...form.register("copy")} />
          </Field>
        </div>
        <div className="md:col-span-2">
          <Field label="Icon">
            <IconPicker
              value={selectedIcon}
              onChange={(value) => form.setValue("iconName", value)}
            />
          </Field>
        </div>
        <Button type="submit">Save metadata</Button>
        <DeleteButton id={item.id} label={item.label} action={actions.deleteMediaBlockAction} />
        <Result result={result} />
      </form>
    </FormCard>
  );
}
