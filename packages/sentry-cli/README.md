# @sentry/cli

Lightweight CLI for interacting with Sentry. Zero setup - just needs a Sentry access token.

## Why This Exists

The Sentry MCP server exposes 20 tools with comprehensive schemas, consuming ~43K tokens just for tool definitions. This is expensive when using AI agents that need Sentry access.

This CLI provides a simple command-line interface that:
- **Spawns the MCP server as a subprocess** (stdio mode)
- **No separate server needed** - just run commands!
- **Zero token overhead** - AI agents call the CLI, not MCP tools
- **Simple authentication** - just an access token

## Prerequisites

- **Node.js 20+**
- **Sentry access token** ([Get one here](https://sentry.io/settings/account/api/auth-tokens/))

## Installation

```bash
# From the sentry-mcp root
pnpm install

# Build the CLI
cd packages/sentry-cli
pnpm build
```

## Quick Start

```bash
# Set your access token
export SENTRY_ACCESS_TOKEN=sntrys_your_token_here

# Run any command!
pnpm start whoami
```

That's it! The CLI automatically:
1. Spawns the MCP server as a subprocess
2. Connects via stdio (standard input/output)
3. Executes your command
4. Returns JSON results
5. Cleans up when done

## Usage

### Basic Pattern

```bash
sentry <verb> <object> [id] [options]
```

### Commands

**Information:**
```bash
sentry whoami                          # Current user info
```

**List Resources:**
```bash
sentry list organizations              # List all organizations
sentry list orgs                       # Shorthand
sentry list projects --org=sentry      # List projects in org
sentry list teams --org=sentry         # List teams
sentry list releases --org=sentry --project=javascript
sentry list issues --org=sentry --query="is:unresolved"
```

**Get Resources:**
```bash
sentry get issue JAVASCRIPT-123 --org=sentry
sentry get trace abc123def456 --org=sentry
sentry get doc "https://docs.sentry.io/platforms/javascript/"
```

**Create Resources:**
```bash
sentry create project --org=sentry --name=my-app --platform=javascript
sentry create team --org=sentry --name=backend
```

**Update Resources:**
```bash
sentry update issue JAVASCRIPT-123 --status=resolved
sentry update project my-app --org=sentry --name="My App"
```

**Search:**
```bash
sentry search events --org=sentry --query="errors from yesterday"
sentry search issues --org=sentry --query="unresolved crashes"
sentry search docs --query="error monitoring"
```

### Options

- `--access-token <token>` - Sentry access token (or set `SENTRY_ACCESS_TOKEN`)
- `--host <host>` - Sentry host (default: `sentry.io`)
- `--org <slug>` - Organization slug
- `--project <slug>` - Project slug
- `--query <query>` - Search query (natural language or Sentry syntax)
- `--status <status>` - Issue status (resolved, unresolved, etc.)
- `--name <name>` - Resource name
- `--platform <platform>` - Project platform
- `-v, --verbose` - Verbose output

### Environment Variables

```bash
# Set once, use everywhere
export SENTRY_ACCESS_TOKEN=sntrys_your_token_here

# Optional: for self-hosted Sentry
export SENTRY_HOST=sentry.example.com
```

### Examples

```bash
# Get current user
sentry whoami

# List organizations
sentry list orgs

# List projects in an org
sentry list projects --org=sentry

# Get issue details
sentry get issue JAVASCRIPT-123 --org=sentry

# Search for errors
sentry search events --org=sentry --query="database errors yesterday"

# Create a new project
sentry create project --org=sentry --name=new-app --platform=javascript

# Update issue status
sentry update issue JAVASCRIPT-123 --status=resolved
```

## Output Format

The CLI outputs JSON by default, making it easy to pipe to `jq` or other tools:

```bash
# Pretty print with jq
sentry list orgs | jq .

# Extract specific fields
sentry list projects --org=sentry | jq '.[].slug'

# Count issues
sentry search issues --org=sentry --query="is:unresolved" | jq '. | length'
```

## How It Works

When you run a command:

1. **CLI spawns MCP server** as a subprocess
2. **Connects via stdio** (standard input/output pipes)
3. **Passes your command** to the appropriate MCP tool
4. **Returns JSON results** to stdout
5. **Cleans up** the subprocess when done

This means:
- ✅ No separate server to manage
- ✅ No OAuth complexity
- ✅ No port conflicts
- ✅ Works offline (with valid token)
- ✅ Zero overhead - subprocess only runs during commands

## For AI Agents

Instead of loading 43K tokens of MCP tool definitions, AI agents can just:

```bash
# Execute CLI commands
sentry list projects --org=sentry

# Parse JSON output
{
  "projects": [
    {"slug": "javascript", "name": "JavaScript"},
    {"slug": "python", "name": "Python"}
  ]
}
```

**Token Savings:**
- **Before**: ~43K tokens for tool definitions
- **After**: ~0 tokens (just CLI commands)
- **Result**: Massively reduced context usage! 🎉

## Troubleshooting

### "Missing access token"

Set your Sentry access token:
```bash
export SENTRY_ACCESS_TOKEN=your_token_here
# Or use --access-token flag
```

### "Failed to connect to MCP server"

Make sure the MCP server package is built:
```bash
cd ../mcp-server
pnpm build
```

### "Module not found"

Rebuild both packages:
```bash
# From sentry-mcp root
pnpm install
pnpm build
```

## Development

```bash
# Run without building
pnpm start whoami

# Build
pnpm build

# Run built version
node dist/index.js whoami

# Watch mode (for development)
pnpm dev whoami
```

## Self-Hosted Sentry

For self-hosted Sentry instances:

```bash
sentry whoami --host=sentry.example.com
# Or set environment variable
export SENTRY_HOST=sentry.example.com
```

## License

MIT
