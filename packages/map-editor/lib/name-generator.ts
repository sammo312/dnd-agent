// Fantasy name generation utilities

const prefixes = {
  settlements: ['New', 'Old', 'North', 'South', 'East', 'West', 'Upper', 'Lower', 'High', 'Low', 'Great', 'Little', 'Fort', 'Port', 'Mount'],
  nature: ['Green', 'Silver', 'Golden', 'Dark', 'Bright', 'Shadow', 'Sun', 'Moon', 'Storm', 'Thunder', 'Crystal', 'Iron', 'Stone'],
  descriptive: ['Grand', 'Royal', 'Ancient', 'Sacred', 'Blessed', 'Forgotten', 'Hidden', 'Lost', 'Eternal'],
}

const roots = {
  settlements: ['haven', 'burg', 'ville', 'ton', 'ford', 'stead', 'dale', 'vale', 'brook', 'wood', 'field', 'bridge', 'gate', 'port', 'hold'],
  nature: ['oak', 'pine', 'willow', 'river', 'lake', 'hill', 'cliff', 'peak', 'glen', 'meadow', 'grove', 'marsh', 'moor', 'spring', 'fall'],
  structures: ['tower', 'keep', 'hall', 'spire', 'forge', 'mill', 'well', 'hearth', 'crown', 'throne', 'shield', 'sword'],
}

const suffixes = {
  settlements: ['shire', 'land', 'realm', 'kingdom', 'domain', 'territory', 'district', 'province'],
  places: ['hollow', 'crossing', 'point', 'rest', 'watch', 'reach', 'end', 'rise', 'fall', 'pass'],
}

const fantasyNames = [
  'Aethel', 'Bren', 'Cael', 'Dorn', 'Elara', 'Fenn', 'Grim', 'Hale', 'Isen', 'Jorn',
  'Kira', 'Lorn', 'Mira', 'Nyx', 'Orin', 'Penn', 'Quinn', 'Raven', 'Seren', 'Thane',
  'Umber', 'Vex', 'Wren', 'Xander', 'Yara', 'Zeph', 'Ash', 'Briar', 'Crow', 'Drake',
  'Elder', 'Frost', 'Garnet', 'Hawk', 'Ivory', 'Jade', 'Knight', 'Luna', 'Moss', 'Noble',
]

const regionAdjectives = [
  'Verdant', 'Barren', 'Frozen', 'Burning', 'Misty', 'Shadowed', 'Sunlit', 'Moonlit',
  'Ancient', 'Forgotten', 'Sacred', 'Cursed', 'Blessed', 'Wild', 'Tamed', 'Peaceful',
  'Troubled', 'Prosperous', 'Desolate', 'Lush', 'Arid', 'Fertile', 'Rocky', 'Sandy',
]

