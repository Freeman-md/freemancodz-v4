"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import {
  contentRelationMutationSchema,
  entityMutationSchema,
  experienceIconsMutationSchema,
  updateContentBlockSchema,
  updateProfileCollectionSchema,
  updateProfileSchema,
  upsertActionBlockSchema,
  upsertExperienceSchema,
  upsertIconBlockSchema,
  upsertMediaBlockSchema,
  upsertProjectSchema,
} from "@/contracts/portfolio-admin.contract";
import { adminAuthService, portfolioAdministrationService } from "@/server/composition-root";
import {
  PortfolioAdministrationError,
  PortfolioCacheTag,
} from "@/server/modules/portfolio/public";
import { invalidateProjectUpdate } from "./project-cache-invalidation";
import { invalidateReusableBlockUpdate } from "./reusable-block-cache-invalidation";
import { runAuthorizedAdminMutation } from "./admin-action-boundary";

export type AdminActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

const success = (message: string, id?: string): AdminActionResult => ({
  status: "success", message, id,
});

function failure(error: unknown): AdminActionResult {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: "Review the highlighted fields and try again.",
      fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  if (error instanceof PortfolioAdministrationError) {
    return { status: "error", message: error.message };
  }

  return { status: "error", message: "The content change could not be saved." };
}

async function run(operation: () => Promise<AdminActionResult>) {
  return runAuthorizedAdminMutation(
    () => adminAuthService.requireAdmin(),
    async () => {
      try {
        return await operation();
      } catch (error) {
        return failure(error);
      }
    },
  );
}

export async function updateProfileAction(input: unknown) {
  return run(async () => {
    const parsed = updateProfileSchema.parse(input);

    await portfolioAdministrationService.updateProfile(parsed);
    updateTag(PortfolioCacheTag.profile);

    return success("Profile saved.");
  });
}

export async function updateProfileCollectionAction(input: unknown) {
  return run(async () => {
    const parsed = updateProfileCollectionSchema.parse(input);

    await portfolioAdministrationService.updateProfileCollection(parsed);
    updateTag(PortfolioCacheTag.profile);

    return success("Profile collection order saved.");
  });
}

export async function updateContentBlockAction(input: unknown) {
  return run(async () => {
    const { id, ...change } = updateContentBlockSchema.parse(input);

    await portfolioAdministrationService.updateContentBlock(id, change);
    updateTag(PortfolioCacheTag.contentBlock(id));

    return success("Page section saved.");
  });
}

export async function updateContentRelationsAction(input: unknown) {
  return run(async () => {
    const { id, relation, items } = contentRelationMutationSchema.parse(input);

    if (relation === "children") {await portfolioAdministrationService.updateContentBlockChildren(id, items);}

    if (relation === "icons") {await portfolioAdministrationService.updateContentBlockIcons(id, items);}

    if (relation === "media") {await portfolioAdministrationService.updateContentBlockMedia(id, items);}

    if (relation === "actions") {await portfolioAdministrationService.updateContentBlockActions(id, items);}

    updateTag(PortfolioCacheTag.contentBlock(id));

    return success("Section ordering saved.");
  });
}

export async function createIconBlockAction(input: unknown) {
  return run(async () => {
    const id = await portfolioAdministrationService.createIconBlock(upsertIconBlockSchema.parse(input));

    return success("Reusable icon created.", id);
  });
}

export async function updateIconBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    const change = upsertIconBlockSchema.parse(input);

    await portfolioAdministrationService.updateIconBlock(id, change);
    updateTag(PortfolioCacheTag.iconBlock(id));

    return success("Reusable icon saved.", id);
  });
}

export async function deleteIconBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.deleteIconBlock(id);
    updateTag(PortfolioCacheTag.iconBlock(id));

    return success("Reusable icon deleted.");
  });
}

export async function createActionBlockAction(input: unknown) {
  return run(async () => {
    const id = await portfolioAdministrationService.createActionBlock(upsertActionBlockSchema.parse(input));

    return success("Action created.", id);
  });
}

export async function updateActionBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.updateActionBlock(id, upsertActionBlockSchema.parse(input));
    invalidateReusableBlockUpdate("action", id, updateTag);

    return success("Action saved.", id);
  });
}

export async function deleteActionBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.deleteActionBlock(id);
    updateTag(PortfolioCacheTag.actionBlock(id));

    return success("Action deleted.");
  });
}

export async function createMediaBlockAction(input: unknown) {
  return run(async () => {
    const id = await portfolioAdministrationService.createMediaBlock(upsertMediaBlockSchema.parse(input));

    return success("Media reference created.", id);
  });
}

export async function updateMediaBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.updateMediaBlock(id, upsertMediaBlockSchema.parse(input));
    invalidateReusableBlockUpdate("media", id, updateTag);

    return success("Media reference saved.", id);
  });
}

export async function deleteMediaBlockAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.deleteMediaBlock(id);
    updateTag(PortfolioCacheTag.mediaBlock(id));

    return success("Media reference deleted.");
  });
}

export async function createProjectAction(input: unknown) {
  return run(async () => {
    const parsed = upsertProjectSchema.parse(input);

    const id = await portfolioAdministrationService.createProject(parsed);

    updateTag(PortfolioCacheTag.projects);

    return success("Project created.", id);
  });
}

export async function updateProjectAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    const parsed = upsertProjectSchema.parse(input);

    const result = await portfolioAdministrationService.updateProject(id, parsed);

    invalidateProjectUpdate(result, updateTag);

    return success("Project saved.", id);
  });
}

export async function deleteProjectAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.deleteProject(id);
    updateTag(PortfolioCacheTag.projects);

    return success("Project deleted.");
  });
}

export async function createExperienceAction(input: unknown) {
  return run(async () => {
    const id = await portfolioAdministrationService.createExperience(upsertExperienceSchema.parse(input));

    updateTag(PortfolioCacheTag.experiences);

    return success("Experience created.", id);
  });
}

export async function updateExperienceAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.updateExperience(id, upsertExperienceSchema.parse(input));
    updateTag(PortfolioCacheTag.experiences);

    return success("Experience saved.", id);
  });
}

export async function updateExperienceIconsAction(input: unknown) {
  return run(async () => {
    const { id, items } = experienceIconsMutationSchema.parse(input);

    await portfolioAdministrationService.updateExperienceIcons(id, items);
    updateTag(PortfolioCacheTag.experience(id));

    return success("Experience icons saved.", id);
  });
}

export async function deleteExperienceAction(input: unknown) {
  return run(async () => {
    const { id } = entityMutationSchema.parse(input);

    await portfolioAdministrationService.deleteExperience(id);
    updateTag(PortfolioCacheTag.experiences);

    return success("Experience deleted.");
  });
}
