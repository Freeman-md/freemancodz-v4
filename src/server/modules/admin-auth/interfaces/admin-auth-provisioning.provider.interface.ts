export type ProvisionedAdminIdentity = { id: string; email: string };

export interface IAdminAuthProvisioningProvider {
  findUserByEmail(email: string): Promise<ProvisionedAdminIdentity | null>;
  createConfirmedUser(email: string): Promise<ProvisionedAdminIdentity>;
}
