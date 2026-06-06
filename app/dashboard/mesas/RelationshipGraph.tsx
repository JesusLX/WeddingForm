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
const CYCLE: RelationshipType[] = ['TOGETHER', 'KNOWS', 'APART']

interface Props {
  guests: SeatingGuest[]
  relationships: GuestRelationship[]
  weddingId: string
  onRelationshipsChange: (rels: GuestRelationship[]) => void
}

export function RelationshipGraph({ guests, relationships, weddingId, onRelationshipsChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null)
  const linkGroupRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null)
  const redrawLinksRef = useRef<((rels: GuestRelationship[]) => void) | null>(null)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  // Refs so D3 handlers always have latest values
  const selectedKeyRef = useRef<string | null>(null)
  const relsRef = useRef(relationships)
  const onChangeRef = useRef(onRelationshipsChange)
  const weddingIdRef = useRef(weddingId)

  useEffect(() => { selectedKeyRef.current = selectedKey }, [selectedKey])
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

    const nodes: any[] = guests.map(guest => ({
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
      .force('link', d3.forceLink<any, any>([]).id((d: any) => d.id).distance(110))
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(46))
    simulationRef.current = simulation

    simulation.on('tick', () => {
      linkGroup.selectAll<SVGLineElement, any>('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      nodeGroup.selectAll<SVGGElement, any>('g.node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
    })

    const nodeEl = nodeGroup.selectAll<SVGGElement, any>('g.node')
      .data(nodes, (d: any) => d.id)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, any>()
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

        let newRels: GuestRelationship[]
        if (idx >= 0) {
          const next = (CYCLE.indexOf(rels[idx].type) + 1) % CYCLE.length
          if (next === 0) {
            newRels = rels.filter((_, i) => i !== idx)
          } else {
            newRels = rels.map((r, i) => i === idx ? { ...r, type: CYCLE[next] } : r)
          }
        } else {
          newRels = [...rels, {
            id: crypto.randomUUID(),
            wedding_id: weddingIdRef.current,
            guest_a_key: aKey,
            guest_b_key: bKey,
            type: 'TOGETHER' as RelationshipType,
          }]
        }

        onChangeRef.current(newRels)
        setSelectedKey(null)
        redrawLinksRef.current?.(newRels)
      })

    // Circle
    nodeEl.append('circle')
      .attr('r', (d: any) => d.isChild ? 22 : 30)
      .attr('fill', (d: any) => d.isChild ? '#F4D7D7' : '#C9A84C')
      .attr('stroke', '#2D2D2D')
      .attr('stroke-width', 1.5)

    // Name (first name only)
    nodeEl.append('text')
      .text((d: any) => d.name.split(' ')[0])
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.isChild ? '-0.15em' : '0.35em')
      .attr('font-size', (d: any) => d.isChild ? '9px' : '11px')
      .attr('font-weight', '600')
      .attr('fill', (d: any) => d.isChild ? '#2D2D2D' : '#fff')
      .attr('pointer-events', 'none')

    // Child emoji
    nodeEl.filter((d: any) => d.isChild)
      .append('text')
      .text('👶')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.1em')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')

    // Link redraw function stored in ref
    const redrawLinks = (rels: GuestRelationship[]) => {
      linkGroup.selectAll('*').remove()
      const links = rels.map(r => ({
        source: r.guest_a_key,
        target: r.guest_b_key,
        type: r.type,
        id: r.id,
      }))
      ;(simulation.force('link') as d3.ForceLink<any, any>).links(links)
      linkGroup.selectAll<SVGLineElement, any>('line')
        .data(links, (d: any) => d.id)
        .enter().append('line')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.75)
        .attr('stroke', (d: any) => REL_COLORS[d.type as RelationshipType])
        .attr('stroke-dasharray', (d: any) => d.type === 'APART' ? '6,3' : 'none')
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
    d3.select(svgRef.current).selectAll<SVGCircleElement, any>('g.node circle')
      .attr('stroke', (d: any) => d.id === selectedKey ? '#FF6B35' : '#2D2D2D')
      .attr('stroke-width', (d: any) => d.id === selectedKey ? 4 : 1.5)
  }, [selectedKey])

  const selectedGuest = guests.find(g => g.key === selectedKey)

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        {(Object.entries(REL_LABELS) as [RelationshipType, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: '#2D2D2D' }}>
            <svg width="26" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="26" y2="5"
                stroke={REL_COLORS[type]} strokeWidth="2.5"
                strokeDasharray={type === 'APART' ? '5,2' : 'none'} />
            </svg>
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#2D2D2D' }}>
          <span className="inline-block w-4 h-4 rounded-full border border-gray-400" style={{ backgroundColor: '#F4D7D7' }} />
          Niño
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#2D2D2D' }}>
          <span className="inline-block w-5 h-5 rounded-full border border-gray-400" style={{ backgroundColor: '#C9A84C' }} />
          Adulto
        </div>
      </div>

      {/* Selection banner */}
      {selectedGuest && (
        <div className="mb-2 text-sm px-3 py-1.5 rounded-full inline-flex items-center gap-2"
          style={{ backgroundColor: '#FF6B3518', color: '#c0561f', border: '1px solid #FF6B3530' }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#FF6B35' }} />
          <strong>{selectedGuest.name}</strong> seleccionado — haz clic en otro invitado para crear/cambiar relación
          <button onClick={() => setSelectedKey(null)} className="ml-1 opacity-60 hover:opacity-100 text-base leading-none">×</button>
        </div>
      )}

      <svg ref={svgRef} className="w-full rounded-xl border"
        style={{ height: 520, backgroundColor: '#FAF7F4', borderColor: '#E5D5C5', display: 'block' }}
      />

      <p className="text-xs mt-2 text-center" style={{ color: '#9D8A7A' }}>
        Clic en un invitado → clic en otro para crear/cambiar relación (se cicla entre Misma mesa → Se conocen → Separar → eliminar). Arrastra para mover. Pellizca o rueda para zoom.
      </p>
    </div>
  )
}
