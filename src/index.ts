import {
  UiCanvas,
  UiDropZone,
  UiFilePicker,
  UiRadioGroup,
  UiSelect,
  UiStatus,
} from "./components";
import { ArrayReader } from "./mdl/ArrayReader";
import { fileFromPath } from "./files";
import { loadMdl } from "./mdl/loader";
import {
  bindBuffer,
  bindProgram,
  createAttributeBuffer,
  createProgram,
  createTexture,
  deleteBuffer,
  deleteProgram,
  deleteTexture,
} from "./rendering";
import SHADER_FS from "./shaders/mesh.fs";
import SHADER_VS from "./shaders/mesh.vs";
import { buildFrameDeltas, extractAnimationsFromFrames } from "./mdl/helpers";
import { MdlAnimation } from "./mdl/types";

const m4 = require("gl-mat4");

const DEFAULT_FILE = "soldier.mdl";
const RENDER_RESOLUTION = 1000;
const RENDER_FOV = 1.2;

enum OptionsRenderCamera {
  Spin = "Spin",
  Fixed = "Fixed",
}

enum OptionsRenderShading {
  Solid = "Solid",
  Normals = "Normals",
  Texture = "Texture",
  Lighting = "Lighting",
}

enum OptionsRenderMode {
  Triangles = "Triangles",
  Points = "Points",
}

enum OptionsRenderResolution {
  Half = "half",
  Full = "full",
}

