interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Calendly MCP Pack — wraps the Calendly API v2 for scheduling data.
 *
 * BYO key: pass _apiKey (Calendly personal access token), sent as a Bearer token.
 * Auth: Authorization: Bearer <token>.
 *
 * Quirk: most endpoints REQUIRE a user or organization URI. Callers should call
 * `current_user` first to obtain both URIs, then pass them to the other tools.
 * Pagination via `count` + `page_token`.
 */


const BASE = 'https://api.calendly.com';
const UA = 'pipeworx-mcp-calendly/1.0 (+https://pipeworx.io)';

async function calendlyGet(apiKey: string, path: string, params?: URLSearchParams): Promise<unknown> {
  const qs = params?.toString();
  const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'User-Agent': UA,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendly: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

// -- Tool definitions --------------------------------------------------------

const tools: McpToolExport['tools'] = [
  {
    name: 'current_user',
    description:
      'Get the current Calendly user for the supplied token. Returns the user URI and organization URI — call this FIRST, since list_scheduled_events and list_event_types require a user or organization URI.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Calendly personal access token (sent as Bearer token)' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'list_scheduled_events',
    description:
      'List scheduled meetings (events). Requires a user URI OR an organization URI (get them from current_user). Filter by status, time window, and paginate. Returns event URIs/UUIDs, names, start/end times, status, and locations.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Calendly personal access token (sent as Bearer token)' },
        user: { type: 'string', description: 'User URI (from current_user). Provide user OR organization.' },
        organization: { type: 'string', description: 'Organization URI (from current_user). Provide user OR organization.' },
        status: { type: 'string', enum: ['active', 'canceled'], description: 'Filter by event status.' },
        min_start_time: { type: 'string', description: 'ISO 8601 timestamp; only events starting at/after this time.' },
        max_start_time: { type: 'string', description: 'ISO 8601 timestamp; only events starting at/before this time.' },
        count: { type: 'number', description: 'Number of results per page (default 20, max 100).' },
        page_token: { type: 'string', description: 'Token from a previous response for the next page.' },
      },
      required: ['_apiKey'],
    },
  },
  {
    name: 'get_event',
    description:
      'Get a single scheduled event by its UUID (the last path segment of an event URI). Returns full event details including name, times, status, location, and event membership.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Calendly personal access token (sent as Bearer token)' },
        uuid: { type: 'string', description: 'Scheduled event UUID (last segment of the event URI).' },
      },
      required: ['_apiKey', 'uuid'],
    },
  },
  {
    name: 'list_invitees',
    description:
      'List the invitees of a scheduled event by event UUID. Returns invitee names, emails, status (active/canceled), timezone, and answers to booking questions.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Calendly personal access token (sent as Bearer token)' },
        uuid: { type: 'string', description: 'Scheduled event UUID (last segment of the event URI).' },
        status: { type: 'string', enum: ['active', 'canceled'], description: 'Filter invitees by status.' },
        count: { type: 'number', description: 'Number of results per page (default 20, max 100).' },
        page_token: { type: 'string', description: 'Token from a previous response for the next page.' },
      },
      required: ['_apiKey', 'uuid'],
    },
  },
  {
    name: 'list_event_types',
    description:
      'List bookable event types (meeting templates). Requires a user URI OR an organization URI (get them from current_user). Returns event type URIs, names, durations, scheduling URLs, and active state.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        _apiKey: { type: 'string', description: 'Calendly personal access token (sent as Bearer token)' },
        user: { type: 'string', description: 'User URI (from current_user). Provide user OR organization.' },
        organization: { type: 'string', description: 'Organization URI (from current_user). Provide user OR organization.' },
        active: { type: 'boolean', description: 'If true, only return active event types.' },
        count: { type: 'number', description: 'Number of results per page (default 20, max 100).' },
        page_token: { type: 'string', description: 'Token from a previous response for the next page.' },
      },
      required: ['_apiKey'],
    },
  },
];

// -- callTool dispatcher -----------------------------------------------------

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = args._apiKey as string | undefined;
  delete args._context;
  delete args._apiKey;

  if (!apiKey) throw new Error('_apiKey is required: pass your Calendly personal access token (sent as a Bearer token).');

  switch (name) {
    case 'current_user':
      return calendlyGet(apiKey, '/users/me');

    case 'list_scheduled_events': {
      if (!args.user && !args.organization) {
        throw new Error('list_scheduled_events requires a "user" or "organization" URI. Call current_user first to obtain them.');
      }
      const params = new URLSearchParams();
      if (args.user) params.set('user', args.user as string);
      if (args.organization) params.set('organization', args.organization as string);
      if (args.status) params.set('status', args.status as string);
      if (args.min_start_time) params.set('min_start_time', args.min_start_time as string);
      if (args.max_start_time) params.set('max_start_time', args.max_start_time as string);
      if (args.count) params.set('count', String(Math.min(100, args.count as number)));
      if (args.page_token) params.set('page_token', args.page_token as string);
      return calendlyGet(apiKey, '/scheduled_events', params);
    }

    case 'get_event':
      return calendlyGet(apiKey, `/scheduled_events/${encodeURIComponent(args.uuid as string)}`);

    case 'list_invitees': {
      const params = new URLSearchParams();
      if (args.status) params.set('status', args.status as string);
      if (args.count) params.set('count', String(Math.min(100, args.count as number)));
      if (args.page_token) params.set('page_token', args.page_token as string);
      return calendlyGet(apiKey, `/scheduled_events/${encodeURIComponent(args.uuid as string)}/invitees`, params);
    }

    case 'list_event_types': {
      if (!args.user && !args.organization) {
        throw new Error('list_event_types requires a "user" or "organization" URI. Call current_user first to obtain them.');
      }
      const params = new URLSearchParams();
      if (args.user) params.set('user', args.user as string);
      if (args.organization) params.set('organization', args.organization as string);
      if (args.active !== undefined) params.set('active', String(args.active));
      if (args.count) params.set('count', String(Math.min(100, args.count as number)));
      if (args.page_token) params.set('page_token', args.page_token as string);
      return calendlyGet(apiKey, '/event_types', params);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
