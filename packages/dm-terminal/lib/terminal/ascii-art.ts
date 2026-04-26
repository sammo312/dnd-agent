import { ANSI } from './ansi';

export const BANNER = `
${ANSI.amber}${ANSI.bold}        ___                                ${ANSI.reset}
${ANSI.amber}${ANSI.bold}   ____| _ \\__ _ _ ___ ___                 ${ANSI.reset}
${ANSI.amber}${ANSI.bold}  / _\\ \\  _/ '_/ -_) '_ \\                   ${ANSI.reset}
${ANSI.amber}${ANSI.bold}  \\__,_|_| |_| \\___| .__/                   ${ANSI.reset}
${ANSI.amber}${ANSI.bold}                   |_|                      ${ANSI.reset}
`;

export const DIVIDER = `${ANSI.dimText}${'─'.repeat(50)}${ANSI.reset}`;

export function diceArt(total: number): string {
  return `${ANSI.mechanic}⚄ ${total}${ANSI.reset}`;
}
