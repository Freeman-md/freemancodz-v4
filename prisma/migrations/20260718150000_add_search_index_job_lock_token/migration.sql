-- A generated UUID lease token avoids timestamp precision collisions between workers.
ALTER TABLE "search_index_jobs" ADD COLUMN "lock_token" UUID;
