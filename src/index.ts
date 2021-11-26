var m4 = require("gl-mat4");

import { loadMdl } from "./mdl";
import {
  bindBuffer,
  bindProgram,
  createAttributeBuffer,
  createIndicesBuffer,
  createProgram,
  createTexture,
} from "./rendering";

const SHADER_VS = `
#version 100
precision mediump float;

uniform float u_frac;
uniform mat4 u_viewProjection;
uniform mat4 u_world;

attribute vec4 a_position;
attribute vec3 a_delta;
attribute vec3 a_deltaNormal;

attribute vec3 a_normal;
attribute vec2 a_uv;

varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  
  v_position = u_world * (a_position + vec4(a_delta.x, a_delta.y, a_delta.z, 0.0) * u_frac);
  v_normal = a_normal  + (a_deltaNormal * u_frac); // TODO :
  v_uv = a_uv;
  gl_PointSize = 4.0;
  gl_Position = u_viewProjection * v_position;
}`;

const SHADER_FS = `
#version 100
precision mediump float;

uniform sampler2D u_texture;
uniform int u_shading;

varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  
  vec3 l_pos = vec3(150.0, 200.0, 0.0);
  vec3 l_dir = l_pos - v_position.xyz;
  vec3 l_nor = normalize(l_dir);
  float l_amount = dot(l_nor, normalize(v_normal)) * 0.5 + 0.5;

  vec4 l_color = vec4(l_amount, l_amount, l_amount, 1.0);

  if(u_shading == 0) {

    gl_FragColor = texture2D(u_texture, v_uv) * l_color;
  }
  else if(u_shading == 1) {

    gl_FragColor = texture2D(u_texture, v_uv);
  }
  else {
    gl_FragColor = vec4(v_normal * 0.5 + 0.5, 1.0);
  }
  //gl_FragColor = vec4(v_uv.x,v_uv.y, 0.0, 1.0);
  // gl_FragColor =   l_color;
  // gl_FragColor.xyz = v_normal.xyz;
}`;