const regionNouns = [
  'Plains', 'Expanse', 'Wastes', 'Wilds', 'Lands', 'Territory', 'Domain', 'Reach',
  'Stretch', 'Fields', 'Flats', 'Highlands', 'Lowlands', 'Marshes', 'Badlands',
  'Frontier', 'Borderlands', 'Heartland', 'Outskirts', 'Hinterlands',
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function generatePOIName(poiType: string): string {
  const type = poiType.toLowerCase()

  // Settlements
  if (['city', 'town', 'village', 'hamlet'].includes(type)) {
    const patterns = [
      () => `${randomElement(prefixes.settlements)} ${randomElement(fantasyNames)}`,
      () => `${randomElement(fantasyNames)}${randomElement(roots.settlements)}`,
      () => `${randomElement(prefixes.nature)}${randomElement(roots.nature)}`,
      () => `${randomElement(fantasyNames)}'s ${capitalize(randomElement(roots.settlements))}`,
      () => `The ${randomElement(prefixes.descriptive)} ${capitalize(randomElement(roots.settlements))}`,
    ]
    return randomElement(patterns)()
  }

  // Camps
  if (type === 'camp') {
    const patterns = [
      () => `${randomElement(fantasyNames)}'s Camp`,
      () => `${randomElement(prefixes.nature)} Camp`,
      () => `Camp ${randomElement(fantasyNames)}`,
      () => `The ${randomElement(regionAdjectives)} Camp`,
    ]
    return randomElement(patterns)()
  }

  // Fortifications
  if (['castle', 'fortress', 'watchtower', 'wall', 'gate'].includes(type)) {
    const fortTypes: Record<string, string[]> = {
      castle: ['Castle', 'Citadel', 'Stronghold', 'Palace'],
      fortress: ['Fortress', 'Bastion', 'Bulwark', 'Redoubt'],
      watchtower: ['Watchtower', 'Beacon', 'Lookout', 'Spire'],
      wall: ['Wall', 'Rampart', 'Barrier', 'Bulwark'],
      gate: ['Gate', 'Portal', 'Gateway', 'Passage'],
    }
    const fortName = randomElement(fortTypes[type] || ['Keep'])
    const patterns = [
      () => `${randomElement(fantasyNames)} ${fortName}`,
      () => `${fortName} ${randomElement(fantasyNames)}`,
      () => `The ${randomElement(prefixes.descriptive)} ${fortName}`,
      () => `${randomElement(prefixes.nature)} ${fortName}`,
    ]
    return randomElement(patterns)()
  }

  // Buildings
  if (['house', 'mansion', 'tavern', 'shop', 'blacksmith', 'stable', 'windmill', 'warehouse', 'barn'].includes(type)) {
    const buildingNames: Record<string, () => string> = {
      house: () => `${randomElement(fantasyNames)}'s House`,
      mansion: () => `${randomElement(fantasyNames)} Manor`,
      tavern: () => `The ${randomElement(['Prancing', 'Dancing', 'Sleeping', 'Golden', 'Silver', 'Iron', 'Rusty'])} ${randomElement(['Pony', 'Dragon', 'Griffin', 'Boar', 'Stag', 'Tankard', 'Flagon'])}`,
      shop: () => `${randomElement(fantasyNames)}'s ${randomElement(['Goods', 'Wares', 'Emporium', 'Trading Post'])}`,
      blacksmith: () => `${randomElement(fantasyNames)}'s Forge`,
      stable: () => `${randomElement(fantasyNames)}'s Stables`,
      windmill: () => `${randomElement(['Old', 'Grand', 'Creaky', 'Tall'])} Windmill`,
      warehouse: () => `${randomElement(fantasyNames)} Warehouse`,
      barn: () => `${randomElement(['Red', 'Old', 'Big', 'Weathered'])} Barn`,
    }
    return buildingNames[type]?.() || `${randomElement(fantasyNames)}'s ${capitalize(type)}`
  }

  // Religious
  if (['temple', 'shrine', 'graveyard', 'monument'].includes(type)) {
    const religiousNames: Record<string, () => string> = {
      temple: () => `Temple of ${randomElement(['Light', 'Shadows', 'the Sun', 'the Moon', 'the Ancients', 'the Divine'])}`,
      shrine: () => `${randomElement(fantasyNames)}'s Shrine`,
      graveyard: () => `${randomElement(['Peaceful', 'Silent', 'Eternal', 'Sacred', 'Forgotten'])} Rest Cemetery`,
      monument: () => `${randomElement(fantasyNames)}'s Monument`,
    }
    return religiousNames[type]?.() || `${capitalize(type)} of ${randomElement(fantasyNames)}`
  }

  // Infrastructure
  if (['bridge', 'well', 'dock', 'lighthouse', 'mine', 'quarry'].includes(type)) {
    const infraNames: Record<string, () => string> = {
      bridge: () => `${randomElement(fantasyNames)} Bridge`,
      well: () => `${randomElement(['Wishing', 'Deep', 'Ancient', 'Sacred'])} Well`,
      dock: () => `${randomElement(fantasyNames)} Docks`,
      lighthouse: () => `${randomElement(fantasyNames)} Lighthouse`,
      mine: () => `${randomElement(['Deep', 'Old', 'Rich', 'Abandoned', 'Dark'])} ${randomElement(['Gold', 'Iron', 'Silver', 'Copper', 'Coal'])} Mine`,
      quarry: () => `${randomElement(['Stone', 'Granite', 'Marble', 'Slate'])} Quarry`,
    }
    return infraNames[type]?.() || `${randomElement(fantasyNames)} ${capitalize(type)}`
  }

  // Natural Features
  if (['cave', 'ruins', 'oasis', 'waterfall', 'hot-spring'].includes(type)) {
    const naturalNames: Record<string, () => string> = {
      cave: () => `${randomElement(['Dark', 'Deep', 'Crystal', 'Echo', 'Shadow', 'Spider'])} Cave`,
      ruins: () => `Ruins of ${randomElement(fantasyNames)}`,
      oasis: () => `${randomElement(fantasyNames)}'s Oasis`,
      waterfall: () => `${randomElement(['Thunder', 'Mist', 'Crystal', 'Rainbow', 'Silver'])} Falls`,
      'hot-spring': () => `${randomElement(['Steaming', 'Bubbling', 'Healing', 'Sacred'])} Springs`,
    }
    return naturalNames[type]?.() || `${randomElement(fantasyNames)} ${capitalize(type)}`
  }

  // Decorative (fences, trees, etc.)
  if (type.includes('fence')) {
    return `${randomElement(['Border', 'Property', 'Garden', 'Perimeter'])} Fence`
  }
  if (type.includes('tree')) {
    return `${randomElement(['Ancient', 'Old', 'Great', 'Lone', 'Twisted'])} ${randomElement(['Oak', 'Willow', 'Maple', 'Pine', 'Elm'])}`
  }

  // Default fallback
  return `${randomElement(fantasyNames)}'s ${capitalize(type.replace(/-/g, ' '))}`
}

export function generateRegionName(dominantTerrain?: string): string {
  const terrainSpecific: Record<string, string[]> = {
    grass: ['Meadows', 'Plains', 'Grasslands', 'Fields', 'Pastures'],
    forest: ['Woods', 'Forest', 'Timberland', 'Woodland', 'Grove'],
    water: ['Bay', 'Shores', 'Waters', 'Lake District', 'Wetlands'],
    'deep-water': ['Deep', 'Abyss', 'Depths', 'Ocean', 'Sea'],
    sand: ['Dunes', 'Beach', 'Sands', 'Desert', 'Shores'],
    desert: ['Wastes', 'Barrens', 'Desert', 'Drylands', 'Badlands'],
    mountain: ['Peaks', 'Mountains', 'Highlands', 'Heights', 'Range'],
    snow: ['Tundra', 'Frost', 'Icefield', 'Snowlands', 'Glaciers'],
    swamp: ['Swamp', 'Bog', 'Mire', 'Fen', 'Marshes'],
    marsh: ['Marshes', 'Wetlands', 'Fens', 'Bogs', 'Moorland'],
    dirt: ['Flats', 'Barrens', 'Dustlands', 'Plains', 'Scrubland'],
    rock: ['Crags', 'Badlands', 'Rocklands', 'Stonelands', 'Outcrops'],
    lava: ['Hellscape', 'Firelands', 'Inferno', 'Burning Lands', 'Molten Fields'],
    ice: ['Glacier', 'Icelands', 'Frozen Wastes', 'Frostlands', 'Permafrost'],
  }

  const patterns = [
    () => `The ${randomElement(regionAdjectives)} ${terrainSpecific[dominantTerrain || 'grass'] ? randomElement(terrainSpecific[dominantTerrain || 'grass']) : randomElement(regionNouns)}`,
    () => `${randomElement(fantasyNames)}'s ${randomElement(regionNouns)}`,
    () => `${randomElement(prefixes.nature)} ${randomElement(regionNouns)}`,
    () => `The ${randomElement(fantasyNames)} ${randomElement(suffixes.settlements)}`,
    () => `${randomElement(regionAdjectives)} ${randomElement(fantasyNames)}`,
  ]

  return randomElement(patterns)()
}
