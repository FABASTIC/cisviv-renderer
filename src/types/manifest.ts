export type AssetRenderType = 'standing_billboard' | 'ground_decal' | 'agent_sprite';

export interface AnimationStateData {
  /** Array of frame indices (0-indexed from top-left of the sprite sheet) */
  frames: number[];
  /** Playback speed in frames per second */
  fps: number;
  /** Whether the animation loops */
  loop: boolean;
}

export interface VisualProfileMetadata {
  /** Unique profile identifier (e.g., 'frontier_saloon', 'dead_tree_01', 'dusty_dirt_path', 'settler_01') */
  id: string;
  /** Rendering classification */
  renderType: AssetRenderType;
  /** Relative or absolute URL to the 2D sprite or sprite sheet */
  textureUrl: string;
  /** Grid dimensions (1x1 for single sprites, NxM for sprite sheets) */
  frameWidth?: number;
  frameHeight?: number;
  cols?: number;
  rows?: number;
  totalFrames?: number;
  /** In-engine world scale [width, height] in 3D units */
  worldScale: [number, number];
  /** Pivot anchor: [0.5, 0.0] for standing bottom-grounded, [0.5, 0.5] for flat ground tiles */
  anchor: [number, number];
  /** Alpha clipping threshold for crisp cutout edges */
  alphaTest?: number;
  /** Optional animations (for animated agents or smoking chimneys/water pumps) */
  animations?: Record<string, AnimationStateData>;
  /** Thematic tag (e.g. "frontier_arid", "wooden_structure", "dead_foliage") */
  theme?: string;
  tint?: string;
}

export interface AssetManifest {
  version: string;
  generatedAt?: string;
  sources: {
    repo1: string;
    repo2: string;
  };
  environmentProfiles: Record<string, VisualProfileMetadata>;
  agentProfiles: Record<string, VisualProfileMetadata>;
}
