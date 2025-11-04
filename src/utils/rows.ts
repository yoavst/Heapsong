import { NormalizedAllocation } from '../types'
import { formatHex } from './formatting'

const MAX_UNALLOCATED_ROWS = 20

export interface RowAllocSegment {
    address: number
    leftPct: number
    widthPct: number
    requestedPct: number
    size: number
    type: string
    groupId: number
    color: string
    actualSize: number
}
export interface RowGap {
    leftPct: number
    widthPct: number
    sizeHex: string
}
export interface RowEntry {
    base: number
    allocs: RowAllocSegment[]
    gaps: RowGap[]
    collapsed: boolean
    size: number
}

export function buildRows(
    list: NormalizedAllocation[],
    rowSize: number,
    base: number,
    collapse: { enabled: boolean; threshold: number }
): RowEntry[] {
    if (list.length === 0) return []

    const allocs = [...list].sort((a, b) => a.address - b.address)
    const rows: RowEntry[] = []
    const halfEmpty = Math.floor(MAX_UNALLOCATED_ROWS / 2)

    // Start with first row covering first allocation’s row
    const firstIndex = Math.floor((allocs[0].address - base) / rowSize)
    rows.push(makeRow(base + firstIndex * rowSize, rowSize))
    const lastRow = () => rows[rows.length - 1]

    // Compute internal gaps for the current row
    const flushRow = (row: RowEntry) => {
        if (row.collapsed) return
        const sorted = row.allocs.sort((x, y) => x.leftPct - y.leftPct)
        let cursor = 0
        for (const a of sorted) {
            if (a.leftPct > cursor) {
                const widthPct = a.leftPct - cursor
                const size = Math.round((widthPct / 100) * rowSize)
                row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
            }
            cursor = Math.min(100, a.leftPct + a.widthPct)
        }
        if (cursor < 100) {
            const widthPct = 100 - cursor
            const size = Math.round((widthPct / 100) * rowSize)
            row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
        }
    }

    const addEmptyRows = (count: number) => {
        if (count <= 0) return
        else if (collapse.enabled && count >= collapse.threshold) {
            // Add all empty rows as a single collapsed region
            rows.push(makeNextRow(lastRow(), count * rowSize, true))
        } else if (count > MAX_UNALLOCATED_ROWS) {
            // pre-empty
            for (let i = 0; i < halfEmpty; i++) rows.push(makeNextRow(lastRow(), rowSize))
            // collapsed region
            const collapsedRows = count - MAX_UNALLOCATED_ROWS
            rows.push(makeNextRow(lastRow(), collapsedRows * rowSize, true))
            // post-empty
            for (let i = 0; i < halfEmpty; i++) rows.push(makeNextRow(lastRow(), rowSize))
        } else {
            // Add all empty rows individually
            for (let i = 0; i < count; i++) rows.push(makeNextRow(lastRow(), rowSize))
        }
    }

    // main allocation loop
    for (const a of allocs) {
        const startIndex = Math.floor((a.address - base) / rowSize)
        const endIndex = Math.floor((a.address + a.actualSize - base - 1) / rowSize)
        const targetBase = base + startIndex * rowSize

        // compute how many full rows we are away from last existing row
        const gapRows = Math.floor((targetBase - lastRow().base) / rowSize) - 1
        if (gapRows >= 0) {
            // close the previous row
            flushRow(lastRow())
            // fill the gap
            addEmptyRows(gapRows)
            // ensure we have the target row
            if (lastRow().base + lastRow().size !== targetBase)
                rows.push(makeNextRow(lastRow(), rowSize))
        }

        // fill across rows
        let allocRemaining = a.size
        for (let r = startIndex; r <= endIndex; r++) {
            const segBase = base + r * rowSize
            const segEnd = segBase + rowSize
            const segStart = Math.max(a.address, segBase)
            const segStop = Math.min(a.address + a.actualSize, segEnd)
            const segLen = segStop - segStart

            const leftPct = ((segStart - segBase) / rowSize) * 100
            const widthPct = (segLen / rowSize) * 100
            const requestedInSeg = Math.min(allocRemaining, segLen)
            const requestedPct = (requestedInSeg / rowSize) * 100
            allocRemaining -= requestedInSeg

            // ensure we have a row for segBase
            if (lastRow().base !== segBase) rows.push(makeNextRow(lastRow(), rowSize))

            lastRow().allocs.push({
                address: a.address,
                leftPct,
                widthPct,
                requestedPct,
                groupId: a.groupId,
                size: a.size,
                type: a.type,
                color: a.color,
                actualSize: a.actualSize,
            })
        }
    }

    // flush last
    flushRow(lastRow())
    return rows
}

const makeRow = (base: number, size: number, collapsed = false): RowEntry => ({
    base,
    size,
    allocs: [],
    gaps: [],
    collapsed,
})

const makeNextRow = (currentRow: RowEntry, size: number, collapsed = false): RowEntry =>
    makeRow(currentRow.base + currentRow.size, size, collapsed)
