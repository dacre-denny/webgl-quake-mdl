import { MdlAnimations, MdlFrame } from "./types";

/**
 *
 * @param animations
 * @param frameName
 * @param frameIndex
 */
const notMdlExtractAnimation = (
  animations: MdlAnimations,
  frameName: string,
  frameIndex: number
) => {
  const frameTokens = frameName.match(/^\s*([a-z]+)(\d*)/);
  if (frameTokens.length === 3) {
    const [, frameName] = frameTokens;

    const range = animations[frameName];
    const min = Math.min(range?.[0] ?? frameIndex, frameIndex);
    const max = Math.max(range?.[1] ?? frameIndex, frameIndex);

    if (range) {
      range[0] = min;
      range[1] = max;
    } else {
      animations[frameName] = [min, max];
    }
  }
};

/**
 *
 * @param animations
 * @param mdl
 * @returns
 */
export const buildFrameDeltas = (animations: MdlAnimations, mdl: any) => {
  const positions = new Float32Array(mdl.positions.length);
  const normals = new Float32Array(mdl.normals.length);

  for (const [from, to] of Object.values(animations)) {
    for (let frame = from; frame < to; frame++) {
      const animationNumFrames = from - to;

      const nextFrame = ((frame - from + 1) % animationNumFrames) + from;

      const frameCurrIndex = frame * mdl.meta.numTriangles * 3 * 3;
      const frameNextIndex = nextFrame * mdl.meta.numTriangles * 3 * 3;

      for (let triangle = 0; triangle < mdl.meta.numTriangles; triangle++) {
        const idxCurrTri = triangle * 3 * 3;

        for (let vertex = 0; vertex < 3; vertex++) {
          for (let i = 0; i < 3; i++) {
            const idxCurr = frameCurrIndex + idxCurrTri + vertex * 3 + i;
            const idxNext = frameNextIndex + idxCurrTri + vertex * 3 + i;

            positions[idxCurr] = mdl.positions[idxNext] - mdl.positions[idxCurr];
            normals[idxCurr] = mdl.normals[idxNext] - mdl.normals[idxCurr];
          }
        }
      }
    }
  }

  return {positions, normals};
};

/**
 *
 * @param frames
 * @returns
 */
export const extractAnimationsFromFrames = (frames: MdlFrame[]) => {
  const animations: MdlAnimations = {};

  for (const { name, frame } of frames) {
    notMdlExtractAnimation(animations, name, frame);
  }

  return animations;
};
