import "server-only";

export const logger = {
  error(message: string, error?: unknown) {
    console.error(message, error);
  },
  info(message: string) {
    console.log(message);
  },
};
