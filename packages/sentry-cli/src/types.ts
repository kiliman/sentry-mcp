// Shared types for Sentry CLI

export interface MCPConnection {
  client: any;
  disconnect: () => Promise<void>;
}

export interface CLIConfig {
  accessToken: string;
  sentryHost?: string;
  verbose?: boolean;
}

export interface CommandContext {
  connection: MCPConnection;
  config: CLIConfig;
}
