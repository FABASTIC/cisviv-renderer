import { create } from 'zustand';
import type { AssetManifest, VisualProfileMetadata } from '../types/manifest';

interface ManifestStore {
  manifest: AssetManifest | null;
  isLoading: boolean;
  error: string | null;
  loadManifest: (url?: string) => Promise<void>;
  getProfile: (profileId: string) => VisualProfileMetadata | undefined;
  getEnvironmentProfile: (profileId: string) => VisualProfileMetadata | undefined;
}

export const FALLBACK_PROFILE: VisualProfileMetadata = {
  id: 'fallback_profile',
  renderType: 'standing_billboard',
  textureUrl: '',
  frameWidth: 32,
  frameHeight: 48,
  cols: 1,
  rows: 1,
  totalFrames: 1,
  worldScale: [1.2, 1.8],
  anchor: [0.5, 0.0],
  alphaTest: 0.5,
  animations: {
    idle: { frames: [0], fps: 1, loop: true },
    walk: { frames: [0], fps: 1, loop: true },
  },
};

export const useAssetManifestStore = create<ManifestStore>((set, get) => ({
  manifest: null,
  isLoading: false,
  error: null,

  loadManifest: async (url = '/asset_manifest.json') => {
    if (get().manifest) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to load asset manifest: ${res.statusText}`);
      const data: AssetManifest = await res.json();
      set({ manifest: data, isLoading: false });
    } catch (err: any) {
      console.error('Asset Manifest loading error:', err);
      set({ error: err.message || 'Manifest load failure', isLoading: false });
    }
  },

  getProfile: (profileId: string) => {
    const manifest = get().manifest;
    if (!manifest) return FALLBACK_PROFILE;
    return manifest.agentProfiles?.[profileId] || manifest.environmentProfiles?.[profileId] || FALLBACK_PROFILE;
  },

  getEnvironmentProfile: (profileId: string) => {
    const manifest = get().manifest;
    if (!manifest || !manifest.environmentProfiles) return undefined;
    return manifest.environmentProfiles[profileId];
  },
}));
