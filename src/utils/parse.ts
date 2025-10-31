import type { Allocation, NormalizedAllocation } from '../types'

function parseHexOrNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return parseInt(trimmed, 16)
        if (/^[0-9]+$/.test(trimmed)) return parseInt(trimmed, 10)
    }
    throw new Error(`Invalid numeric value: ${String(value)}`)
}

function normalizeColor(color?: unknown, fallbackIndex = 0): string {
    if (typeof color === 'string' && /^#([0-9a-fA-F]{6})$/.test(color)) return color
    // simple deterministic palette
    const palette = ['#64b5f6', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4db6ac', '#ffd54f']
    return palette[fallbackIndex % palette.length]
}

export function normalizeAllocations(entries: Allocation[]): NormalizedAllocation[] {
    if (!Array.isArray(entries)) throw new Error('Heap JSON must be an array of entries')
    return entries.map((raw, idx) => {
        if (!raw || typeof raw !== 'object') throw new Error(`Entry ${idx} is not an object`)
        const required = ['type', 'address', 'size', 'actual_size', 'group_id'] as const
        for (const k of required) {
            if (!(k in raw)) throw new Error(`Entry ${idx} missing required field: ${k}`)
        }
        const address = parseHexOrNumber(raw.address)
        const size = parseHexOrNumber(raw.size)
        const actualSize = parseHexOrNumber(raw.actual_size)
        const groupId = parseHexOrNumber(raw.group_id)
        if (size <= 0 || actualSize < size) {
            throw new Error(`Entry ${idx} has invalid size/actual_size`)
        }
        return {
            type: raw.type,
            address,
            size,
            actualSize,
            groupId,
            color: normalizeColor(raw.color, idx),
            raw: raw,
        }
    })
}

export function computeAddressBounds(list: NormalizedAllocation[]): { min: number; max: number } {
    let min = Number.POSITIVE_INFINITY
    let max = 0
    for (const a of list) {
        if (a.address < min) min = a.address
        const end = a.address + a.actualSize
        if (end > max) max = end
    }
    if (!Number.isFinite(min)) min = 0
    return { min, max }
}

export function formatHex(n: number): string {
    return '0x' + n.toString(16).toUpperCase()
}
