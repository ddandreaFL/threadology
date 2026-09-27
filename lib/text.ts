// Emoji and the joiners and variation selectors that build them; built at
// runtime because the project's TypeScript target predates the `u` flag.
const EMOJI = new RegExp("[\\u{1F000}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{2300}-\\u{23FF}\\u{FE0E}\\u{FE0F}\\u{200D}\\u{20E3}\\u{E0020}-\\u{E007F}]", "gu");

/**
 * For lines that change in place (a subtitle naming the selected
 * collection): emoji make a line reflow as they come and go, so such a line
 * shows names without them — the control that set it keeps them. Same rule
 * as the app (threadology-native/lib/text.ts).
 */
export function withoutEmoji(s: string): string {
  return s.replace(EMOJI, "").replace(/\s{2,}/g, " ").trim();
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
