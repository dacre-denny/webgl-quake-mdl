export interface MdlFile {
  positions: Float32Array;
  uvs: Float32Array;
  normals: Float32Array;
  skins: Uint8Array[];
  frames: MdlFrame[];
  meta: {
    skinWidth: number;
    skinHeight: number;
    numFrames: number;
    numTriangles: number;
    numVertices: number;
  };
}

export interface MdlFrame {
  name: string;
  frame: number;
}

export type MdlAnimation = [number, number];

export type MdlAnimations = { [key: string]: MdlAnimation };
