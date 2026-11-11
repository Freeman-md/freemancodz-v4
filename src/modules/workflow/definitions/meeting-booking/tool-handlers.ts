import { meetingStateSchema, topicArgumentsSchema } from "./schema";

export function saveMeetingTopic(savedState: unknown, args: unknown) {
  const state = meetingStateSchema.parse(savedState);

  const { reason } = topicArgumentsSchema.parse(args);

  return { ...state, reason };
}
