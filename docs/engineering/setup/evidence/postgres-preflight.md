# Disposable PostgreSQL runner preflight

Observed on 2026-11-13 while checking the prerequisites for Task 10. Docker Engine 29.6.1 ran cached image `public.ecr.aws/supabase/postgres:15.8.1.085`. The local image reported arm64 and repository digest `sha256:af083ef64d0408c8f098ee6f5c364a59b26f36fbc0f3a334a62c5c1d57362e9b`. The repository's `supabase/config.toml` specifies PostgreSQL major 15.

1. Created a new container named `freemancodz-eng-preflight-01a1d400` using `--pull never` and an ephemeral `127.0.0.1` port. Docker reported zero mounts on the successful instance.
2. The image's initialization rejected the first attempt with `POSTGRES_HOST_AUTH_METHOD=trust`. Container exit 2 and the startup log showed its internal initialization client requires authentication.
3. Recreated the same named disposable container with a randomly generated fixture password passed by environment name. The credential stayed inside the invocation and container. No host application configuration was used.
4. Queried the server from inside the container. `current_setting('server_version_num')` returned `150008`, `pg_available_extensions` contained `vector`, and `pg_roles` contained `anon`, `authenticated` and `service_role`. Command exit 0. Docker reported `running 0 0` (state, exit code, mount count).
5. Removed the named preflight container with `docker rm -fv`. Command exit 0.

This evidence establishes runner availability. Task 10 must exercise the committed migrations and tests and prove target isolation. Task 12 must validate the actual CI runner configuration and its image architecture.

The public registry also confirmed that `pgvector/pgvector:0.8.1-pg15` has Linux arm64 and AMD64 images in manifest `sha256:94aee7e88f98125114657cab98e28c5dfa8dd517a6bf83fd98b503439f1e3de6`. The digest-pinned pull succeeded. This offers one PostgreSQL 15 image for the same local and CI test harness. Its fixture can create the three roles required by the committed migrations inside the disposable instance.
