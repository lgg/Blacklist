/**
 * Service worker (MV3 replacement for the old persistent background page).
 *
 * It owns the single source of truth for declarativeNetRequest rules: it
 * resyncs them from storage on install/startup and whenever the popup or
 * blocked page asks it to mutate the blocklist.
 */

import { blockHost, clearAll, syncRules, unblockHost } from "./lib/blocklist.js";
import type { Ack, Message } from "./lib/messages.js";

chrome.runtime.onInstalled.addListener(() => {
  void syncRules();
});

chrome.runtime.onStartup.addListener(() => {
  void syncRules();
});

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (ack: Ack) => void) => {
    handle(message)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) =>
        sendResponse({ ok: false, error: String(error) }),
      );
    // Returning true keeps the message channel open for the async response.
    return true;
  },
);

async function handle(message: Message): Promise<void> {
  switch (message.type) {
    case "block":
      await blockHost(message.host);
      break;
    case "unblock":
      await unblockHost(message.host);
      break;
    case "clear":
      await clearAll();
      break;
  }
}
