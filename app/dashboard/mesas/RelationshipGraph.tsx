'use client'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { SeatingGuest, GuestRelationship, RelationshipType } from '@/lib/types'

const REL_COLORS: Record<RelationshipType, string> = {
  TOGETHER: '#4CAF50',
  KNOWS: '#2196F3',
  APART: '#F44336',
}
const REL_LABELS: Record<RelationshipType, string> = {
  TOGETHER: 'Misma mesa',
  KNOWS: 'Se conocen',
  APART: 'Separar',
}

type Tool = RelationshipType | 'DELETE'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  isChild: boolean
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string
  type: RelationshipType
}

interface Props {
  guests: SeatingGuest[]
  relationships: GuestRelationship[]
  weddingId: string
  onRelationshipsChange: (rels: GuestRelationship[]) => void
}

export function RelationshipGraph({ guests, relationships, weddingId, onRelationshipsChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)
  const linkGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const redrawLinksRef = useRef<((rels: GuestRelationship[]) => void) | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('TOGETHER')

  // Refs so D3 handlers always have latest values
  const selectedKeyRef = useRef<string | null>(null)
  const activeToolRef = useRef<Tool>('TOGETHER')
  const relsRef = useRef(relationships)
  const onChangeRef = useRef(onRelationshipsChange)
  const weddingIdRef = useRef(weddingId)

  useEffect(() => { selectedKeyRef.current = selectedKey }, [selectedKey])
  useEffect(() => { activeToolRef.current = activeTool }, [activeTool])
  useEffect(() => { relsRef.current = relationships }, [relationships])
  useEffect(() => { onChangeRef.current = onRelationshipsChange }, [onRelationshipsChange])
  useEffect(() => { weddingIdRef.current = weddingId }, [weddingId])

  // Initialize D3 simulation once per guests change
  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    simulationRef.current?.stop()

    if (guests.length === 0) return

    const W = svgRef.current.clientWidth || 700
    const H = 520

    const g = svg.append('g')
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.25, 3])
        .on('zoom', ev => g.attr('transform', ev.transform))
    )
    svg.on('click.bg', () => setSelectedKey(null))

    const nodes: GraphNode[] = guests.map(guest => ({
      id: guest.key,
      name: guest.name,
      isChild: guest.isChild,
      x: W / 2 + (Math.random() - 0.5) * 400,
      y: H / 2 + (Math.random() - 0.5) * 300,
    }))

    const linkGroup = g.append('g')
    const nodeGroup = g.append('g')
    linkGroupRef.current = linkGroup

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>([]).id(d => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(46))
    simulationRef.current = simulation

    simulation.on('tick', () => {
      linkGroup.selectAll<SVGLineElement, GraphLink>('line')
        .attr('x1', d => (d.source as GraphNode).x ?? 0)
        .attr('y1', d => (d.source as GraphNode).y ?? 0)
        .attr('x2', d => (d.target as GraphNode).x ?? 0)
        .attr('y2', d => (d.target as GraphNode).y ?? 0)
      nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

    const nodeEl = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
      .data(nodes, d => d.id)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
          .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y })
          .on('end', (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null })
      )
      .on('click.select', (ev, d) => {
        ev.stopPropagation()
        const prev = selectedKeyRef.current
        if (!prev) { setSelectedKey(d.id); return }
        if (prev === d.id) { setSelectedKey(null); return }

        const aKey = prev < d.id ? prev : d.id
        const bKey = prev < d.id ? d.id : prev
        const rels = relsRef.current
        const idx = rels.findIndex(r => r.guest_a_key === aKey && r.guest_b_key === bKey)
        const tool = activeToolRef.current

        let newRels: GuestRelationship[]
        if (tool === 'DELETE') {
          newRels = idx >= 0 ? rels.filter((_, i) => i !== idx) : rels
        } else if (idx >= 0) {
          newRels = rels.map((r, i) => i === idx ? { ...r, type: tool } : r)
        } else {
          newRels = [...rels, {
            id: crypto.randomUUID(),
            wedding_id: weddingIdRef.current,
            guest_a_key: aKey,
            guest_b_key: bKey,
            type: tool,
          }]
        }

        onChangeRef.current(newRels)
        setSelectedKey(null)
        redrawLinksRef.current?.(newRels)
      })

    // Circle
    nodeEl.append('circle')
      .attr('r', d => d.isChild ? 22 : 30)
      .attr('fill', d => d.isChild ? '#F4D7D7' : '#C9A84C')
      .attr('stroke', '#2D2D2D')
      .attr('stroke-width', 1.5)

    // Name (first name only)
    nodeEl.append('text')
      .text(d => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.isChild ? '-0.15em' : '0.35em')
      .attr('font-size', d => d.isChild ? '9px' : '11px')
      .attr('font-weight', '600')
      .attr('fill', d => d.isChild ? '#2D2D2D' : '#fff')
      .attr('pointer-events', 'none')

    // Child emoji
    nodeEl.filter(d => d.isChild)
      .append('text')
      .text('👶')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')

    const redrawLinks = (rels: GuestRelationship[]) => {
      linkGroup.selectAll('*').remove()
      const links: GraphLink[] = rels.map(r => ({
        source: r.guest_a_key,
        target: r.guest_b_key,
        type: r.type,
        id: r.id,
      }))
      ;(simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>).links(links)
      linkGroup.selectAll<SVGLineElement, GraphLink>('line')
        .data(links, d => d.id)
        .enter().append('line')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.75)
        .attr('stroke', d => REL_COLORS[d.type])
        .attr('stroke-dasharray', d => d.type === 'APART' ? '6,3' : 'none')
      simulation.alpha(0.25).restart()
    }
    redrawLinksRef.current = redrawLinks
    redrawLinks(relsRef.current)

    return () => { simulation.stop() }
  }, [guests]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync links when relationships prop changes externally
  useEffect(() => {
    redrawLinksRef.current?.(relationships)
  }, [relationships])

  // Selection highlight
  useEffect(() => {
    if (!svgRef.current) return
    d3.select(svgRef.current).selectAll<SVGCircleElement, GraphNode>('g.node circle')
      .attr('stroke', d => d.id === selectedKey ? '#FF6B35' : '#2D2D2D')
      .attr('stroke-width', d => d.id === selectedKey ? 4 : 1.5)
  }, [selectedKey])

  const selectedGuest = guests.find(g => g.key === selectedKey)

  const toolConfig: { tool: Tool; label: string; color: string; dash?: string; icon: string }[] = [
    { tool: 'TOGETHER', label: 'Misma mesa', color: REL_COLORS.TOGETHER, icon: '💚' },
    { tool: 'KNOWS',    label: 'Se conocen',  color: REL_COLORS.KNOWS,   icon: '💙' },
    { tool: 'APART',    label: 'Separar',     color: REL_COLORS.APART,   dash: '5,2', icon: '❤️' },
    { tool: 'DELETE',   label: 'Borrar',      color: '#888',             icon: '✕' },
  ]

  return (
    <div>
      {/* Tool selector (legend) */}
      <div className="flex flex-wrap gap-2 mb-3">
        {toolConfig.map(({ tool, label, color, dash, icon }) => {
          const isActive = activeTool === tool
          return (
            <button
              key={tool}
              onClick={() => setActiveTool(tool)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{
                backgroundColor: isActive ? color + '22' : '#fff',
                borderColor: isActive ? color : '#E5D5C5',
                color: isActive ? color : '#9D8A7A',
                boxShadow: isActive ? `0 0 0 2px ${color}44` : 'none',
              }}
            >
              {tool !== 'DELETE' ? (
                <svg width="22" height="8" aria-hidden="true" className="flex-shrink-0">
                  <line x1="0" y1="4" x2="22" y2="4"
                    stroke={color} strokeWidth="2.5"
                    strokeDasharray={dash ?? 'none'} />
                </svg>
              ) : (
                <span>{icon}</span>
              )}
              {label}
            </button>
          )
        })}
        <div className="flex items-center gap-1.5 text-xs ml-2" style={{ color: '#9D8A7A' }}>
          <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: '#F4D7D7' }} />
          Niño
        </div>
      </div>

      {/* Selection banner */}
      {selectedGuest ? (
        <div className="mb-2 text-sm px-3 py-1.5 rounded-full inline-flex items-center gap-2"
          style={{ backgroundColor: '#FF6B3518', color: '#c0561f', border: '1px solid #FF6B3530' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#FF6B35' }} />
          <strong>{selectedGuest.name}</strong> seleccionado — haz clic en otro invitado para{' '}
          {activeTool === 'DELETE' ? 'borrar la relación' : `marcar como "${REL_LABELS[activeTool as RelationshipType]}"`}
          <button onClick={() => setSelectedKey(null)} className="ml-1 opacity-60 hover:opacity-100 text-base leading-none">×</button>
        </div>
      ) : (
        <p className="mb-2 text-xs" style={{ color: '#9D8A7A' }}>
          Herramienta activa: <strong style={{ color: activeTool === 'DELETE' ? '#888' : REL_COLORS[activeTool as RelationshipType] }}>
            {activeTool === 'DELETE' ? 'Borrar relación' : REL_LABELS[activeTool as RelationshipType]}
          </strong> — haz clic en un invitado para seleccionarlo
        </p>
      )}

      <svg ref={svgRef} className="w-full rounded-xl border"
        style={{ height: 520, backgroundColor: '#FAF7F4', borderColor: '#E5D5C5', display: 'block' }}
      />

      <p className="text-xs mt-2 text-center" style={{ color: '#9D8A7A' }}>
        Selecciona un tipo de relación arriba → clic en dos invitados para aplicarla. Arrastra para mover. Pellizca o rueda para zoom.
      </p>
    </div>
  )
}
