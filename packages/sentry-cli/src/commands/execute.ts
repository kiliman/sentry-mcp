import type { CommandContext } from "../types.js";
import { logJSON, logError, logInfo } from "../logger.js";
import { parseSentryUrl } from "../utils/url-parser.js";

// Map CLI commands to MCP tools
const TOOL_MAP: Record<string, Record<string, string>> = {
  whoami: {
    "": "whoami",
  },
  get: {
    issue: "get_issue_details",
    issues: "get_issue_details",
    trace: "get_trace_details",
    traces: "get_trace_details",
    attachment: "get_event_attachment",
    attachments: "get_event_attachment",
    doc: "get_doc",
    docs: "get_doc",
  },
  list: {
    organizations: "find_organizations",
    orgs: "find_organizations",
    projects: "find_projects",
    teams: "find_teams",
    releases: "find_releases",
    dsns: "find_dsns",
    issues: "search_issues",
  },
  create: {
    project: "create_project",
    projects: "create_project",
    team: "create_team",
    teams: "create_team",
    dsn: "create_dsn",
    dsns: "create_dsn",
  },
  update: {
    issue: "update_issue",
    issues: "update_issue",
    project: "update_project",
    projects: "update_project",
  },
  search: {
    events: "search_events",
    issues: "search_issues",
    docs: "search_docs",
  },
};

interface CommandArgs {
  verb: string;
  object?: string;
  id?: string;
  options: Record<string, any>;
}

export async function executeCommand(
  context: CommandContext,
  args: CommandArgs,
): Promise<void> {
  const { verb, object, id, options } = args;

  // Special case: whoami doesn't need an object
  if (verb === "whoami") {
    const toolName = "whoami";
    await callTool(context, toolName, {});
    return;
  }

  // Get the tool name from the map
  if (!object) {
    logError("Missing object", "Please specify what resource to operate on");
    process.exit(1);
  }

  const verbMap = TOOL_MAP[verb];
  if (!verbMap) {
    logError(
      "Unknown verb",
      `'${verb}' is not a valid command. Try: get, list, create, update, delete, search, whoami`,
    );
    process.exit(1);
  }

  const toolName = verbMap[object];
  if (!toolName) {
    logError(
      "Unknown object",
      `'${object}' is not valid for '${verb}'. Available: ${Object.keys(verbMap).join(", ")}`,
    );
    process.exit(1);
  }

  // Build parameters based on tool and options
  const params: Record<string, any> = {};

  // Add organization/project if provided
  if (options.org) {
    params.organizationSlug = options.org;
  }
  if (options.project) {
    params.projectSlug = options.project;
  }

  // Add ID if provided (for get/update/delete)
  if (id) {
    // Try to parse as Sentry URL first
    const parsed = parseSentryUrl(id);

    if (parsed) {
      // URL was successfully parsed
      if (toolName === "get_issue_details" || toolName === "update_issue") {
        params.issueId = parsed.id;
      } else if (toolName === "get_trace_details") {
        params.traceId = parsed.id;
      } else if (toolName === "get_event_attachment") {
        params.eventId = parsed.id;
      }

      // Auto-populate org from URL if not explicitly provided
      if (parsed.organizationSlug && !options.org) {
        params.organizationSlug = parsed.organizationSlug;
        if (context.config.verbose) {
          logInfo(
            "Extracted from URL",
            `Organization: ${parsed.organizationSlug}`,
          );
        }
      }
    } else {
      // Not a URL, use as-is
      if (toolName === "get_issue_details" || toolName === "update_issue") {
        params.issueId = id;
      } else if (toolName === "get_trace_details") {
        params.traceId = id;
      } else if (toolName === "get_event_attachment") {
        params.eventId = id;
      } else if (toolName === "get_doc") {
        params.url = id;
      }
    }
  }

  // Add search query for search commands
  if (options.query) {
    if (toolName === "search_events" || toolName === "search_issues") {
      params.naturalLanguageQuery = options.query;
    } else if (toolName === "search_docs") {
      params.query = options.query;
    }
  }

  // Add create/update specific params
  if (options.name) {
    params.name = options.name;
  }
  if (options.platform) {
    params.platform = options.platform;
  }
  if (options.status) {
    params.status = options.status;
  }

  // Call the tool
  await callTool(context, toolName, params);
}

async function callTool(
  context: CommandContext,
  toolName: string,
  params: Record<string, any>,
): Promise<void> {
  try {
    if (context.config.verbose) {
      logInfo(`Calling tool: ${toolName}`, JSON.stringify(params, null, 2));
    }

    // Call the MCP tool
    const result = await context.connection.client.callTool({
      name: toolName,
      arguments: params,
    });

    // Extract content from MCP response
    if (result.content && Array.isArray(result.content)) {
      const textContent = result.content.find(
        (item: any) => item.type === "text",
      );
      if (textContent?.text) {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(textContent.text);
          logJSON(parsed);
        } catch {
          // Not JSON, output as-is
          console.log(textContent.text);
        }
      } else {
        // Output full content array
        logJSON(result.content);
      }
    } else {
      // Output whatever we got
      logJSON(result);
    }
  } catch (error) {
    logError(
      "Tool execution failed",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}
