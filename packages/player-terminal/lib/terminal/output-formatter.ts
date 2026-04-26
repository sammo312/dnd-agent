import { ANSI } from '@dnd-agent/dm-terminal/lib/terminal/ansi';
import { formatDiceRoll, formatSystemMessage } from '@dnd-agent/dm-terminal/lib/terminal/output-formatter';

export function formatPlayerWelcome(): string {
  return (
    `${ANSI.system}Your companion for character building, story recaps, and advice.${ANSI.reset}\r\n` +
    `${ANSI.dimText}Commands: /roll <dice>, /sheet, /recap, /advice <topic>, /help${ANSI.reset}\r\n`
  );
}

export function renderPlayerToolResult(toolName: string, result: unknown): string | null {
  if (toolName === 'rollDice' && result) {
    const r = result as { notation: string; rolls: number[]; modifier: number; total: number; reason?: string };
    return formatDiceRoll(r.notation, r.rolls, r.modifier, r.total, r.reason);
  }

  if (toolName === 'manageCharacter' && result) {
    const r = result as Record<string, unknown>;

    // If we got back the full sheet, show a brief confirmation
    if (r.name !== undefined && r.race !== undefined && r.class !== undefined) {
      const name = (r.name as string) || 'Unnamed';
      const race = (r.race as string) || '?';
      const cls = (r.class as string) || '?';
      return formatSystemMessage(`Character: ${name} — ${race} ${cls}`) + '\r\n';
    }

    // For ability score rolls, show the results
    if (r.method === '4d6 drop lowest' && r.rolls) {
      const rolls = r.rolls as Record<string, { rolls: number[]; dropped: number; total: number }>;
      const lines = [`\r\n${ANSI.mechanic}Ability Score Rolls (4d6 drop lowest):${ANSI.reset}`];
      for (const [ability, roll] of Object.entries(rolls)) {
        const kept = roll.rolls.filter((_: number, i: number) => {
          const sorted = [...roll.rolls].sort((a: number, b: number) => a - b);
          return roll.rolls[i] !== sorted[0] || i !== roll.rolls.indexOf(sorted[0]);
        });
        lines.push(
          `${ANSI.system}  ${ability.padEnd(13)} ${ANSI.dimText}[${roll.rolls.join(', ')}]${ANSI.reset} ${ANSI.dimText}drop ${roll.dropped}${ANSI.reset} ${ANSI.mechanic}= ${ANSI.bold}${roll.total}${ANSI.reset}`
        );
      }
      lines.push('');
      return lines.join('\r\n');
    }

    // For simple updates, show a brief note
    if (r.name !== undefined) return formatSystemMessage(`Name set: ${r.name}`) + '\r\n';
    if (r.race !== undefined) return formatSystemMessage(`Race set: ${r.race}`) + '\r\n';
    if (r.class !== undefined) return formatSystemMessage(`Class set: ${r.class}`) + '\r\n';
    if (r.level !== undefined) return formatSystemMessage(`Level set: ${r.level}`) + '\r\n';
    if (r.abilityScores !== undefined) return formatSystemMessage('Ability scores updated') + '\r\n';
    if (r.proficiencies !== undefined) return formatSystemMessage('Proficiencies updated') + '\r\n';
    if (r.equipment !== undefined) return formatSystemMessage('Equipment updated') + '\r\n';
    if (r.spells !== undefined) return formatSystemMessage('Spells updated') + '\r\n';
    if (r.features !== undefined) return formatSystemMessage('Features updated') + '\r\n';
    if (r.hitPoints !== undefined) return formatSystemMessage('Hit points updated') + '\r\n';
    if (r.armorClass !== undefined) return formatSystemMessage(`AC set: ${r.armorClass}`) + '\r\n';
    if (r.backstory !== undefined) return formatSystemMessage('Backstory saved') + '\r\n';

    return null;
  }

  if (toolName === 'lookupRules' && result) {
    const r = result as Record<string, unknown>;
    if (r.explanation) {
      return `\r\n${ANSI.system}[Rules: ${r.topic || r.class || r.race}]${ANSI.reset}\r\n`;
    }
    if (r.info) {
      return `\r\n${ANSI.system}[Info: ${r.class || r.race}]${ANSI.reset}\r\n`;
    }
    return null;
  }

  if (toolName === 'storyRecap' && result) {
    return `\r\n${ANSI.system}[Story]${ANSI.reset}\r\n`;
  }

  // Unknown tool — return null to fall back to default rendering
  return null;
}
