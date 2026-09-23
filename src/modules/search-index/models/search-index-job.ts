export type SearchIndexJobStatus = "pending" | "processing" | "completed" | "failed";

export type SearchIndexJob = {
  jobKey: "portfolio";
  status: SearchIndexJobStatus;
  rerunRequested: boolean;
  attempts: number;
  availableAt: Date;
  requestedAt: Date;
  claimedAt: Date | null;
  processedAt: Date | null;
  lastError: string | null;
};

export type ClaimedSearchIndexJob = Omit<SearchIndexJob, "status" | "claimedAt"> & {
  status: "processing";
  claimedAt: Date;
};

export type SearchIndexJobClaimResult = {
  job: ClaimedSearchIndexJob | null;
  staleJobRecovered: boolean;
};
