#!/usr/bin/env node

import { Command } from "commander";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectToMCPServer } from "./mcp-client.js";
import { executeCommand } from "./commands/execute.js";
import { logError } from "./logger.js";
import type { CommandContext } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../");

// Load environment variables
config();
config({ path: path.join(rootDir, ".env") });

const program = new Command();

program
  .name("sentry")
  .description("Lightweight CLI for interacting with Sentry via MCP server")
  .version("0.1.0")
  .argument(
    "<verb>",
    "Action to perform (get, list, create, update, delete, search, whoami)",
  )
  .argument("[object]", "Resource type (issues, projects, organizations, etc.)")
  .argument("[id]", "Resource ID, short ID, or full Sentry URL")
  .option(
    "--access-token <token>",
    "Sentry access token (or set SENTRY_ACCESS_TOKEN)",
  )
  .option("--host <host>", "Sentry host (default: sentry.io)")
  .option("-v, --verbose", "Verbose output")
  .option("--org <slug>", "Organization slug (auto-extracted from URLs)")
  .option("--project <slug>", "Project slug")
  .option("--query <query>", "Search query")
  .option("--status <status>", "Issue status")
  .option("--name <name>", "Resource name")
  .option("--platform <platform>", "Project platform")
  .addHelpText(
    "after",
    `
Examples:
  $ sentry whoami
  $ sentry get issue 6883613180 --org beehiiv
  $ sentry get issue https://beehiiv.sentry.io/issues/6883613180/
  $ sentry get issue ORCHID-V2-SERVER-6W --org beehiiv
  $ sentry list issues --org beehiiv --query "is:unresolved"
  $ sentry search issues --query "errors in production" --org beehiiv
  $ sentry update issue 6883613180 --org beehiiv --status resolved

Authentication:
  Set SENTRY_ACCESS_TOKEN environment variable or use --access-token flag.
  Get a token from: https://sentry.io/settings/account/api/auth-tokens/

URL Support:
  The CLI automatically extracts issue IDs and org slugs from Sentry URLs.
  Just paste the full URL from Linear, Slack, GitHub, etc.
`,
  )
  .action(async (verb, object, id, options) => {
    try {
      // Get access token
      const accessToken =
        options.accessToken || process.env.SENTRY_ACCESS_TOKEN;

      if (!accessToken) {
        logError(
          "Missing access token",
          "Set SENTRY_ACCESS_TOKEN or use --access-token",
        );
        console.log(
          "\nGet a token from: https://sentry.io/settings/account/api/auth-tokens/",
        );
        process.exit(1);
      }

      // Connect to MCP server (spawns subprocess)
      const connection = await connectToMCPServer(
        accessToken,
        options.host,
        options.verbose,
      );

      const context: CommandContext = {
        connection,
        config: {
          accessToken,
          sentryHost: options.host,
          verbose: options.verbose,
        },
      };

      try {
        // Execute the command
        await executeCommand(context, {
          verb,
          object,
          id,
          options,
        });
      } finally {
        await connection.disconnect();
      }
    } catch (error) {
      logError(
        "Command failed",
        error instanceof Error ? error.message : String(error),
      );
      process.exit(1);
    }
  });

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  logError(
    "Unhandled error",
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});

program.parse(process.argv);
