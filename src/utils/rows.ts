import { NormalizedAllocation } from '../types'
import { formatHex } from './formatting'
import { max, min } from './bigint'

const MAX_UNALLOCATED_ROWS = 20

export interface RowAllocSegment {
    address: bigint
    leftPct: number
    widthPct: number
    requestedPct: number
    size: bigint
    type: string
    groupId: number
    color: string
    actualSize: bigint
}
export interface RowGap {
    leftPct: number
    widthPct: number
    sizeHex: string
}
export interface RowEntry {
    base: bigint
    allocs: RowAllocSegment[]
    gaps: RowGap[]
    collapsed: boolean
    size: bigint
}

export function buildRows(
    allocs: NormalizedAllocation[],
    rowSize: bigint,
    base: bigint,
    collapse: { enabled: boolean; threshold: number }
): RowEntry[] {
    if (allocs.length === 0) return []

    const rows = new Map<bigint, RowEntry>()
    const halfEmpty = Math.floor(MAX_UNALLOCATED_ROWS / 2)
    const rowSizeNumber = Number(rowSize)

    // Start with first row covering first allocation's row
    const firstIndex = (allocs[0].address - base) / rowSize
    const firstRow = makeRow(base + firstIndex * rowSize, rowSize)
    rows.set(firstRow.base, firstRow)

    // main allocation loop
    for (const a of allocs) {
        const startIndex = (a.address - base) / rowSize
        const endIndex = (a.address + a.actualSize - base - 1n) / rowSize

        if (endIndex - startIndex > 0x100) {
            // TOOO: Let's just ignore it for now, better skip it
            console.log('Error with allocation: too big', a)
            continue
        }

        let allocRemaining = a.size
        for (let r = startIndex; r <= endIndex; r++) {
            const segBase = base + r * rowSize
            const segEnd = segBase + rowSize
            const segStart = max(a.address, segBase)
            const segStop = min(a.address + a.actualSize, segEnd)
            const segLen = segStop - segStart
            const segLenNumber = Number(segLen) // less than row size because of the min/max

            const leftPct = (Number(segStart - segBase) / rowSizeNumber) * 100
            const widthPct = (segLenNumber / rowSizeNumber) * 100
            const requestedInSeg = min(allocRemaining, segLen)
            const requestedPct =
                segLenNumber > 0 ? (Number(requestedInSeg) / segLenNumber) * 100 : 0
            allocRemaining -= requestedInSeg

            // Find or create row for segBase
            let targetRow = rows.get(segBase)
            if (!targetRow) {
                targetRow = makeRow(segBase, rowSize)
                rows.set(segBase, targetRow)
            }

            targetRow.allocs.push({
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

    // Sort rows by base (may be out of order)
    const sortedRows = [...rows.values()]
    sortedRows.sort((a, b) => (a.base < b.base ? -1 : a.base > b.base ? 1 : 0))
    // Compute gaps between rows
    const finalRows: RowEntry[] = [sortedRows[0]]
    const lastRow = () => finalRows[finalRows.length - 1]
    const pushNextRow = (size: bigint = rowSize, collapsed = false) =>
        finalRows.push(makeRow(lastRow().base + rowSize, size, collapsed))
    const MAX_UNALLOCATED_ROWS_ = BigInt(MAX_UNALLOCATED_ROWS)
    for (let i = 1; i < sortedRows.length; i++) {
        const row = sortedRows[i]
        const count = (row.base - (lastRow().base + rowSize)) / rowSize
        if (count > 0) {
            if (collapse.enabled && count >= collapse.threshold) {
                // Add all empty rows as a single collapsed region
                pushNextRow(count * rowSize, true)
            } else if (count > MAX_UNALLOCATED_ROWS_) {
                // pre-empty
                for (let i = 0; i < halfEmpty; i++) pushNextRow()
                // collapsed region
                const collapsedRows = count - MAX_UNALLOCATED_ROWS_
                pushNextRow(collapsedRows * rowSize, true)
                // post-empty
                for (let i = 0; i < halfEmpty; i++) pushNextRow()
            } else {
                // Add all empty rows individually
                for (let i = 0; i < count; i++) pushNextRow()
            }
        }
        finalRows.push(row)
    }
    flushRows(finalRows)

    return finalRows
}

const flushRows = (rows: RowEntry[]) => {
    let prevAlloc: RowAllocSegment | null = null
    let lastRow: RowEntry | null = null
    const pendingGaps: RowGap[] = []

    for (const row of rows) {
        if (row.collapsed) continue
        lastRow = row

        row.allocs.sort((x, y) => x.leftPct - y.leftPct)
        let cursor = 0

        for (const a of row.allocs) {
            // Gap size from previous allocation to this one
            const gapSize = prevAlloc
                ? a.address - (prevAlloc.address + prevAlloc.actualSize)
                : a.address - row.base
            const sizeHex = formatHex(gapSize)

            // Resolve all pending gaps (trailing gaps from previous rows + empty rows)
            for (const gap of pendingGaps) gap.sizeHex = sizeHex
            pendingGaps.length = 0

            // Add leading gap if there's space before this allocation
            if (a.leftPct > cursor) {
                const widthPct = a.leftPct - cursor
                row.gaps.push({ leftPct: cursor, widthPct, sizeHex })
            }

            cursor = Math.min(100, a.leftPct + a.widthPct)
            prevAlloc = a
        }

        // Handle trailing gap - size will be resolved when we find the next allocation
        if (cursor < 100) {
            const widthPct = 100 - cursor
            const gap: RowGap = { leftPct: cursor, widthPct, sizeHex: '' }
            row.gaps.push(gap)
            pendingGaps.push(gap)
        }
    }

    // Resolve remaining pending gaps (no next allocation exists)
    if (pendingGaps.length > 0 && lastRow) {
        const gapSize = prevAlloc
            ? lastRow.base + lastRow.size - (prevAlloc.address + prevAlloc.actualSize)
            : lastRow.size
        const sizeHex = formatHex(gapSize)
        for (const gap of pendingGaps) gap.sizeHex = sizeHex
    }
}

const makeRow = (base: bigint, size: bigint, collapsed = false): RowEntry => ({
    base,
    size,
    allocs: [],
    gaps: [],
    collapsed,
})
