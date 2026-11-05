/** Presentation-only lighting. Never advances the business clock. */
export function daylight(minute: number, cloudy = false) {
  const t = ((minute % 1440) + 1440) % 1440;
  const elevation = Math.sin((t - 360) / 720 * Math.PI);
  const day = Math.max(0, Math.min(1, (elevation + .08) / .3));
  const golden = day * Math.max(0, 1 - Math.abs(elevation - .16) / .32);
  return {
    golden,
    sky: elevation < -.08 ? '#263a50' : golden > .35 ? '#d8b8a0' : cloudy ? '#bcc8c5' : '#c9dedf',
    sunlight: .15 + day * (cloudy ? 1.15 : 2.85),
    sunColor: golden > .35 ? '#ffc58c' : '#fff0cf',
    sunY: Math.max(2, elevation * 18),
    sunX: -Math.cos((t - 360) / 720 * Math.PI) * 20,
    night: day < .15,
  };
}
