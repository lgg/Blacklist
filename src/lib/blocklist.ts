/**
 * Shared blocklist logic: persistence in chrome.storage.local and the
 * declarativeNetRequest (DNR) dynamic rules that actually do the blocking.
 *
 * Manifest V3 removed blocking webRequest, so instead of intercepting each
 * request in a background page we install one DNR redirect rule per blocked
 * host. Any top-level navigation to a blocked host is redirected to the
 * extension's blocked.html page.
 */

const STORAGE_KEY = "blockedSites";

/** Page (inside the extension) that a blocked navigation is redirected to. */
export const BLOCKED_PAGE = "blocked.html";

/**
 * Normalize a hostname so that, e.g., "www.example.com" and "example.com" are
 * treated the same. DNR's `requestDomains` already matches subdomains, so by
 * stripping a leading "www." we block the registrable domain and everything
 * under it.
 */
export function normalizeHost(host: string): string {
  return host.replace(/^www\./i, "").toLowerCase();
}

/** Extract a normalized, blockable host from a URL, or null if not http(s). */
export function hostFromUrl(url: string): string | null {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return null;
    if (!hostname) return null;
    return normalizeHost(hostname);
  } catch {
    return null;
  }
}

/** Read the current list of blocked hosts. */
export async function getBlockedSites(): Promise<string[]> {
  const items = await chrome.storage.local.get(STORAGE_KEY);
  const sites = items[STORAGE_KEY];
  return Array.isArray(sites) ? (sites as string[]) : [];
}

async function setBlockedSites(sites: string[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: sites });
}

/** Is the given URL currently blocked? */
export async function isBlocked(url: string): Promise<boolean> {
  const host = hostFromUrl(url);
  if (!host) return false;
  const sites = await getBlockedSites();
  return sites.includes(host);
}

/** Build the full DNR ruleset from a list of hosts. */
function buildRules(sites: string[]): chrome.declarativeNetRequest.Rule[] {
  return sites.map((host, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        extensionPath: `/${BLOCKED_PAGE}?site=${encodeURIComponent(host)}`,
      },
    },
    condition: {
      requestDomains: [host],
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));
}

/**
 * Replace all of the extension's dynamic rules with a fresh set derived from
 * storage. Safe to call on startup and after every change.
 */
export async function syncRules(): Promise<void> {
  const sites = await getBlockedSites();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: buildRules(sites),
  });
}

/** Add a host to the blocklist (idempotent) and refresh the rules. */
export async function blockHost(host: string): Promise<void> {
  const normalized = normalizeHost(host);
  const sites = await getBlockedSites();
  if (!sites.includes(normalized)) {
    sites.push(normalized);
    await setBlockedSites(sites);
  }
  await syncRules();
}

/** Remove a host from the blocklist and refresh the rules. */
export async function unblockHost(host: string): Promise<void> {
  const normalized = normalizeHost(host);
  const sites = (await getBlockedSites()).filter((s) => s !== normalized);
  await setBlockedSites(sites);
  await syncRules();
}

/** Clear the entire blocklist. */
export async function clearAll(): Promise<void> {
  await setBlockedSites([]);
  await syncRules();
}
