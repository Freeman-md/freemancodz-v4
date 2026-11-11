# Assistant

The assistant panel sends visitor messages to `POST /api/chat`. The route establishes a browser session, applies rate limits, and streams newline-delimited JSON. The browser renders text, suggested replies, source links, and workflow snapshots from that stream.

The assistant offers portfolio search and context-sensitive workflow tools. It runs one tool at a time and caps the number of workflow calls in a turn. The workflow service validates each tool against the visitor’s saved draft and revision. A review action sends explicit approval to the workflow route. The transcript records the visitor’s action and one assistant reply from the saved outcome.

## Activity

A tool emits a short activity label when execution starts and a status when it finishes. The current activity replaces **Thinking…** in the pending assistant reply. The reply replaces the indicator as soon as its text arrives. Labels come from server code or workflow definitions. Model input, provider errors, and workflow payloads stay out of activity events. The browser displays one label at a time. After reload, the assistant can answer questions about the saved workflow state.

See [RAG](rag.md) for retrieval and [Workflows](workflow-foundation.md) for approval and recovery.
