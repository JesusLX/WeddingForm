import type { SeatingGuest, GuestRelationship } from './types'

class UnionFind {
  private parent = new Map<string, string>()

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    const p = this.parent.get(x)!
    if (p !== x) this.parent.set(x, this.find(p))
    return this.parent.get(x)!
  }

  union(x: string, y: string) {
    const px = this.find(x), py = this.find(y)
    if (px !== py) this.parent.set(px, py)
  }
}

export interface AssignmentResult {
  assignments: Map<string, number> // guestKey -> tableNumber (1-based)
  warnings: string[]
}

export function autoAssignSeats(
  guests: SeatingGuest[],
  relationships: GuestRelationship[],
  tablesCount: number,
  maxPerTable: number,
): AssignmentResult {
  const warnings: string[] = []
  if (guests.length === 0) return { assignments: new Map(), warnings }

  // 1. Build TOGETHER clusters: same RSVP + explicit TOGETHER relations
  const uf = new UnionFind()
  guests.forEach(g => uf.find(g.key))

  const rsvpGroups = new Map<string, string[]>()
  guests.forEach(g => {
    const arr = rsvpGroups.get(g.rsvpId) ?? []
    arr.push(g.key)
    rsvpGroups.set(g.rsvpId, arr)
  })
  rsvpGroups.forEach(keys => {
    for (let i = 1; i < keys.length; i++) uf.union(keys[0], keys[i])
  })
  relationships.filter(r => r.type === 'TOGETHER').forEach(r => {
    uf.union(r.guest_a_key, r.guest_b_key)
  })

  // 2. Build clusters sorted largest first
  const clusterMap = new Map<string, string[]>()
  guests.forEach(g => {
    const root = uf.find(g.key)
    const arr = clusterMap.get(root) ?? []
    arr.push(g.key)
    clusterMap.set(root, arr)
  })
  const clusters = [...clusterMap.values()].sort((a, b) => b.length - a.length)

  // 3. Build APART and KNOWS sets
  const apart = new Map<string, Set<string>>()
  const knows = new Map<string, Set<string>>()
  relationships.forEach(r => {
    const add = (m: Map<string, Set<string>>, a: string, b: string) => {
      if (!m.has(a)) m.set(a, new Set())
      if (!m.has(b)) m.set(b, new Set())
      m.get(a)!.add(b)
      m.get(b)!.add(a)
    }
    if (r.type === 'APART') add(apart, r.guest_a_key, r.guest_b_key)
    else if (r.type === 'KNOWS') add(knows, r.guest_a_key, r.guest_b_key)
  })

  // 4. Greedy assignment
  const tables: string[][] = Array.from({ length: tablesCount }, () => [])
  const assignments = new Map<string, number>()

  for (const cluster of clusters) {
    if (cluster.length > maxPerTable) {
      warnings.push(`Un grupo de ${cluster.length} personas supera el máximo por mesa (${maxPerTable}). Se dividirá.`)
    }

    let bestTable = -1
    let bestScore = -Infinity

    for (let t = 0; t < tablesCount; t++) {
      if (tables[t].length + cluster.length > maxPerTable) continue

      // Hard constraint: no APART pairs
      let conflict = false
      for (const gKey of cluster) {
        const a = apart.get(gKey)
        if (a) for (const existing of tables[t]) {
          if (a.has(existing)) { conflict = true; break }
        }
        if (conflict) break
      }
      if (conflict) continue

      // Score: KNOWS connections + prefer partially filled tables
      let score = tables[t].length > 0 ? 0.5 : 0
      for (const gKey of cluster) {
        const k = knows.get(gKey)
        if (k) for (const existing of tables[t]) {
          if (k.has(existing)) score++
        }
      }

      if (score > bestScore) { bestScore = score; bestTable = t }
    }

    if (bestTable === -1) {
      // Ignore APART, pick table with most space
      bestTable = tables.reduce(
        (best, t, i) => t.length < tables[best].length ? i : best, 0
      )
      warnings.push('No fue posible respetar todas las restricciones de separación.')
    }

    tables[bestTable].push(...cluster)
    cluster.forEach(k => assignments.set(k, bestTable + 1))
  }

  return { assignments, warnings }
}

export function guestsFromResponses(responses: {
  id: string
  guest_name: string
  attendance: boolean
  adults_count: number
  adult_names: string[] | null
  has_children: boolean
  children_count: number
  children_names: string[] | null
}[]): SeatingGuest[] {
  const guests: SeatingGuest[] = []
  for (const r of responses) {
    if (!r.attendance) continue
    const names = r.adult_names?.length ? r.adult_names : [r.guest_name]
    for (let i = 0; i < (r.adults_count || 1); i++) {
      guests.push({
        key: `${r.id}_adult_${i}`,
        name: names[i] || (i === 0 ? r.guest_name : `Adulto ${i + 1}`),
        isChild: false,
        rsvpId: r.id,
      })
    }
    if (r.has_children && r.children_count > 0) {
      const childNames = r.children_names ?? []
      for (let i = 0; i < r.children_count; i++) {
        guests.push({
          key: `${r.id}_child_${i}`,
          name: childNames[i] || `Niño ${i + 1}`,
          isChild: true,
          rsvpId: r.id,
        })
      }
    }
  }
  return guests
}
