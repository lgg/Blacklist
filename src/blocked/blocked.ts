/**
 * The page a blocked navigation lands on. It preserves the original UX: an
 * "unlist" action that forces a 15-second wait (with a cancel button) before
 * the site is removed from the blacklist and you're redirected back to it.
 */

import {
  clearLastBlockedUrl,
  getLastBlockedUrl,
  normalizeHost,
} from "../lib/blocklist.js";
import { sendMessage } from "../lib/messages.js";

const UNLIST_SECONDS = 10;

const motivationPhrases = [
  "Не теряй время",
  "Ничего страшного нет, просто начни",
  "Подумай о семье",
  "А зачем ты этим занимаешься?",
  "Почему ты зашел сюда?",
  "Давай, соберись",
  "У тебя получится",
  "Я верю в тебя",
  "Ты сможешь",
  "Просто начни",
  "Попробуй начать",
  "Встань и подыши",
  "Просто открой то, что нужно сделать",
  "Что не так в этот раз?",
  "Это несерьезно",
  "Надо делать деньги",
  "Тебе нужны бабки?",
  "И как ты достигнешь чего-то?",
  "Да сколько можно?",
  "Делай, делай, делай",
  "Мой отец работал много, мать немногим меньше",
  "Мне нужно больше денег",
  "Просто закончи с этим",
  "Возьми себя в руки",
  "Сегодня именно тот день, когда ты изменишь себя",
  "Пора меняться",
  "У тебя все получится",
  "Иди работай",
  "Just Do It!",
  "Ламба сама себя не купит",
  "Не стыдно?",
  "Да, ты зашел сюда, но ты молодец. Иди работай дальше",
  "Хватит прокрастинировать",
  "Почему ты прокрастинируешь?",
  "Что не так?",
];

const messageEl = document.getElementById("message") as HTMLHeadingElement;
const siteEl = document.getElementById("site") as HTMLParagraphElement;
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
  messageEl.textContent =
    motivationPhrases[Math.floor(Math.random() * motivationPhrases.length)] ??
    "Не теряй время";
  siteEl.textContent = host
    ? `${host} is blacklisted.`
    : "This site is blacklisted.";
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
  const redirectUrl = (await getLastBlockedUrl(host)) ?? `https://${host}/`;
  await clearLastBlockedUrl(host);
  location.replace(redirectUrl);
}

unlistEl.addEventListener("click", startCountdown);
cancelEl.addEventListener("click", cancelCountdown);

renderMessage();
