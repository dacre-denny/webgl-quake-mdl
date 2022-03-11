import { ArrayReader } from "./ArrayReader";
import { Colors } from "./colors";
import { Normals } from "./normals";
import { MdlFrame } from "./types";

const SIZE_BYTES_VERTEX = Uint8Array.BYTES_PER_ELEMENT * 4;
const FRAME_TYPE_SIMPLE = 0;
const SKIN_TYPE_SINGLE = 0;

/**
 *
 * @param arrayBuffer
 * @param offset
 * @returns
 */
const readFrameName = (file: ArrayReader, length = 16) => {
  const bytes = file.readUint8Array(length);

  let name = "";

  for (let i = 0; i < length; i++) {
    const byte = bytes[i];

    // If null byte detected then early exit seeing the valid string characters have been obtained
    if (byte === 0x00) {
      break;
    }

    name = `${name}${String.fromCharCode(byte)}`;
  }

  return name;
};

/**
 *
 * @param file
 * @returns
 */
const readHeader = (file: ArrayReader) => {
  const part0 = file.readInt32Array(2);
  const part1 = file.readFloat32Array(10);
  const part2 = file.readInt32Array(8);

  file.skipBytes(Float32Array.BYTES_PER_ELEMENT);

  const ident = part0[0];
  const version = part0[1];

  if (ident !== 1330660425) {
    throw new Error(`Invalid ident`);
  }

  if (version !== 6) {
    throw new Error(`Invalid version`);
  }

  const sx = part1.at(0);
  const sy = part1.at(1);
  const sz = part1.at(2);
  const tx = part1.at(3);
  const ty = part1.at(4);
  const tz = part1.at(5);

  const [
    numSkins,
    skinWidth,
    skinHeight,
    numVertices,
    numTriangles,
    numFrames,
    syncType,
    flags,
  ] = Array.from(part2);

  return {
    translate: {
      x: tx,
      y: ty,
      z: tz,
    },
    scale: {
      x: sx,
      y: sy,
      z: sz,
    },
    numSkins,
    skinWidth,
    skinHeight,
    numVertices,
    numTriangles,
    numFrames,
    syncType,
    flags,
  };
};

/**
 *
 * @param file
 * @param width
 * @param height
 * @returns
 */
const readSkin = (file: ArrayReader, width: number, height: number) => {
  const skinSize = width * height;

  const group = file.readInt32Array(1)[0];

  if (group !== SKIN_TYPE_SINGLE) {
    throw new Error("Unsupported skin type");
  }

  const dataIndices = file.readUint8Array(skinSize);

  const data = new Uint8Array(skinSize * 3);
  for (let i = 0; i < dataIndices.length; i++) {
    const [r, g, b] = Colors[dataIndices[i]];
    data[i * 3 + 0] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }

  return data;
};

/**
 *
 * @returns
 */
export const loadMdl = async (file: ArrayReader) => {
  const {
    numSkins,
    skinWidth,
    skinHeight,
    numVertices,
    numTriangles,
    numFrames,
    scale,
    translate,
    syncType,
    flags,
  } = readHeader(file);

  let writeIndex = 0;
  const skins = new Array<Uint8Array>(numSkins);
  const frames = new Array<MdlFrame>(numFrames);
  const positions = new Float32Array(numFrames * numTriangles * 3 * 3);
  const normals = new Float32Array(numFrames * numTriangles * 3 * 3);
  const uvs = new Float32Array(numFrames * numTriangles * 3 * 2);

  for (let i = 0; i < numSkins; i++) {
    skins[i] = readSkin(file, skinWidth, skinHeight);
  }

  // Read texture coordinates
  const coords = file.readInt32Array(3 * numVertices);

  // Read triangles
  const triangles = file.readInt32Array(4 * numTriangles);

  // Reads a single frame

  // Read frames
  for (let frame = 0; frame < numFrames; frame++) {
    const type = file.readInt32Array(1)[0];

    if (type !== FRAME_TYPE_SIMPLE) {
      throw new Error("Frame type not supported");
    }

    // Skip over bound box vertices for this frame
    file.skipBytes(SIZE_BYTES_VERTEX * 2);

    const name = readFrameName(file);

    frames[frame] = { name, frame };

    const frameVertices = file.readUint8Array(4 * numVertices);

    for (let triangle = 0; triangle < numTriangles; triangle++) {
      const isFrontTriangle = triangles[triangle * 4 + 0] === 1;

      for (let v = 0; v < 3; v++) {
        const readIndex = triangles[triangle * 4 + 1 + v];

        // Used to determine if uv offset is required
        const isUvSeam = coords[readIndex * 3 + 0];
        const isUvOffset = !isFrontTriangle && isUvSeam;

        const cU =
          (isUvOffset ? 0.5 : 0.0) +
          (coords[readIndex * 3 + 1] + 0.5) / skinWidth;
        const cV = (coords[readIndex * 3 + 2] + 0.5) / skinHeight;

        const pX = frameVertices[readIndex * 4 + 0] * scale.x + translate.x;
        const pY = frameVertices[readIndex * 4 + 2] * scale.z + translate.z;
        const pZ = frameVertices[readIndex * 4 + 1] * scale.y + translate.y;
        const normalIndex = frameVertices[readIndex * 4 + 3];

        const nX = Normals[normalIndex][0];
        const nY = Normals[normalIndex][2];
        const nZ = Normals[normalIndex][1];

        positions[writeIndex * 3 + 0] = pX;
        positions[writeIndex * 3 + 1] = pY;
        positions[writeIndex * 3 + 2] = pZ;

        normals[writeIndex * 3 + 0] = nX;
        normals[writeIndex * 3 + 1] = nY;
        normals[writeIndex * 3 + 2] = nZ;

        uvs[writeIndex * 2 + 0] = cU;
        uvs[writeIndex * 2 + 1] = cV;

        writeIndex++;
      }
    }
  }

  return {
    positions,
    uvs,
    frames,
    normals,
    skins,
    meta: {
      skinWidth,
      skinHeight,
      numFrames, // TODO: needed?
      numTriangles,
      numVertices,
    },
  };
};
