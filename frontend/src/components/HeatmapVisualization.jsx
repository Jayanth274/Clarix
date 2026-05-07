import { useState } from 'react'

export default function HeatmapVisualization({ screenshot, factors }) {
  const [showHeatmap, setShowHeatmap] = useState(true)

  // Mock heatmap zones based on factors
  // In a real implementation, this would be generated from actual DOM analysis
  const heatmapZones = [
    { x: 10, y: 20, width: 30, height: 15, intensity: factors.visualOverload / 100, label: 'Visual Overload' },
    { x: 50, y: 10, width: 20, height: 10, intensity: factors.navigationConfusion / 100, label: 'Nav Confusion' },
    { x: 15, y: 60, width: 40, height: 20, intensity: factors.choiceFatigue / 100, label: 'Choice Fatigue' },
    { x: 60, y: 50, width: 30, height: 25, intensity: factors.clickComplexity / 100, label: 'Click Complexity' },
  ]

  const getZoneColor = (intensity) => {
    if (intensity < 0.3) return 'rgba(34, 197, 94, 0.4)' // green
    if (intensity < 0.6) return 'rgba(234, 179, 8, 0.4)' // yellow
    return 'rgba(239, 68, 68, 0.4)' // red
  }

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-300">
          Red zones indicate high cognitive friction, green zones are optimized.
        </p>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          {showHeatmap ? 'Hide' : 'Show'} Heatmap
        </button>
      </div>

      <div className="relative bg-gray-800 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {screenshot ? (
          <img
            src={screenshot}
            alt="Website screenshot"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
            <p className="text-gray-400">Screenshot preview</p>
          </div>
        )}

        {showHeatmap && (
          <div className="absolute inset-0">
            {heatmapZones.map((zone, i) => (
              <div
                key={i}
                className="absolute border-2 rounded-lg transition-all hover:scale-105"
                style={{
                  left: `${zone.x}%`,
                  top: `${zone.y}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  backgroundColor: getZoneColor(zone.intensity),
                  borderColor: getZoneColor(zone.intensity).replace('0.4', '0.8'),
                }}
                title={zone.label}
              >
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                  {zone.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/40 border border-green-500 rounded"></div>
          <span className="text-gray-300">Low friction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500/40 border border-yellow-500 rounded"></div>
          <span className="text-gray-300">Moderate friction</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500/40 border border-red-500 rounded"></div>
          <span className="text-gray-300">High friction</span>
        </div>
      </div>
    </div>
  )
}
