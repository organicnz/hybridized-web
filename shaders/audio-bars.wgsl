// Fullscreen audio frequency-bar visualizer.
// Reads a fixed-size bar-height array from a storage buffer and renders
// gradient bars in the site palette (purple -> pink -> blue).

struct Params {
  time: f32,
  texel: vec2f,
  barCount: f32,
};

struct Spectrum {
  values: array<f32, 64>,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> spectrum: Spectrum;

fn spectrumAt(i: i32) -> f32 {
  return spectrum.values[i];
}

fn barColor(t: f32) -> vec3f {
  let purple = vec3f(0.659, 0.333, 0.969); // #a855f7
  let pink = vec3f(0.925, 0.282, 0.596); //   #ec4899
  let blue = vec3f(0.376, 0.549, 0.969); //  #60a5fa
  if (t < 0.5) {
    return mix(purple, pink, t * 2.0);
  }
  return mix(pink, blue, (t - 0.5) * 2.0);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  // uv is top-origin: v grows downward, so bars rise from v = 1.0.
  let x = clamp(uv.x, 0.0, 0.99999) * params.barCount;
  let index = i32(floor(x));
  let height = clamp(spectrumAt(index), 0.0, 1.0);

  let barTop = 1.0 - height;
  let inBar = step(barTop, uv.y);

  // Bright cap near the top edge of each bar.
  let cap = smoothstep(barTop - 0.06, barTop, uv.y) * inBar;
  // Soft glow bleeding above the bar.
  let glow = smoothstep(barTop - 0.35, barTop, uv.y) * (1.0 - inBar) * 0.25 * height;

  let color = barColor(height);
  let alpha = clamp(inBar * 0.92 + cap * 0.08 + glow, 0.0, 1.0);

  // Faint baseline so silent bars still read as a surface.
  let baseline = smoothstep(0.985, 1.0, uv.y) * 0.35;

  let bg = vec4f(0.02, 0.02, 0.05, 1.0);
  let fg = vec4f(color, 1.0);
  return mix(bg, fg, alpha) + vec4f(0.0, 0.0, 0.0, baseline);
}
