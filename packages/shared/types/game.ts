export interface GameSessionState {
  sessionId: string;
  currentLocationId: string;
  currentSceneId: string;
  timeOfDay: 'dawn' | 'morning' | 'afternoon' | 'dusk' | 'night';
  activeConditions: string[];
  playerInventory: InventoryItem[];
  visitedLocations: string[];
  npcRelationships: Record<string, number>;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'weapon' | 'armor' | 'potion' | 'scroll' | 'key' | 'misc';
}

export interface DiceRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason?: string;
}
