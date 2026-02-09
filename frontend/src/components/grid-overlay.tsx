export function GridOverlay({ dense = false }: { dense?: boolean }) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 hidden md:block ${dense ? 'grid-bg-dense' : 'grid-bg'}`}
      aria-hidden="true"
    />
  )
}

export function ScanLine() {
  return (
    <div
      className="fixed left-0 right-0 h-px pointer-events-none z-50 animate-scan-line"
      style={{
        background: "linear-gradient(90deg, transparent, var(--cyan-glow-intense), transparent)",
        boxShadow: "0 0 20px var(--cyan-glow-intense)"
      }}
      aria-hidden="true"
    />
  )
}

export function CornerMarkers() {
  const markerStyle = "absolute w-4 h-4 pointer-events-none"
  const lineStyle = { backgroundColor: "var(--cyan)", opacity: 0.5 }

  return (
    <>
      {/* Top Left */}
      <div className={`${markerStyle} top-8 left-0`}>
        <div className="absolute top-0 left-0 w-4 h-px" style={lineStyle} />
        <div className="absolute top-0 left-0 w-px h-4" style={lineStyle} />
      </div>

      {/* Top Right */}
      <div className={`${markerStyle} top-8 right-0`}>
        <div className="absolute top-0 right-0 w-4 h-px" style={lineStyle} />
        <div className="absolute top-0 right-0 w-px h-4" style={lineStyle} />
      </div>

      {/* Bottom Left */}
      <div className={`${markerStyle} bottom-0 left-0`}>
        <div className="absolute bottom-0 left-0 w-4 h-px" style={lineStyle} />
        <div className="absolute bottom-0 left-0 w-px h-4" style={lineStyle} />
      </div>

      {/* Bottom Right */}
      <div className={`${markerStyle} bottom-0 right-0`}>
        <div className="absolute bottom-0 right-0 w-4 h-px" style={lineStyle} />
        <div className="absolute bottom-0 right-0 w-px h-4" style={lineStyle} />
      </div>
    </>
  )
}
