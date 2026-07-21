async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    return typeof payload.error === "string" ? payload.error : "Request failed.";
  } catch {
    return "Request failed.";
  }
}