export type AssetCategory = 'ground_tile' | 'standing_prop' | 'agent';

export interface AssetDefinition {
  id: string;
  category: AssetCategory;
  name: string;
  textureUrl: string; // Exact path in Vite /public directory
  isGround: boolean;
  isStandingBillboard: boolean;
  walkable: boolean;
  elevation: number;
  rotationX: number; // -Math.PI / 2 for flat ground, 0 for upright props
  size: [number, number]; // [width, height] in world units
  anchorY: number; // 0.5 for centered ground tiles, 0.0 for foot-anchored standing props
  hasShadow: boolean;
  shadowScale?: [number, number]; // [width, depth] on ground
  shadowUrl?: string;
  description: string;
}

export const ASSET_DICTIONARY: Record<string, AssetDefinition> = {
  // ==================== GROUND TILES ====================
  grass: {
    id: 'grass',
    category: 'ground_tile',
    name: 'Lush Grass Tile',
    textureUrl: '/assets/terrain/grass.png',
    isGround: true,
    isStandingBillboard: false,
    walkable: true,
    elevation: 0.0,
    rotationX: -Math.PI / 2,
    size: [1.0, 1.0],
    anchorY: 0.5,
    hasShadow: false,
    description: 'Vibrant meadow grass tile with clover accents.',
  },

  water: {
    id: 'water',
    category: 'ground_tile',
    name: 'Shimmering Water Tile',
    textureUrl: '/assets/terrain/water.png',
    isGround: true,
    isStandingBillboard: false,
    walkable: false,
    elevation: -0.005,
    rotationX: -Math.PI / 2,
    size: [1.0, 1.0],
    anchorY: 0.5,
    hasShadow: false,
    description: 'Clear running river and lake water with shimmer ripples.',
  },

  dirt: {
    id: 'dirt',
    category: 'ground_tile',
    name: 'Packed Dirt Path',
    textureUrl: '/assets/terrain/dirt.png',
    isGround: true,
    isStandingBillboard: false,
    walkable: true,
    elevation: 0.002, // Sits slightly above grass to prevent z-fighting
    rotationX: -Math.PI / 2,
    size: [1.0, 1.0],
    anchorY: 0.5,
    hasShadow: false,
    description: 'Well-trodden earth path connecting towns and settlements.',
  },

  bridge: {
    id: 'bridge',
    category: 'ground_tile',
    name: 'Wooden Plank Bridge',
    textureUrl: '/assets/terrain/bridge.png',
    isGround: true,
    isStandingBillboard: false,
    walkable: true,
    elevation: 0.008, // Placed over water
    rotationX: -Math.PI / 2,
    size: [1.0, 1.0],
    anchorY: 0.5,
    hasShadow: false,
    description: 'Timber crossing spanning over the river channel.',
  },

  // ==================== STANDING PROPS ====================
  pine_tree: {
    id: 'pine_tree',
    category: 'standing_prop',
    name: 'Evergreen Pine',
    textureUrl: '/assets/props/pine_tree.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [1.3, 2.4],
    anchorY: 0.0, // Anchored to base feet: y = height / 2
    hasShadow: true,
    shadowScale: [0.9, 0.45],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Tall evergreen pine tree casting a soft ground contact shadow.',
  },

  rock: {
    id: 'rock',
    category: 'standing_prop',
    name: 'Granite Boulder',
    textureUrl: '/assets/props/rock.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [1.1, 0.9],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [1.0, 0.5],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Weathered stone boulder near shorelines and forest edges.',
  },

  shack: {
    id: 'shack',
    category: 'standing_prop',
    name: 'Frontier Timber Shack',
    textureUrl: '/assets/props/shack.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [2.2, 2.2],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [2.0, 0.8],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Pioneer wooden cabin with warm glowing lantern windows.',
  },

  // ==================== AGENTS ====================
  settler: {
    id: 'settler',
    category: 'agent',
    name: 'Town Pioneer',
    textureUrl: '/assets/agents/settler.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [0.9, 1.3],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [0.7, 0.35],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Hardworking frontier citizen managing local resources.',
  },

  merchant: {
    id: 'merchant',
    category: 'agent',
    name: 'Traveling Trader',
    textureUrl: '/assets/agents/merchant.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [0.9, 1.3],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [0.7, 0.35],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Trade merchant navigating between town districts.',
  },

  ranger: {
    id: 'ranger',
    category: 'agent',
    name: 'Wilderness Ranger',
    textureUrl: '/assets/agents/ranger.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [0.9, 1.3],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [0.7, 0.35],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Forest scout surveying boundaries and wildlife.',
  },

  farmer: {
    id: 'farmer',
    category: 'agent',
    name: 'Homestead Farmer',
    textureUrl: '/assets/agents/farmer.png',
    isGround: false,
    isStandingBillboard: true,
    walkable: false,
    elevation: 0.0,
    rotationX: 0,
    size: [0.9, 1.3],
    anchorY: 0.0,
    hasShadow: true,
    shadowScale: [0.7, 0.35],
    shadowUrl: '/assets/props/shadow.png',
    description: 'Cultivator caring for rural fields and livestock.',
  },
};

export const getAssetDefinition = (id: string): AssetDefinition => {
  if (ASSET_DICTIONARY[id]) return ASSET_DICTIONARY[id];

  // Smart fallback
  if (id.includes('tree') || id.includes('pine')) return ASSET_DICTIONARY.pine_tree;
  if (id.includes('rock') || id.includes('boulder')) return ASSET_DICTIONARY.rock;
  if (id.includes('water') || id.includes('river') || id.includes('lake')) return ASSET_DICTIONARY.water;
  if (id.includes('path') || id.includes('dirt') || id.includes('road')) return ASSET_DICTIONARY.dirt;
  if (id.includes('bridge')) return ASSET_DICTIONARY.bridge;
  if (id.includes('cabin') || id.includes('house') || id.includes('shack') || id.includes('saloon')) return ASSET_DICTIONARY.shack;
  if (id.includes('farmer')) return ASSET_DICTIONARY.farmer;
  if (id.includes('ranger')) return ASSET_DICTIONARY.ranger;
  if (id.includes('merchant')) return ASSET_DICTIONARY.merchant;
  if (id.includes('agent') || id.includes('settler')) return ASSET_DICTIONARY.settler;

  return ASSET_DICTIONARY.grass;
};

// All texture URLs to preload
export const ALL_TEXTURE_URLS: string[] = Array.from(
  new Set(
    Object.values(ASSET_DICTIONARY)
      .map((a) => a.textureUrl)
      .concat(['/assets/props/shadow.png'])
  )
);
