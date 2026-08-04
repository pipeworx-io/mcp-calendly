# mcp-calendly

Calendly MCP Pack — wraps the Calendly API v2 for scheduling data.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Calendly data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
