/**
 * The page a blocked navigation lands on. It preserves the original UX: an
 * "unlist" action that forces a 15-second wait (with a cancel button) before
 * the site is removed from the blacklist and you're redirected back to it.
 */

import { normalizeHost } from "../lib/blocklist.js";
import { sendMessage } from "../lib/messages.js";

const UNLIST_SECONDS = 15;

const messageEl = document.getElementById("message") as HTMLHeadingElement;
const actionsEl = document.getElementById("actions") as HTMLDivElement;
const countdownEl = document.getElementById("countdown") as HTMLDivElement;
const countdownTextEl = document.getElementById(
  "countdownText",
) as HTMLParagraphElement;
const unlistEl = document.getElementById("unlist") as HTMLButtonElement;
const cancelEl = document.getElementById("cancel") as HTMLButtonElement;

const params = new URLSearchParams(location.search);
const host = normalizeHost(params.get("site") ?? "");

function renderMessage(): void {
  messageEl.textContent = "";
  const strong = document.createElement("strong");
  strong.textContent = host || "This site";
  messageEl.append(strong, " has been blacklisted.");
}

let interval: number | undefined;

function startCountdown(): void {
  if (!host) return;
  actionsEl.hidden = true;
  countdownEl.hidden = false;

  let remaining = UNLIST_SECONDS;
  const tick = (): void => {
    countdownTextEl.textContent = `Unlisting ${host} in ${remaining} second${
      remaining === 1 ? "" : "s"
    }...`;
    if (remaining <= 0) {
      window.clearInterval(interval);
      void finishUnlist();
      return;
    }
    remaining -= 1;
  };

  tick();
  interval = window.setInterval(tick, 1000);
}

function cancelCountdown(): void {
  window.clearInterval(interval);
  countdownEl.hidden = true;
  actionsEl.hidden = false;
}

async function finishUnlist(): Promise<void> {
  countdownTextEl.textContent = `Unlisting ${host}...`;
  const ack = await sendMessage({ type: "unblock", host });
  if (!ack.ok) {
    countdownTextEl.textContent = ack.error ?? "Failed to unlist. Try again.";
    actionsEl.hidden = false;
    countdownEl.hidden = true;
    return;
  }
  // Rule is gone; navigating back to the site will no longer be redirected.
  location.replace(`https://${host}/`);
}

unlistEl.addEventListener("click", startCountdown);
cancelEl.addEventListener("click", cancelCountdown);

renderMessage();
