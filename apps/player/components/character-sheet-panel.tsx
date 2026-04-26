"use client";

import type { CharacterSheet, InventoryItem } from "@dnd-agent/shared";

/**
 * Visual character sheet — render-only. State lives server-side in
 * the AI character-builder tool, mirrored here via the
 * `/api/character-sheet` GET endpoint. The drawer that wraps this
 * component owns the SWR fetch + polling.
 *
 * Layout is a vertically-scrollable single column on phones; on wider
 * viewports we let the inventory and stats sit side-by-side. The
 * cyan terminal aesthetic intentionally matches the CLI drawer so
 * both player surfaces feel like the same instrument.
 */
export function CharacterSheetPanel({
  sheet,
  isLoading,
  isError,
}: {
  sheet: CharacterSheet | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading && !sheet) {
    return (
      <div className="flex h-full items-center justify-center text-cyan-700/80 font-mono text-xs">
        loading sheet...
      </div>
    );
  }

  if (isError || !sheet) {
    return (
      <div className="flex h-full items-center justify-center text-rose-400/80 font-mono text-xs">
        could not load character sheet
      </div>
    );
  }

  const hpPct = sheet.hitPoints.max > 0
    ? Math.max(0, Math.min(1, sheet.hitPoints.current / sheet.hitPoints.max))
    : 0;

  return (
    <div className="h-full overflow-y-auto px-4 pb-6 pt-2 font-mono text-cyan-100/90">
      <Header sheet={sheet} />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col gap-4">
          <VitalsBlock sheet={sheet} hpPct={hpPct} />
          <AbilitiesBlock sheet={sheet} />
          <ProficienciesBlock sheet={sheet} />
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <InventoryBlock equipment={sheet.equipment} />
          {sheet.spells && sheet.spells.length > 0 && (
            <SpellsBlock spells={sheet.spells} />
          )}
          <FeaturesBlock features={sheet.features} />
          {sheet.backstory && <BackstoryBlock backstory={sheet.backstory} />}
        </div>
      </div>
    </div>
  );
}

function Header({ sheet }: { sheet: CharacterSheet }) {
  const name = sheet.name || "Unnamed Adventurer";
  const lineage =
    [sheet.race, sheet.class && `${sheet.class} ${sheet.level}`]
      .filter(Boolean)
      .join(" · ") || "Race & class not yet chosen";

  return (
    <div className="border-b border-cyan-900/60 pb-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-700">
        character
      </div>
      <div className="mt-1 text-xl text-cyan-100">{name}</div>
      <div className="text-xs text-cyan-400/80">{lineage}</div>
    </div>
  );
}

function VitalsBlock({
  sheet,
  hpPct,
}: {
  sheet: CharacterSheet;
  hpPct: number;
}) {
  return (
    <Section title="vitals">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-cyan-700">hp</span>
        <span className="text-sm tabular-nums text-cyan-100">
          {sheet.hitPoints.current}
          <span className="text-cyan-700"> / {sheet.hitPoints.max}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-cyan-950/80">
        <div
          className="h-full bg-amber-500/80 transition-[width] duration-300"
          style={{ width: `${hpPct * 100}%` }}
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="text-xs text-cyan-700">armor class</span>
        <span className="text-sm tabular-nums text-cyan-100">
          {sheet.armorClass}
        </span>
      </div>
    </Section>
  );
}

const ABILITY_ORDER: Array<{ key: keyof CharacterSheet["abilityScores"]; label: string }> = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "wisdom", label: "WIS" },
  { key: "intelligence", label: "INT" },
  { key: "charisma", label: "CHA" },
];

function AbilitiesBlock({ sheet }: { sheet: CharacterSheet }) {
  return (
    <Section title="abilities">
      <div className="grid grid-cols-3 gap-2">
        {ABILITY_ORDER.map(({ key, label }) => {
          const score = sheet.abilityScores[key];
          // 5e modifier formula: floor((score - 10) / 2)
          const mod = Math.floor((score - 10) / 2);
          const modLabel = mod >= 0 ? `+${mod}` : String(mod);
          return (
            <div
              key={key}
              className="flex flex-col items-center justify-center rounded-sm border border-cyan-900/60 bg-cyan-950/40 px-2 py-2"
            >
              <div className="text-[9px] uppercase tracking-widest text-cyan-700">
                {label}
              </div>
              <div className="mt-0.5 text-base tabular-nums text-cyan-100">
                {score}
              </div>
              <div className="text-[10px] tabular-nums text-amber-400/90">
                {modLabel}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ProficienciesBlock({ sheet }: { sheet: CharacterSheet }) {
  if (sheet.proficiencies.length === 0) {
    return (
      <Section title="proficiencies">
        <Empty>none yet</Empty>
      </Section>
    );
  }
  return (
    <Section title="proficiencies">
      <div className="flex flex-wrap gap-1">
        {sheet.proficiencies.map((p) => (
          <span
            key={p}
            className="rounded-sm border border-cyan-900/60 bg-cyan-950/40 px-1.5 py-0.5 text-[10px] text-cyan-200"
          >
            {p}
          </span>
        ))}
      </div>
    </Section>
  );
}

const TYPE_LABEL: Record<InventoryItem["type"], string> = {
  weapon: "weapon",
  armor: "armor",
  potion: "potion",
  scroll: "scroll",
  key: "key",
  misc: "misc",
};

function InventoryBlock({ equipment }: { equipment: InventoryItem[] }) {
  if (equipment.length === 0) {
    return (
      <Section title="inventory">
        <Empty>your pack is empty — ask the AI to add starter gear</Empty>
      </Section>
    );
  }

  // Group by type so a long list is still scannable.
  const grouped = equipment.reduce<Record<string, InventoryItem[]>>(
    (acc, item) => {
      const key = TYPE_LABEL[item.type] ?? "misc";
      (acc[key] ||= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <Section title={`inventory (${equipment.length})`}>
      <div className="flex flex-col gap-2">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-cyan-700">
              {type}
            </div>
            <ul className="flex flex-col divide-y divide-cyan-900/40">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline justify-between py-1"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate text-sm text-cyan-100">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="mt-0.5 truncate text-[10px] text-cyan-700">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-xs tabular-nums text-cyan-400/80">
                    ×{item.quantity}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SpellsBlock({ spells }: { spells: string[] }) {
  return (
    <Section title="spells">
      <div className="flex flex-wrap gap-1">
        {spells.map((s) => (
          <span
            key={s}
            className="rounded-sm border border-purple-900/60 bg-purple-950/30 px-1.5 py-0.5 text-[10px] text-purple-200"
          >
            {s}
          </span>
        ))}
      </div>
    </Section>
  );
}

function FeaturesBlock({ features }: { features: string[] }) {
  if (features.length === 0) return null;
  return (
    <Section title="features">
      <ul className="flex flex-col gap-1">
        {features.map((f) => (
          <li key={f} className="text-xs text-cyan-200">
            · {f}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function BackstoryBlock({ backstory }: { backstory: string }) {
  return (
    <Section title="backstory">
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-cyan-200/90">
        {backstory}
      </p>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-sm border border-cyan-900/60 bg-cyan-950/20 p-3">
      <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-cyan-700">
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] italic text-cyan-700">{children}</div>
  );
}
