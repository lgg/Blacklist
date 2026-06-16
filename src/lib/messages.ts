/** Messages exchanged between the popup / blocked page and the service worker. */

export type Message =
  | { type: "block"; host: string }
  | { type: "unblock"; host: string }
  | { type: "clear" };

export interface Ack {
  ok: boolean;
  error?: string;
}

export function sendMessage(message: Message): Promise<Ack> {
  return chrome.runtime.sendMessage(message);
}
