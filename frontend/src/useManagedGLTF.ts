import { useGLTF } from '@react-three/drei';
import { packedModelUrl } from './packedModelLoader';

const r2Base = (
  import.meta.env.VITE_R2_BASE_URL || ''
).replace(/\/$/, '');

const r2Models: Record<string, string> = {
  '/models/cars/f1-assembly.glb':
    '/FastOneLabs-3D-Backup/f1-assembly.glb',

  '/models/cars/ferrari/2023/sf23.glb':
    '/FastOneLabs-3D-Backup/sf23.glb',
};

export function resolveModelPath(path: string): string {
  if (r2Base && r2Models[path]) {
    return r2Base + r2Models[path];
  }

  return packedModelUrl(path);
}

export function useManagedGLTF(path: string) {
  return useGLTF(resolveModelPath(path));
}
