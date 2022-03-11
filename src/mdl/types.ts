export interface MdlFrame {
  name: string;
  frame: number;
}

export type MdlAnimation = [number, number];

export type MdlAnimations = { [key: string]: MdlAnimation };
