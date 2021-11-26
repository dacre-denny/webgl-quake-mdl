import { ColorMap } from "./colormap";
import { Normals } from "./normals";

const SIZE_BYTES_VERTEX = Uint8Array.BYTES_PER_ELEMENT * 4;
/*
      struct mdl_vertex_t
    {
      unsigned char v[3];
      unsigned char normalIndex;
    };
      */
const SIZE_BYTES_FRAME_NAME = Uint8Array.BYTES_PER_ELEMENT * 16;

/**
 *
 * @param arrayBuffer
 * @param offset
 * @returns
 */
export const readFrameName = (arrayBuffer: ArrayBuffer, offset: number) => {
  const length = SIZE_BYTES_FRAME_NAME / Uint8Array.BYTES_PER_ELEMENT;
  const bytes = new Uint8Array(arrayBuffer, offset, length);

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

export const loadMdl = async () => {
  const res = await fetch(
    `/${"ogre" ?? "shambler" ?? "soldier" ?? "spike"}.mdl`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    throw -1;
  }

  const blob = await res.blob();

  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener("load", (evt) => {
      resolve(fileReader.result as ArrayBuffer);
    });
    fileReader.addEventListener("error", (evt) => {
      reject(evt);
    });

    fileReader.readAsArrayBuffer(blob);
  });

  let offset = 0;

  /*
      struct mdl_header_t
  {
    int ident;            
    int version;          
   
    vec3_t scale;         
    vec3_t translate;     
    float boundingradius; 
    vec3_t eyeposition;   
   
    int num_skins;        
    int skinwidth;        
    int skinheight;       
   
    int num_verts;        
    int num_tris;         
    int num_frames;       
   
    int synctype;         
    int flags;            
    float size;
  };
      */

  const [ident, version] = Array.from(new Int32Array(arrayBuffer, offset, 2));
  offset += Int32Array.BYTES_PER_ELEMENT * 2;

  if (ident !== 1330660425) {
    throw new Error(`Invalid ident`);
  }

  if (version !== 6) {
    throw new Error(`Invalid version`);
  }

  const foo = Array.from(new Float32Array(arrayBuffer, offset, 10));
  offset += Float32Array.BYTES_PER_ELEMENT * 10;

  const [sx, sy, sz, tx, ty, tz] = foo;
  // scale [x,y,z]
  // trans [x,y,z]
  // bounding rad [x]
  // eye pos [x,y,z]

  const [
    numSkins,
    skinWidth,
    skinHeight,
    numVertices,
    numTriangles,
    numFrames,
    syncType,
    flags,
  ] = Array.from(new Int32Array(arrayBuffer, offset, 8));
  offset += Int32Array.BYTES_PER_ELEMENT * 8;

  const skinSize = skinWidth * skinHeight;
  // const [size] = Array.from(new Float32Array(arrayBuffer, offset, 1));
  offset += Float32Array.BYTES_PER_ELEMENT * 1;

  const skins: Uint8Array[] = [];

  //
  const readSkin = () => {
    const SKIN_SINGLE = 0;
    const SKIN_GROUP = 1;

    const group /*[group, numberOfFrames]*/ = new Int32Array(
      arrayBuffer,
      offset
    ).at(0);
    offset += Int32Array.BYTES_PER_ELEMENT * 1;

    const dataBytes = skinSize * Uint8Array.BYTES_PER_ELEMENT; // Int8Array.BYTES_PER_ELEMENT

    switch (group) {
      case SKIN_SINGLE: {
        /*
            struct mdl_skin_t
            {
              int group;
              GLubyte *data;
            }; 
            */
        const dataIndicies = new Uint8Array(arrayBuffer, offset, skinSize);
        // console.log("dataIndicies", dataIndicies);

        offset += dataBytes;

        const data = new Uint8Array(skinSize * 3);
        for (let i = 0; i < dataIndicies.length; i++) {
          const [r, g, b] = ColorMap[dataIndicies[i]];
          data[i * 3 + 0] = r;
          data[i * 3 + 1] = g;
          data[i * 3 + 2] = b;
        }

        skins.push(data);

        break;
      }
      case SKIN_GROUP: {
        /*
            struct mdl_groupskin_t
            {
              int group;    
              int nb;       
              float *time;  
              ubyte **data; 
            };
            */
        // TODO: test this case

        const numberOfFrames /*[group, numberOfFrames]*/ = new Int32Array(
          arrayBuffer,
          offset
        ).at(0);
        offset += Int32Array.BYTES_PER_ELEMENT * 1; // For number of frames

        const time = new Float32Array(arrayBuffer, offset);
        offset += numberOfFrames * Float32Array.BYTES_PER_ELEMENT;
        // console.log("time", time);

        for (let i = 0; i < numberOfFrames; i++) {
          const data = new Uint8Array(skinSize * 3);
          const dataIndicies = new Uint8Array(arrayBuffer, offset, skinSize);
          for (let i = 0; i < dataIndicies.length; i++) {
            const [r, g, b] = ColorMap[dataIndicies[i]];
            data[i * 3 + 0] = r;
            data[i * 3 + 1] = g;
            data[i * 3 + 2] = b;
          }

          skins.push(data);
          offset += dataBytes;
        }

        break;
      }
      default: {
        throw new Error("Unknown skin type");
      }
    }
  };

  for (let i = 0; i < numSkins; i++) {
    readSkin();
  }

  // Read texture coordinates
  const textureCoordinates = new Int32Array(arrayBuffer, offset);
  offset += Int32Array.BYTES_PER_ELEMENT * 3 * numVertices;

  /*
      struct mdl_texcoord_t
      {
        int onseam;
        int s;
        int t;
      };
      */

  // Read triangles
  const triangles = new Int32Array(arrayBuffer, offset);
  offset += Int32Array.BYTES_PER_ELEMENT * 4 * numTriangles;
  /*
  struct mdl_triangle_t
  {
    int facesfront;  
    int vertex[3];   
  };
  */

  const readVertex = (scale: number = 1) => {
    const vertex = new Uint8Array(arrayBuffer, offset);
    offset += Uint8Array.BYTES_PER_ELEMENT * 4;
    /*
      struct mdl_vertex_t
    {
      unsigned char v[3];
      unsigned char normalIndex;
    };
      */

    return {
      x: vertex[0] * sx + tx,
      y: vertex[1] * sy + ty,
      z: vertex[2] * sz + tz,
    };
  };

  const vertices = []; // new Float32Array(numFrames * numVertices);
  const verticesBig = [];
  const uvsBig = [];
  const normalsBig = [];

  const animations: { [key: string]: [number, number] } = {};

  const readSimpleFrame = (frame: number) => {
    // debugger;
    // Skip over bound box vertices for this frame
    offset += SIZE_BYTES_VERTEX * 2;

    const name = readFrameName(arrayBuffer, offset);
    offset += SIZE_BYTES_FRAME_NAME;

    const frameTokens = name.match(/^\s*([a-z]+)(\d*)/);
    if (frameTokens.length === 3) {
      const [, frameName, frameNumber] = frameTokens;

      const range = animations[frameName];

      const min = Math.min(range?.[0] ?? frame, frame);
      const max = Math.max(range?.[1] ?? frame, frame);
      if (range) {
        range[0] = min;
        range[1] = max;
      } else {
        animations[frameName] = [min, max];
      }
    }

    const frameVertices = new Uint8Array(arrayBuffer, offset, 4 * numVertices);
    offset += Uint8Array.BYTES_PER_ELEMENT * 4 * numVertices;

    for (let t = 0; t < numTriangles; t++) {
      const facesFront = triangles[t * 4 + 0] === 1;

      const doVert = (v) => {
        const idx = triangles[t * 4 + 1 + v];

        const onSeam = textureCoordinates[idx * 3 + 0];
        let texU = (textureCoordinates[idx * 3 + 1] + 0.5) / skinWidth;
        let texV = (textureCoordinates[idx * 3 + 2] + 0.5) / skinHeight;

        const scale = 0.5;
        const x = frameVertices[idx * 4 + 0];
        const y = frameVertices[idx * 4 + 2];
        const z = frameVertices[idx * 4 + 1];
        const normalIndex = frameVertices[idx * 4 + 3];

        const [nx, nz, ny] = Normals[normalIndex];

        normalsBig.push(nx, ny, nz);
        verticesBig.push(x * scale, y * scale, z * scale);

        if (!facesFront && onSeam) {
          texU += 0.5;
        }

        uvsBig.push(texU, texV);
      };

      doVert(0);
      doVert(1);
      doVert(2);
    }
    /*
      struct mdl_simpleframe_t
      {
        struct mdl_vertex_t bboxmin;
        struct mdl_vertex_t bboxmax;
        char name[16];
        struct mdl_vertex_t *verts; 
      };
      */
  };

  const readFrame = (frame: number) => {
    const FRAME_SIMPLE = 0;

    const type = new Int32Array(arrayBuffer, offset).at(0);
    offset += Int32Array.BYTES_PER_ELEMENT * 1;

    if (type === FRAME_SIMPLE) {
      readSimpleFrame(frame);
    } else {
      // Skip over bound box vertices for this frame
      offset += SIZE_BYTES_VERTEX * 2;

      const min = readVertex();
      const max = readVertex();
    }
  };

  // Read frames
  for (let i = 0; i < numFrames; i++) {
    readFrame(i);
  }

  return {
    vertices: new Float32Array(verticesBig),
    uvs: new Float32Array(uvsBig),
    normals: new Float32Array(normalsBig),
    skins,
    meta: {
      animations,
      skinWidth,
      skinHeight,
      numFrames,
      numTriangles,
      numVertices,
    },
  };
};
