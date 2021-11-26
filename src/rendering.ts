/**
 *
 * @param gl
 * @param vertexShaderSource
 * @param fragmentShaderSource
 * @returns
 */
export const createProgram = async (gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);

  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(vertexShader);
    throw new Error(`Failed to compile vertex shader. ${info}`);
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(fragmentShader);
    throw new Error(`Failed to compile fragment shader. ${info}`);
  }

  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    throw new Error(`Failed to link program. ${info}`);
  }

  return program;
};

/**
 *
 * @param gl
 * @param program
 * @param uniforms
 */
export const bindProgram = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  uniforms?: {
    textures?: {
      [key: string]: WebGLTexture;
    };
    matrix4?: {
      [key: string]: number[];
    };
    matrix3?: {
      [key: string]: number[];
    };
    matrix2?: {
      [key: string]: number[];
    };
    float?: {
      [key: string]: number;
    };
  }
) => {
  gl.useProgram(program);

  /*
        // Tell WebGL we want to affect texture unit 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
 */
  let sampler = 0;
  const textures = uniforms?.textures ?? {};
  for (const name in textures) {
    const texture = textures[name];

    if (texture) {
      const uniformLocation = gl.getUniformLocation(program, name);

      if (uniformLocation) {
        gl.activeTexture(gl.TEXTURE0 + sampler);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniformLocation, sampler);

        sampler++;
      }
    }
  }

  const matrix4 = uniforms?.matrix4 ?? {};
  for (const name in matrix4) {
    const value = matrix4[name];

    if (value) {
      const uniformLocation = gl.getUniformLocation(program, name);

      if (uniformLocation) {
        gl.uniformMatrix4fv(uniformLocation, false, value);
      }
    }
  }

  const float = uniforms?.float ?? {};
  for (const name in float) {
    const value = float[name];

    if (value) {
      const uniformLocation = gl.getUniformLocation(program, name);

      if (uniformLocation) {
        gl.uniform1f(uniformLocation, value);
      }
    }
  }
};

/**
 *
 * @param gl
 * @param data
 */
export const createAttributeBuffer = (gl: WebGLRenderingContext, data: Float32Array) => {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buffer;
};

/**
 *
 * @param gl
 * @param data
 */
export const createIndicesBuffer = (gl: WebGLRenderingContext, data: Uint16Array) => {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buffer;
};

export const bindBuffer = (
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  attributes: {
    [key: string]: {
      buffer: WebGLBuffer;
      size: number;
      type: number;
      offset?: number;
      stride?: number;
    };
  }
) => {
  for (const name in attributes) {
    const params = attributes[name];
    if (params) {
      const attributeLocation = gl.getAttribLocation(program, name);
      if (attributeLocation > -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, params.buffer);
        gl.enableVertexAttribArray(attributeLocation);
        gl.vertexAttribPointer(attributeLocation, params.size, params.type, false, params.stride ?? 0, params.offset ?? 0);
      }
    }
  }

  // gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
};

export const createTexture = (gl: WebGLRenderingContext, width: number, height: number, data: Uint8Array) => {
  const texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, data);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
};
