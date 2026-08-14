export type AdminAuthProvisioningResult = {
  status: "created" | "existing";
  userId: string;
  email: string;
};
