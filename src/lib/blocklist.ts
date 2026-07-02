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
const LEGACY_STORAGE_KEY = "blocked";
const LAST_BLOCKED_URLS_KEY = "lastBlockedUrls";
let migrationPromise: Promise<void> | undefined;

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

function normalizeStoredHost(value: string): string | null {
  const fromUrl = hostFromUrl(value);
  if (fromUrl) return fromUrl;

  const candidate = normalizeHost(value.trim().replace(/\/.*$/, ""));
  return candidate && !candidate.includes(" ") ? candidate : null;
}

/** Read the current list of blocked hosts. */
export async function getBlockedSites(): Promise<string[]> {
  await migrateLegacyStorage();
  return readBlockedSites();
}

async function readBlockedSites(): Promise<string[]> {
  const items = await chrome.storage.local.get(STORAGE_KEY);
  const sites = items[STORAGE_KEY];
  return Array.isArray(sites) ? (sites as string[]) : [];
}

/** Convert the old MV2 `blocked` URL list into the MV3 host-only list. */
export async function migrateLegacyStorage(): Promise<void> {
  migrationPromise ??= (async () => {
    const items = await chrome.storage.local.get([
      STORAGE_KEY,
      LEGACY_STORAGE_KEY,
    ]);
    const current = Array.isArray(items[STORAGE_KEY])
      ? (items[STORAGE_KEY] as string[])
      : [];
    const legacy = Array.isArray(items[LEGACY_STORAGE_KEY])
      ? (items[LEGACY_STORAGE_KEY] as string[])
      : [];

    if (legacy.length === 0) return;

    const sites = [...new Set([...current, ...legacy].map(normalizeStoredHost))]
      .filter((site): site is string => Boolean(site))
      .sort();

    await chrome.storage.local.set({ [STORAGE_KEY]: sites });
    await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
  })();

  await migrationPromise;
}

async function getLastBlockedUrls(): Promise<Record<string, string>> {
  const items = await chrome.storage.local.get(LAST_BLOCKED_URLS_KEY);
  const urls = items[LAST_BLOCKED_URLS_KEY];
  return urls && typeof urls === "object"
    ? (urls as Record<string, string>)
    : {};
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

/** Remember the exact URL that triggered the block page for a host. */
export async function rememberBlockedNavigation(url: string): Promise<void> {
  const host = hostFromUrl(url);
  if (!host) return;
  const urls = await getLastBlockedUrls();
  urls[host] = url;
  await chrome.storage.local.set({ [LAST_BLOCKED_URLS_KEY]: urls });
}

/** Read the last blocked URL for a host so unlisting can return to it. */
export async function getLastBlockedUrl(host: string): Promise<string | null> {
  const normalized = normalizeHost(host);
  const urls = await getLastBlockedUrls();
  const url = urls[normalized];
  return typeof url === "string" ? url : null;
}

/** Drop a stored blocked URL once it has been used. */
export async function clearLastBlockedUrl(host: string): Promise<void> {
  const normalized = normalizeHost(host);
  const urls = await getLastBlockedUrls();
  delete urls[normalized];
  await chrome.storage.local.set({ [LAST_BLOCKED_URLS_KEY]: urls });
}

/** Build the full DNR ruleset from a list of hosts. */
function buildRules(sites: string[]): chrome.declarativeNetRequest.Rule[] {
  return sites.map((host, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        url: chrome.runtime.getURL(
          `${BLOCKED_PAGE}?site=${encodeURIComponent(host)}`,
        ),
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
  await clearLastBlockedUrl(normalized);
  await syncRules();
}

/** Clear the entire blocklist. */
export async function clearAll(): Promise<void> {
  await setBlockedSites([]);
  await chrome.storage.local.remove(LAST_BLOCKED_URLS_KEY);
  await syncRules();
}
