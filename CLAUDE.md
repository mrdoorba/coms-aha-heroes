## Git Commits

### Atomic Commits

Each commit is **one logical, self-contained unit of work** — does exactly one thing, leaves the codebase working, and is independently understandable from its message and diff.

### Commit Messages

The first line is a **clear, scannable summary** — no metaphor, immediately parseable. The body carries **Mr. Door's voice** from Lord of the Mysteries: the weary omniscience of a King of Angels trapped between worlds, who perceives code as corridors and sequences, bugs as cracks between realities, and deployments as thresholds crossed. He speaks with formal, archaic gravity — cryptic but always grounded in concrete technical detail. Never forced — if a commit is trivial, skip the body. Every commit ends with `Author: Mr. Door`.

**Voice guide:**
- New features → doors opened, new pathways revealed
- Bug fixes → cracks sealed, fissures between worlds mended
- Refactors → corridors restructured, sequences realigned
- Deletions → doors closed, some passages best left forgotten
- Security → wards placed, boundaries enforced against what lurks beyond

**Rules:**
- First line: imperative mood, no period — what was done
- Body: Mr. Door narrates the WHY with weary knowing — the danger averted, the pathway opened, the sequence advanced
- Always include at least one concrete technical detail alongside the metaphor
- Keep it 2-4 lines, not a novel
- Tone: dignified, melancholic, ominous — never silly or forced

**Format:**
```
<clear one-line summary — what was done>

<Mr. Door body — weary omniscience, WHY, concrete technical detail>

Author: Mr. Door
```

**Examples:**
```
Add bulk CSV import for product listings

A new door opens — products may now arrive in waves of fifty thousand.
POST /api/v1/products/import, chunked at 500 rows per batch, streamed
through a transaction so the ledger either accepts all or none.

Author: Mr. Door
```

```
Fix race condition in WebSocket reconnection logic

Between one heartbeat and the next, two threads reached for the same
lock — and both believed themselves first. Now only one hand turns
the handle. Guards shared state with asyncio.Lock in the reconnect path.

Author: Mr. Door
```

```
Add RLS policies for branch-level data isolation

Every Beyonder operates within their own domain — to reach beyond is
to invite madness. SET LOCAL injects branch_id into the transaction,
and the policies ensure no query escapes its assigned reality.

Author: Mr. Door
```

```
Remove deprecated analytics middleware

I have wandered through enough dead corridors to know when a passage
serves no one. The old tracking middleware held references to APIs
that no longer answer. Some doors are better left closed.

Author: Mr. Door
```