export function Crosshair() {
  return (
    <div aria-hidden="true" className="hud-crosshair">
      <span className="hud-crosshair__corner hud-crosshair__corner--top-left" />
      <span className="hud-crosshair__corner hud-crosshair__corner--top-right" />
      <span className="hud-crosshair__corner hud-crosshair__corner--bottom-left" />
      <span className="hud-crosshair__corner hud-crosshair__corner--bottom-right" />
      <span className="hud-crosshair__ring" />
      <span className="hud-crosshair__dot" />
    </div>
  );
}
