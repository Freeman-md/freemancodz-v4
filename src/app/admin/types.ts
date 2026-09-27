export type AdminActionResult = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

type AdminAction = (input: unknown) => Promise<AdminActionResult>;

export type AdminActions = {
  updateProfileAction: AdminAction;
  updateProfileCollectionAction: AdminAction;
  updateContentBlockAction: AdminAction;
  updateContentRelationsAction: AdminAction;
  updateExperienceIconsAction: AdminAction;
  createIconBlockAction: AdminAction;
  updateIconBlockAction: AdminAction;
  deleteIconBlockAction: AdminAction;
  createProjectAction: AdminAction;
  updateProjectAction: AdminAction;
  deleteProjectAction: AdminAction;
  createExperienceAction: AdminAction;
  updateExperienceAction: AdminAction;
  deleteExperienceAction: AdminAction;
  createActionBlockAction: AdminAction;
  updateActionBlockAction: AdminAction;
  deleteActionBlockAction: AdminAction;
  updateMediaBlockAction: AdminAction;
  deleteMediaBlockAction: AdminAction;
};
