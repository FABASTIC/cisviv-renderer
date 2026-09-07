import * as THREE from 'three';
import { ALL_TEXTURE_URLS } from './assetDictionary';

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

/**
 * Configure texture for crisp pixel art rendering without blur or smudging.
 */
export const configurePixelTexture = (tex: THREE.Texture): THREE.Texture => {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
};

/**
 * Load a real .png file texture from /public/assets/ with nearest-neighbor pixel filtering.
 */
export const loadPixelTexture = (url: string, onUpdate?: () => void): THREE.Texture => {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }

  const tex = loader.load(
    url,
    (loadedTex) => {
      configurePixelTexture(loadedTex);
      onUpdate?.();
    },
    undefined,
    (err) => {
      console.error(`[TexturePipeline] Failed to load asset from ${url}:`, err);
    }
  );

  configurePixelTexture(tex);
  textureCache.set(url, tex);
  return tex;
};

/**
 * Eagerly preload all game textures on startup.
 */
export const preloadAllTextures = async (): Promise<void> => {
  const promises = ALL_TEXTURE_URLS.map(
    (url) =>
      new Promise<void>((resolve) => {
        if (textureCache.has(url)) {
          resolve();
          return;
        }
        loader.load(
          url,
          (tex) => {
            configurePixelTexture(tex);
            textureCache.set(url, tex);
            resolve();
          },
          undefined,
          () => {
            console.warn(`[TexturePipeline] Warning: Could not preload ${url}`);
            resolve(); // Don't block application boot
          }
        );
      })
  );

  await Promise.all(promises);
};
