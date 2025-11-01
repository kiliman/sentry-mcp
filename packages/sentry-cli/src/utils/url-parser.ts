/**
 * Parse Sentry URLs to extract resource IDs and organization slugs
 */

interface ParsedSentryUrl {
  type: "issue" | "trace" | "event" | "unknown";
  id: string;
  organizationSlug?: string;
  projectSlug?: string;
}

/**
 * Parse a Sentry URL and extract the resource ID
 *
 * Supported formats:
 * - https://org.sentry.io/issues/123456789/
 * - https://sentry.io/organizations/org/issues/123456789/
 * - https://org.sentry.io/issues/PROJECT-ABC/
 */
export function parseSentryUrl(urlOrId: string): ParsedSentryUrl | null {
  // If it doesn't look like a URL, assume it's just an ID
  if (!urlOrId.includes("/") && !urlOrId.includes(".")) {
    return null;
  }

  try {
    const url = new URL(urlOrId);
    const pathname = url.pathname;

    // Extract organization slug from subdomain or path
    let organizationSlug: string | undefined;

    // Check subdomain (e.g., beehiiv.sentry.io)
    const hostParts = url.hostname.split(".");
    if (hostParts.length >= 3 && hostParts[hostParts.length - 2] === "sentry") {
      organizationSlug = hostParts[0];
    }

    // Check path-based org (e.g., /organizations/org-name/)
    const orgMatch = pathname.match(/\/organizations\/([^/]+)/);
    if (orgMatch) {
      organizationSlug = orgMatch[1];
    }

    // Parse issue URLs
    // Format: /issues/123456789/ or /issues/PROJECT-ABC/
    const issueMatch = pathname.match(/\/issues\/([^/?]+)/);
    if (issueMatch) {
      return {
        type: "issue",
        id: issueMatch[1],
        organizationSlug,
      };
    }

    // Parse trace URLs
    // Format: /traces/abc123def456/
    const traceMatch = pathname.match(/\/traces?\/([^/?]+)/);
    if (traceMatch) {
      return {
        type: "trace",
        id: traceMatch[1],
        organizationSlug,
      };
    }

    // Parse event URLs
    // Format: /events/abc123def456/ or /issues/123/events/abc123/
    const eventMatch = pathname.match(/\/events\/([^/?]+)/);
    if (eventMatch) {
      return {
        type: "event",
        id: eventMatch[1],
        organizationSlug,
      };
    }

    return null;
  } catch {
    // Not a valid URL
    return null;
  }
}
