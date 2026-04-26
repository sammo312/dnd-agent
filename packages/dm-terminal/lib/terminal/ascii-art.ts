import { ANSI } from './ansi';

export const BANNER = `
${ANSI.narration}${ANSI.bold}
  ██████╗ ███╗   ███╗     ██████╗██╗     ██╗
  ██╔══██╗████╗ ████║    ██╔════╝██║     ██║
  ██║  ██║██╔████╔██║    ██║     ██║     ██║
  ██║  ██║██║╚██╔╝██║    ██║     ██║     ██║
  ██████╔╝██║ ╚═╝ ██║    ╚██████╗███████╗██║
  ╚═════╝ ╚═╝     ╚═╝     ╚═════╝╚══════╝╚═╝
${ANSI.reset}
${ANSI.dimText}  Dungeon Master CLI — AI-Powered Adventure${ANSI.reset}
${ANSI.dimText}  ─────────────────────────────────────────${ANSI.reset}
`;

export const DIVIDER = `${ANSI.dimText}${'─'.repeat(50)}${ANSI.reset}`;

export function diceArt(total: number): string {
  return `${ANSI.mechanic}⚄ ${total}${ANSI.reset}`;
}
