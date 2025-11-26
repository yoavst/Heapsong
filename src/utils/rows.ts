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

    const rows: RowEntry[] = []
    const halfEmpty = Math.floor(MAX_UNALLOCATED_ROWS / 2)
    const rowSizeNumber = Number(rowSize)

    // Start with first row covering first allocation's row
    const firstIndex = (allocs[0].address - base) / rowSize
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
                const size = BigInt(Math.round((widthPct / 100) * rowSizeNumber))
                row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
            }
            cursor = Math.min(100, a.leftPct + a.widthPct)
        }
        if (cursor < 100) {
            const widthPct = 100 - cursor
            const size = BigInt(Math.round((widthPct / 100) * rowSizeNumber))
            row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
        }
    }

    const addEmptyRows = (count: number) => {
        if (count <= 0) return
        else if (collapse.enabled && count >= collapse.threshold) {
            // Add all empty rows as a single collapsed region
            rows.push(makeNextRow(lastRow(), BigInt(count) * rowSize, true))
        } else if (count > MAX_UNALLOCATED_ROWS) {
            // pre-empty
            for (let i = 0; i < halfEmpty; i++) rows.push(makeNextRow(lastRow(), rowSize))
            // collapsed region
            const collapsedRows = count - MAX_UNALLOCATED_ROWS
            rows.push(makeNextRow(lastRow(), BigInt(collapsedRows) * rowSize, true))
            // post-empty
            for (let i = 0; i < halfEmpty; i++) rows.push(makeNextRow(lastRow(), rowSize))
        } else {
            // Add all empty rows individually
            for (let i = 0; i < count; i++) rows.push(makeNextRow(lastRow(), rowSize))
        }
    }

    // main allocation loop
    for (const a of allocs) {
        const startIndex = (a.address - base) / rowSize
        const endIndex = (a.address + a.actualSize - base - 1n) / rowSize
        const targetBase = base + startIndex * rowSize

        // compute how many full rows we are away from last existing row
        const lastRowBase = lastRow().base
        const lastRowEnd = lastRowBase + lastRow().size

        if (targetBase >= lastRowEnd) {
            // Target is at or after the end of the last row
            // close the previous row
            flushRow(lastRow())

            if (targetBase > lastRowEnd) {
                // There's a gap - fill it with empty rows
                const gapSize = targetBase - lastRowEnd
                const gapRows = Number(gapSize / rowSize)
                addEmptyRows(gapRows)
            }

            // Ensure we have the target row
            // After addEmptyRows (if called), lastRow should end at targetBase
            // We need to create the row starting at targetBase for this allocation
            const currentEnd = lastRow().base + lastRow().size
            if (currentEnd <= targetBase) {
                // Create the target row (adjacent if currentEnd == targetBase, or after gap)
                rows.push(makeNextRow(lastRow(), rowSize))
            }
        }

        // fill across rows
        if (endIndex - startIndex > 0x100) {
            // TOOO: Let's just ignore it for now, better skip it
            console.log('Error with allocation', a)
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

const makeRow = (base: bigint, size: bigint, collapsed = false): RowEntry => ({
    base,
    size,
    allocs: [],
    gaps: [],
    collapsed,
})

const makeNextRow = (currentRow: RowEntry, size: bigint, collapsed = false): RowEntry =>
    makeRow(currentRow.base + currentRow.size, size, collapsed)
