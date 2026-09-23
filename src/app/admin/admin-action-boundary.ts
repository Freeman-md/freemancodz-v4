export async function runAuthorizedAdminMutation<TResult>(
  requireAdmin: () => Promise<unknown>,
  operation: () => Promise<TResult>,
) {
  await requireAdmin();

  return operation();
}
