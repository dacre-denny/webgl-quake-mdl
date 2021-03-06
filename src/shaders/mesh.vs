#version 100
precision mediump float;

uniform float u_frac;
uniform mat4 u_viewProjection;
uniform mat4 u_world;

attribute vec4 a_position;
attribute vec3 a_deltaPosition;
attribute vec3 a_deltaNormal;

attribute vec3 a_normal;
attribute vec2 a_uv;

varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_uv;

void main() {
  
  v_position = u_world * (a_position + vec4(a_deltaPosition.x, a_deltaPosition.y, a_deltaPosition.z, 0.0) * u_frac);
  v_normal = (u_world * vec4(a_normal + (a_deltaNormal * u_frac), 0.0)).xyz;
  v_uv = a_uv;
  gl_PointSize = 4.0;
  gl_Position = u_viewProjection * v_position;
}