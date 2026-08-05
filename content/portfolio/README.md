# Portfolio content

These typed files are the editable source of truth for portfolio content. Edit a scope, then run `npm run content:sync -- <scope>` locally. After verification, use `npm run content:sync:production -- <scope>` deliberately. The production command includes the required `--confirm-production` flag and identifies its target before writing.

The normal sync inserts and updates only the selected records. It does not delete records, rebuild the search index, or run automatically during deployment. Changed records are queued for the existing search-index worker.
