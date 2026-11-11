# M28 browser rehearsal evidence

The production variants used disposable PostgreSQL and controlled providers. The empty registry restored a browser session with an old Meeting record, then handled chat, choices, and portfolio search. The Request Services variant used the same review, approval, and runner. The test reloaded the browser after a deliberately lost acknowledgement and verified one accepted submission by its step ID.

- Empty registry [source diff](empty.patch) and [browser capture](empty-restore.png).
- Request Services [source diff](services.patch) and [restored submission](services-restore.png).
- Meeting after the scheduled run [confirmed booking](meeting-confirmed.png).
- Confirmed Meeting during [notice retry](notice-retry.png) and after [notice needs attention](notice-attention.png).

Rebuild the variants and run the browser tests using the [workflow guide](../../../../docs/workflow-foundation.md).