(async () => {
  try {
    const mdl = await loadMdl();

    const getGroupValue = (name: string) => {
      const options = Array.from(
        document.querySelectorAll(`input[name="${name}"]`)
      );

      const option = (options.find(
        (option: HTMLInputElement) => option.checked
      ) ??
        options?.[0] ??
        null) as HTMLInputElement | null;

      return option?.value ?? null;
    };

    const bindGroup = (name: string, onChange: (value: string) => void) => {
      onChange(getGroupValue(name));

      document
        .querySelectorAll(`input[name="${name}"]`)
        .forEach((input: HTMLInputElement) => {
          input.addEventListener("change", () => {
            onChange(getGroupValue(name));
          });
        });
    };

    let selectedAnimationSpeed = 1;

    bindGroup("anim-speed", (value) => {
      selectedAnimationSpeed = Number.parseFloat(value);
    });

    // const select = document.createElement("select") as HTMLSelectElement;

    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    canvas.width = 550;
    canvas.height = 550;
    document.body.append(canvas);

    const gl = canvas.getContext("webgl");

    gl.enable(gl.DEPTH_TEST);

    const fov = 1.4; // 30 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 1000;

    let projection = m4.perspective([], fov, aspect, zNear, zFar);

    const onUpdateProjection = () => {
      const newAspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
      projection = m4.perspective([], fov, newAspect, zNear, zFar);
    };
    window.addEventListener("resize", onUpdateProjection);

    const program = await createProgram(gl, SHADER_VS, SHADER_FS);
    const texture = createTexture(
      gl,
      mdl.meta.skinWidth,
      mdl.meta.skinHeight,
      mdl.skins[0]
    );
    const normalBuffer = createAttributeBuffer(gl, mdl.normals);
    const positionBuffer = createAttributeBuffer(gl, mdl.vertices);

    const deltas = new Float32Array(mdl.vertices.length);

    const selectedAnimation = mdl.meta.animations["swing"];

    for (const [from, to] of Object.values(mdl.meta.animations)) {
      for (
        let frame = /*from*/ from;
        frame < /*to*/ to /*mdl.meta.numFrames*/;
        frame++
      ) {
        const animationNumFrames = from - to;

        const nextFrame = ((frame - from + 1) % animationNumFrames) + from;
        // const nextFrame =
        //   ((frame + 1) % animationNumFrames) + selectedAnimation[0];
        // console.log(animationNumFrames, frame, nextFrame, frame + 1);
        const frameCurrIndex = frame * mdl.meta.numTriangles * 3 * 3;
        const frameNextIndex = nextFrame * mdl.meta.numTriangles * 3 * 3;

        for (let triangle = 0; triangle < mdl.meta.numTriangles; triangle++) {
          const idxCurrTri = triangle * 3 * 3;

          for (let vertex = 0; vertex < 3; vertex++) {
            for (let i = 0; i < 3; i++) {
              const idxCurr = frameCurrIndex + idxCurrTri + vertex * 3 + i;
              const idxNext = frameNextIndex + idxCurrTri + vertex * 3 + i;

              deltas[idxCurr] = mdl.vertices[idxNext] - mdl.vertices[idxCurr];

              // console.log(idxCurr);
            }
          }
        }
        /*
      const idxFrameCurr = mdl.meta.numTriangles * frame * 3;
      const idxFrameNext = mdl.meta.numTriangles * (frame + 1) * 3;
      
      for (let v = 0; v < mdl.meta.numVertices * 3; v++) {
        deltas[idxFrameCurr + v] = mdl.vertices[idxFrameNext + v] - mdl.vertices[idxFrameCurr + v];
      }
      */
      }
    }

    const deltaBuffer = createAttributeBuffer(gl, deltas);
    const uvsBuffer = createAttributeBuffer(gl, mdl.uvs);

    let time = 0;

    const renderFrame = () => {
      //  const time = 0; //Date.now() * -0.0005;
      const eye = [150, 100, 100]; // [Math.sin(time) * 200, 0 * Math.cos(time), 200 * Math.cos(time)];

      const target = [0, 0, 0];
      const up = [0, 1, 0];

      const view = m4.lookAt([], eye, target, up);
      const world = m4.fromYRotation([], time * 0.01);
      const viewProjection = m4.multiply([], projection, view);

      time += selectedAnimationSpeed;

      const animationNumFrames = selectedAnimation[1] - selectedAnimation[0];
      const animTime = selectedAnimation[0] + (time % animationNumFrames);

      let frame = Math.floor(animTime); // % mdl.meta.numFrames;
      const frac = animTime - frame;

      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);

      bindProgram(gl, program, {
        textures: {
          u_texture: texture,
        },
        matrix4: {
          u_viewProjection: viewProjection,
          u_world: world,
        },
        int: {
          u_shading: 2,
        },
        float: {
          u_frac: frac,
        },
      });

      bindBuffer(gl, program, {
        a_position: {
          buffer: positionBuffer,
          size: 3,
          type: gl.FLOAT,
        },
        a_delta: {
          buffer: deltaBuffer,
          size: 3,
          type: gl.FLOAT,
        },
        a_deltaNormal: {
          buffer: normalBuffer,
          size: 3,
          type: gl.FLOAT,
        },
        a_normal: {
          buffer: normalBuffer,
          size: 3,
          type: gl.FLOAT,
        },
        a_uv: {
          buffer: uvsBuffer,
          size: 2,
          type: gl.FLOAT,
        },
      });

      /*
      gl.drawArrays(gl.POINTS, frame * 3 * mdl.meta.numTriangles, 3 * mdl.meta.numTriangles);
      */
      gl.drawArrays(
        gl.TRIANGLES,
        frame * 3 * mdl.meta.numTriangles,
        3 * mdl.meta.numTriangles
      );

      requestAnimationFrame(renderFrame);
    };

    renderFrame();

    ///
    /*
    TODO:!!!

    gl.useProgram(null);
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
    */
  } catch (err) {
    console.error(err);
  }
})();
