import type { ShaderModule } from "@luma.gl/shadertools";

const shader = /* glsl */ `
  vec3 rgbToRgb(vec3 rgb) {
    // rgb in [0.0, 1.0]
    float y = rgb.r;
    float cb = rgb.g - 0.5;
    float cr = rgb.b - 0.5;

    return vec3(
        1.0,
        y - 0.34414 * cb - 0.71414 * cr,
        y + 1.77200 * cb
    );
  }
`;

/**
 * A shader module that injects a unorm texture and uses a sampler2D to assign
 * to a color.
 */
export const rgbToRGB = {
  name: "rgb-to-rgb",
  inject: {
    "fs:#decl": shader,
    "fs:DECKGL_FILTER_COLOR": /* glsl */ `
      color.rgb = rgbToRgb(color.rgb);
    `,
  },
} as const satisfies ShaderModule;
