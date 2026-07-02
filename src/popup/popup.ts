/**
 * Popup UI. Shows the active tab's host and lets the user blacklist it or
 * remove it from the blacklist. Mutations are routed through the service
 * worker, which owns the declarativeNetRequest rules.
 */

import { getBlockedSites, hostFromUrl } from "../lib/blocklist.js";
import { sendMessage } from "../lib/messages.js";

const siteEl = document.getElementById("site") as HTMLParagraphElement;
const primaryEl = document.getElementById("primary") as HTMLButtonElement;
const noteEl = document.getElementById("note") as HTMLParagraphElement;
const clearEl = document.getElementById("clear") as HTMLButtonElement;

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

function show(el: HTMLElement, text?: string): void {
  if (text !== undefined) el.textContent = text;
  el.hidden = false;
}

async function render(): Promise<void> {
  const tab = await getActiveTab();
  const host = tab?.url ? hostFromUrl(tab.url) : null;

  if (!tab || !host) {
    show(noteEl, "This page can't be blacklisted.");
    return;
  }

  siteEl.textContent = "";
  siteEl.append("Current site: ");
  const strong = document.createElement("strong");
  strong.textContent = host;
  siteEl.append(strong);
  siteEl.hidden = false;

  const blocked = (await getBlockedSites()).includes(host);

  if (blocked) {
    show(primaryEl, "Remove from blacklist");
    primaryEl.onclick = () => void unblock(host, tab.id);
  } else {
    show(primaryEl, "Blacklist this site");
    primaryEl.onclick = () => void block(host, tab.id);
  }
}

async function block(host: string, tabId: number | undefined): Promise<void> {
  primaryEl.disabled = true;
  const ack = await sendMessage({ type: "block", host });
  if (!ack.ok) {
    show(noteEl, ack.error ?? "Something went wrong.");
    primaryEl.disabled = false;
    return;
  }
  // Reload the tab so the new redirect rule takes effect immediately.
  if (tabId !== undefined) await chrome.tabs.reload(tabId);
  window.close();
}

async function unblock(host: string, tabId: number | undefined): Promise<void> {
  primaryEl.disabled = true;
  const ack = await sendMessage({ type: "unblock", host });
  if (!ack.ok) {
    show(noteEl, ack.error ?? "Something went wrong.");
    primaryEl.disabled = false;
    return;
  }
  if (tabId !== undefined) await chrome.tabs.reload(tabId);
  window.close();
}

clearEl.addEventListener("click", async () => {
  const ack = await sendMessage({ type: "clear" });
  if (ack.ok) await render();
});

void render();
