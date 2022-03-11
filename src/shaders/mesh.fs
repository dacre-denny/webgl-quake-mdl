#version 100
precision mediump float;

#define SHADE_SOLID 0
#define SHADE_NORMALS 1
#define SHADE_TEXTURE 2
#define SHADE_LIGHTING 3

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
  vec4 f_color = vec4(1.0);

  if(u_shading == SHADE_TEXTURE) {
    f_color = texture2D(u_texture, v_uv);
  }
  else if(u_shading == SHADE_SOLID) {
    f_color = vec4(0.5, 0.5, 0.5, 1.0);
  }
  else if(u_shading == SHADE_NORMALS) {
    f_color = vec4(v_normal.xyz * 0.5 + 0.5, 1.0);
  }
  else {
    f_color = texture2D(u_texture, v_uv) * l_color;
  }

  gl_FragColor = f_color;
}