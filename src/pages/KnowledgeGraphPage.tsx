import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Info } from 'lucide-react'
import { mockGraphData } from '../data/mockData'

export function KnowledgeGraphPage() {
  // Since react-force-graph-2d requires a DOM environment, we'll create a canvas-based visualization
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const nodes = mockGraphData.nodes.map((n, i) => ({
      ...n,
      x: (canvas.width / 2) + Math.cos((i / mockGraphData.nodes.length) * Math.PI * 2) * (150 + Math.random() * 100),
      y: (canvas.height / 2) + Math.sin((i / mockGraphData.nodes.length) * Math.PI * 2) * (120 + Math.random() * 80),
      vx: 0,
      vy: 0,
    }))

    let frame = 0
    const animate = () => {
      if (frame > 200) return
      frame++

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw links
      mockGraphData.links.forEach((link) => {
        const src = nodes.find((n) => n.id === link.source)
        const tgt = nodes.find((n) => n.id === link.target)
        if (!src || !tgt) return
        ctx.beginPath()
        ctx.moveTo(src.x, src.y)
        ctx.lineTo(tgt.x, tgt.y)
        ctx.strokeStyle = `rgba(99,102,241,${0.1 + link.value * 0.08})`
        ctx.lineWidth = link.value * 0.5
        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        const radius = node.size / 4
        const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius)
        grd.addColorStop(0, node.color + 'ff')
        grd.addColorStop(1, node.color + '44')
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()
        ctx.strokeStyle = node.color + '88'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Label
        ctx.fillStyle = '#f1f5f9'
        ctx.font = `${node.type === 'candidate' ? 'bold ' : ''}11px Inter`
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y + radius + 14)
      })

      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <div className="space-y-5 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent-400" />
            Knowledge Graph
          </h2>
          <p className="text-sm text-muted">Skill relationships, candidate connections, and domain adjacency maps</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 glass-sm rounded-xl px-4 py-2.5">
        {[
          { label: 'Domain', color: '#6366f1' },
          { label: 'Skill', color: '#06b6d4' },
          { label: 'Candidate', color: '#f59e0b' },
          { label: 'Hidden Gem', color: '#ec4899' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted">
          <Info className="w-3.5 h-3.5" />
          Interactive graph — scroll to zoom, drag to pan
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-0 overflow-hidden"
        style={{ height: '520px' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.04) 0%, transparent 70%)' }}
        />
      </motion.div>

      {/* Node stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Skill Nodes', value: mockGraphData.nodes.filter((n) => n.type === 'skill').length },
          { label: 'Domain Nodes', value: mockGraphData.nodes.filter((n) => n.type === 'domain').length },
          { label: 'Candidate Nodes', value: mockGraphData.nodes.filter((n) => n.type === 'candidate').length },
          { label: 'Connections', value: mockGraphData.links.length },
        ].map((s) => (
          <div key={s.label} className="glass-sm rounded-xl p-4 text-center">
            <p className="text-2xl font-bold gradient-text">{s.value}</p>
            <p className="text-xs text-muted mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
