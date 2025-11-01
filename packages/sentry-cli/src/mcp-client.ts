import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { logError, logInfo } from "./logger.js";
import type { MCPConnection } from "./types.js";

export async function connectToMCPServer(
  accessToken: string,
  sentryHost?: string,
  verbose?: boolean,
): Promise<MCPConnection> {
  try {
    const args = [`--access-token=${accessToken}`];

    if (sentryHost) {
      args.push(`--host=${sentryHost}`);
    }

    // Resolve the path to the mcp-server binary
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const mcpServerPath = join(__dirname, "../../mcp-server/dist/index.js");

    if (verbose) {
      logInfo(`Starting MCP server: ${mcpServerPath}`);
    }

    // Create stdio transport
    const transport = new StdioClientTransport({
      command: "node",
      args: [mcpServerPath, ...args],
      env: {
        ...process.env,
        SENTRY_ACCESS_TOKEN: accessToken,
        SENTRY_HOST: sentryHost || "sentry.io",
      },
    });

    // Import the Client class
    const { Client } = await import(
      "@modelcontextprotocol/sdk/client/index.js"
    );

    const client = new Client(
      {
        name: "sentry-cli",
        version: "0.1.0",
      },
      {
        capabilities: {},
      },
    );

    await client.connect(transport);

    if (verbose) {
      logInfo("Connected to MCP server via stdio");
    }

    const disconnect = async () => {
      await client.close();
    };

    return {
      client,
      disconnect,
    };
  } catch (error) {
    logError(
      "Failed to connect to MCP server",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}