(async () => {
  const handleError = (error: Error) => {
    UiStatus.Update("status", `⚠️ ${error?.message ?? "Something went wrong"}`);
  };

  try {
    const state = {
      animationCurrent: null,
      animationSpeed: 1,
      animationInterpolate: true,
      modelSkin: null,
      modelFile: null,
      renderCamera: OptionsRenderCamera.Spin,
      renderShading: OptionsRenderShading.Lighting,
      renderResolutionFactor: 1,
      renderMode: OptionsRenderMode.Triangles,
    };

    // Setup UI

    UiDropZone.Bind("file", "Drop MDL file to display", async (event) => {
      releaseScene?.();

      const files = Array.from(event.dataTransfer.files);
      const [file] = files;

      if (file) {
        releaseScene = await createScene(file);
      }
    });

    UiRadioGroup.Bind(
      "animation-speed",
      [
        { label: "1/2x", value: "0.5" },
        { label: "1x", value: "1" },
        { label: "10x", value: "10" },
        { label: "20x", value: "20" },
      ],
      (item) => {
        state.animationSpeed = Number.parseFloat(item.value);
      },
      `${state.animationSpeed}`
    );

    UiRadioGroup.Bind(
      "animation-smooth",
      [
        { label: "On", value: "true" },
        { label: "Off", value: "false" },
      ],
      (item) => {
        state.animationInterpolate = item.value === "true";
      },
      `${state.animationInterpolate}`
    );

    UiRadioGroup.Bind(
      "render-mode",
      [
        { label: "Triangles", value: OptionsRenderMode.Triangles },
        { label: "Points", value: OptionsRenderMode.Points },
      ],
      (item) => {
        state.renderMode = item.value;
      },
      `${state.renderMode}`
    );

    UiRadioGroup.Bind(
      "render-shading",
      [
        { label: "Solid", value: OptionsRenderShading.Solid },
        { label: "Normals", value: OptionsRenderShading.Normals },
        { label: "Texture", value: OptionsRenderShading.Texture },
        { label: "Lighting", value: OptionsRenderShading.Lighting },
      ],
      (item) => {
        state.renderShading = item.value;
      },
      `${state.renderShading}`
    );

    UiRadioGroup.Bind(
      "render-camera",
      [
        { label: "Fixed", value: OptionsRenderCamera.Fixed },
        { label: "Spin", value: OptionsRenderCamera.Spin },
      ],
      (item) => {
        state.renderCamera = item.value;
      },
      `${state.renderCamera}`
    );

    UiRadioGroup.Bind(
      "render-resolution",
      [
        { label: "Full", value: OptionsRenderResolution.Full },
        { label: "Half", value: OptionsRenderResolution.Half },
      ],
      (item) => {
        state.renderResolutionFactor =
          item.value === OptionsRenderResolution.Full ? 1 : 0.5;
      },
      state.renderResolutionFactor === 1
        ? OptionsRenderResolution.Full
        : OptionsRenderResolution.Half
    );

    UiFilePicker.Bind("model-file", async (file) => {
      releaseScene?.();

      if (file) {
        releaseScene = await createScene(file);
      }
    });

    UiSelect.Bind<MdlAnimation>("animation-current", (animation) => {
      state.animationCurrent = animation;
    });

    UiSelect.Bind<number>("model-skin", (modelSkin) => {
      state.modelSkin = modelSkin;
    });

    const uiCanvas = UiCanvas.Bind("canvas");
    uiCanvas.setDimensions(RENDER_RESOLUTION, RENDER_RESOLUTION);

    const gl = uiCanvas.getWebGlContext();

    gl.enable(gl.DEPTH_TEST);

    const createScene = async (file: File) => {
      let normalBuffer: WebGLBuffer = null;
      let positionBuffer: WebGLBuffer = null;
      let deltaBuffer: WebGLBuffer = null;
      let uvsBuffer: WebGLBuffer = null;
      let textures: WebGLTexture[] = [];
      let program: WebGLProgram = null;

      let time = 0;
      let duration = 0;
      let rendering = true;

      try {
        UiStatus.Update("status", `Loading..`);

        const arrayBuffer = await file.arrayBuffer();
        const arrayReader = new ArrayReader(arrayBuffer);

        const mdl = await loadMdl(arrayReader);
        textures = mdl.skins.map((skin) =>
          createTexture(gl, mdl.meta.skinWidth, mdl.meta.skinHeight, skin)
        );

        program = createProgram(gl, SHADER_VS, SHADER_FS);

        const animations = extractAnimationsFromFrames(mdl.frames);
        const deltas = buildFrameDeltas(animations, mdl);
        const selectedAnimation = animations[Object.keys(animations)[0]]; // animations["walk"];

        normalBuffer = createAttributeBuffer(gl, mdl.normals);
        positionBuffer = createAttributeBuffer(gl, mdl.positions);
        deltaBuffer = createAttributeBuffer(gl, deltas);
        uvsBuffer = createAttributeBuffer(gl, mdl.uvs);

        state.modelFile = mdl;
        state.animationCurrent = selectedAnimation;

        const render = () => {
          if (!rendering) {
            return;
          }

          const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
          const zNear = 0.1;
          const zFar = 500;

          const projection = m4.perspective(
            [],
            RENDER_FOV,
            aspect,
            zNear,
            zFar
          );
          const eye = [150, 20, 20];
          const target = [0, 0, 0];
          const up = [0, 1, 0];

          const view = m4.lookAt([], eye, target, up);
          const timeNext = Date.now();
          const dt = (timeNext - time) / 1000.0;
          time = timeNext;
          duration += dt * state.animationSpeed;

          let animTime = 0;
          if (state.animationCurrent) {
            const animationNumFrames =
              state.animationCurrent[1] - state.animationCurrent[0];
            animTime =
              state.animationCurrent[0] + (duration % animationNumFrames);
          }

          const frame = Math.floor(animTime);

          const u_frac = state.animationInterpolate ? animTime - frame : 0;
          const u_texture = textures[state.modelSkin ?? 0];
          const u_world =
            state.renderCamera === OptionsRenderCamera.Fixed
              ? m4.identity([])
              : m4.fromYRotation([], duration);
          const u_viewProjection = m4.multiply([], projection, view);
          const u_shading =
            state.renderShading === OptionsRenderShading.Texture
              ? 2
              : state.renderShading === OptionsRenderShading.Normals
              ? 1
              : state.renderShading === OptionsRenderShading.Solid
              ? 0
              : state.renderShading === OptionsRenderShading.Lighting
              ? 3
              : 3;

          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.clearColor(0.0, 0.0, 0.0, 0.0);

          bindProgram(gl, program, {
            textures: {
              u_texture,
            },
            matrix4: {
              u_viewProjection,
              u_world,
            },
            int: {
              u_shading,
            },
            float: {
              u_frac,
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

          switch (state.renderMode) {
            case OptionsRenderMode.Points: {
              gl.drawArrays(
                gl.POINTS,
                frame * 3 * mdl.meta.numTriangles,
                3 * mdl.meta.numTriangles
              );
              break;
            }
            case OptionsRenderMode.Triangles: {
              gl.drawArrays(
                gl.TRIANGLES,
                frame * 3 * mdl.meta.numTriangles,
                3 * mdl.meta.numTriangles
              );
              break;
            }
          }

          uiCanvas.setDimensions(
            RENDER_RESOLUTION * state.renderResolutionFactor,
            RENDER_RESOLUTION * state.renderResolutionFactor
          );

          requestAnimationFrame(render);
        };

        time = Date.now();

        requestAnimationFrame(render);

        UiSelect.Update<MdlAnimation>(
          "animation-current",
          Object.entries(animations).map(([label, value]) => ({
            label,
            value,
          }))
        );

        UiSelect.Update(
          "model-skin",
          mdl.skins.concat(mdl.skins).map((_, i) => ({
            label: `${i}`,
            value: i,
          }))
        );

        UiFilePicker.Update("model-file", file);

        UiStatus.Update("status", null);
      } catch (error) {
        handleError(error);
      } finally {
        return () => {
          rendering = false;

          deleteBuffer(gl, normalBuffer);
          deleteBuffer(gl, positionBuffer);
          deleteBuffer(gl, deltaBuffer);
          deleteBuffer(gl, uvsBuffer);

          textures.forEach((texture) => deleteTexture(gl, texture));

          deleteProgram(gl, program);
        };
      }
    };

    const file = await fileFromPath(`/${DEFAULT_FILE}`);
    let releaseScene = await createScene(file);
  } catch (error) {
    handleError(error);
  }
})();
