import {useGLTF}from '@react-three/drei';
import {packedModelUrl}from './packedModelLoader';
/** Same Drei cache for ordinary models; lossless checked reconstruction for packed ones. */
export function useManagedGLTF(path:string){return useGLTF(packedModelUrl(path));}
