import type { NormalizedAllocation } from '../types'

const DEFAULT_COLOR = '#4db6ac'

type HexOrNumber = number | string

interface InputAllocation {
    type: string
    address: HexOrNumber
    size: HexOrNumber
    actualSize: HexOrNumber
    groupId: HexOrNumber
    name?: string
    color?: string
    // allow any extra fields
    [key: string]: unknown
}
const InputAllocationRequiredKeys = [
    'type',
    'address',
    'size',
    'actualSize',
    'groupId',
] as const satisfies (keyof InputAllocation)[]

function assertInputAllocation(raw: unknown): asserts raw is InputAllocation {
    if (!raw || typeof raw !== 'object')
        throw new Error(`Entry is not an object: ${JSON.stringify(raw)}`)
    for (const k of InputAllocationRequiredKeys) {
        if (!(k in raw))
            throw new Error(`Entry missing required field '${k}': ${JSON.stringify(raw)}`)
    }

    // Missing some other checks but good enough
}

function parseHexOrNumber(value: unknown): number {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (/^0x[0-9a-fA-F]+$/.test(trimmed)) return parseInt(trimmed, 16)
        if (/^[0-9]+$/.test(trimmed)) return parseInt(trimmed, 10)
    }
    throw new Error(`Invalid numeric value: ${String(value)}`)
}

export default function parseInput(input: unknown): NormalizedAllocation[] {
    if (!Array.isArray(input)) throw new Error('Heap JSON must be an array of entries')
    return input.map((raw, idx) => {
        assertInputAllocation(raw)

        const address = parseHexOrNumber(raw.address)
        const size = parseHexOrNumber(raw.size)
        const actualSize = parseHexOrNumber(raw.actualSize)
        const groupId = parseHexOrNumber(raw.groupId)

        if (size <= 0 || actualSize < size) {
            throw new Error(`Entry ${idx} has invalid size/actualSize: ${JSON.stringify(raw)}`)
        }

        return {
            ...raw,
            type: raw.type,
            address,
            size,
            actualSize,
            groupId,
            color: raw.color ?? DEFAULT_COLOR,
        }
    })
}
