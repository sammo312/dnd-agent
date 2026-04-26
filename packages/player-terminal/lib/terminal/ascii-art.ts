import { ANSI } from '@dnd-agent/dm-terminal/lib/terminal/ansi';

export const PLAYER_BANNER = `
${ANSI.system}${ANSI.bold}
  ██████╗ ██╗      █████╗ ██╗   ██╗███████╗██████╗
  ██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝██╔════╝██╔══██╗
  ██████╔╝██║     ███████║ ╚████╔╝ █████╗  ██████╔╝
  ██╔═══╝ ██║     ██╔══██║  ╚██╔╝  ██╔══╝  ██╔══██╗
  ██║     ███████╗██║  ██║   ██║   ███████╗██║  ██║
  ╚═╝     ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
${ANSI.reset}
${ANSI.dimText}  Player Companion — Character, Story & Advice${ANSI.reset}
${ANSI.dimText}  ─────────────────────────────────────────────${ANSI.reset}
`;
