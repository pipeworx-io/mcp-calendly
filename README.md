# mcp-calendly

Calendly MCP Pack — wraps the Calendly API v2 for scheduling data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `current_user` | Get the current Calendly user for the supplied token. Returns the user URI and organization URI — call this FIRST, since list_scheduled_events and list_event_types require a user or organization URI. |
| `list_scheduled_events` | List scheduled meetings (events). Requires a user URI OR an organization URI (get them from current_user). Filter by status, time window, and paginate. Returns event URIs/UUIDs, names, start/end times, status, and locations. |
| `get_event` | Get a single scheduled event by its UUID (the last path segment of an event URI). Returns full event details including name, times, status, location, and event membership. |
| `list_invitees` | List the invitees of a scheduled event by event UUID. Returns invitee names, emails, status (active/canceled), timezone, and answers to booking questions. |
| `list_event_types` | List bookable event types (meeting templates). Requires a user URI OR an organization URI (get them from current_user). Returns event type URIs, names, durations, scheduling URLs, and active state. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "calendly": {
      "url": "https://gateway.pipeworx.io/calendly/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/calendly/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Calendly data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

## No MCP client? Call it over HTTP

This pack takes your own API key (`_apiKey`) — we don't front one for it, so there's no curl here that would run without it. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/calendly_current_user`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.
