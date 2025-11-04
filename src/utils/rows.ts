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
    list: {
        address: number
        actualSize: number
        size: number
        groupId: number
        type: string
        color: string
    }[],
    rowSize: number,
    base: number,
    collapse: { enabled: boolean; threshold: number }
): RowEntry[] {
    if (!Array.isArray(list) || list.length === 0) return []
    // compute full range starting from the first allocation row, not necessarily the user base row
    let minIndex = Number.POSITIVE_INFINITY
    let maxIndex = 0
    const occupied = new Set<number>()
    for (const a of list) {
        // Calculate start and end for the whole data
        const start = Math.floor((a.address - base) / rowSize)
        const end = Math.floor((a.address + a.actualSize - base) / rowSize)
        if (start < minIndex) minIndex = start
        if (end > maxIndex) maxIndex = end

        // Mark occupied rows
        for (let r = start; r <= end; r += rowSize) occupied.add(r)
    }

    if (!Number.isFinite(minIndex)) return []

    // Compute which rows we actually materialize (limit empty gaps)
    const rowIndices: { index: number; collapsedSize?: number }[] = []
    const occupiedSorted = Array.from(occupied).sort((a, b) => a - b)
    const halfEmpty = Math.floor(MAX_UNALLOCATED_ROWS / 2)

    let prev = minIndex - 1
    for (const idx of occupiedSorted) {
        const gap = idx - prev - 1
        if (gap > 0) {
            if (gap > MAX_UNALLOCATED_ROWS) {
                // Add limited visible empty rows
                for (let g = 1; g <= halfEmpty; g++) rowIndices.push({ index: prev + g })
                // Collapsed placeholder for skipped rows
                rowIndices.push({
                    index: prev + halfEmpty + 1,
                    collapsedSize: (gap - MAX_UNALLOCATED_ROWS) * rowSize,
                })
                // Add limited visible empty rows after collapsed section
                for (let g = gap - halfEmpty + 1; g <= gap; g++)
                    rowIndices.push({ index: prev + g })
            } else {
                for (let g = 1; g <= gap; g++) rowIndices.push({ index: prev + g })
            }
        }
        rowIndices.push({ index: idx })
        prev = idx
    }

    // Handle trailing gap
    const trailingGap = maxIndex - prev
    if (trailingGap > 0) {
        if (trailingGap > MAX_UNALLOCATED_ROWS) {
            for (let g = 1; g <= halfEmpty; g++) rowIndices.push({ index: prev + g })
            rowIndices.push({
                index: prev + halfEmpty + 1,
                collapsedSize: (trailingGap - MAX_UNALLOCATED_ROWS) * rowSize,
            })
            for (let g = trailingGap - halfEmpty + 1; g <= trailingGap; g++)
                rowIndices.push({ index: prev + g })
        } else {
            for (let g = 1; g <= trailingGap; g++) rowIndices.push({ index: prev + g })
        }
    }

    // Build initial row objects
    const rows: RowEntry[] = rowIndices.map(({ index, collapsedSize }) => {
        const rowBase = base + index * rowSize
        if (collapsedSize) {
            return {
                base: rowBase,
                allocs: [],
                gaps: [],
                collapsed: true,
                size: collapsedSize,
            }
        }
        return {
            base: rowBase,
            allocs: [],
            gaps: [],
            collapsed: false,
            size: rowSize,
        }
    })

    // Fast index mapping
    const indexToRow = new Map(rowIndices.map((r, i) => [r.index, i]))

    // Populate allocations
    for (const a of list) {
        const allocStart = a.address
        const allocEnd = a.address + a.actualSize
        let requestedRemaining = a.size
        const startRow = Math.floor((allocStart - base) / rowSize)
        const endRow = Math.floor((allocEnd - base - 1) / rowSize)
        for (let r = startRow; r <= endRow; r++) {
            const idx = indexToRow.get(r)
            if (idx === undefined) continue
            const row = rows[idx]
            const rowBase = row.base
            const rowEnd = rowBase + rowSize
            const segStart = Math.max(allocStart, rowBase)
            const segEnd = Math.min(allocEnd, rowEnd)
            const segLen = Math.max(0, segEnd - segStart)
            if (segLen <= 0) continue
            const leftPct = ((segStart - rowBase) / rowSize) * 100
            const widthPct = (segLen / rowSize) * 100
            const requestedInSeg = Math.max(0, Math.min(requestedRemaining, segLen))
            const requestedPct = (requestedInSeg / rowSize) * 100
            requestedRemaining = Math.max(0, requestedRemaining - requestedInSeg)
            row.allocs.push({
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

    // Compute gaps for normal rows
    for (const row of rows) {
        if (row.collapsed) continue
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

    // Apply the *UI collapse logic* (collapse.enabled / threshold)
    if (!collapse.enabled) return rows

    const out: RowEntry[] = []
    const threshold = collapse.threshold
    let i = 0
    while (i < rows.length) {
        // treat both empty rows and pre-collapsed placeholders as collapsible
        if (rows[i].allocs.length === 0) {
            let j = i
            let totalSize = 0
            while (j < rows.length && rows[j].allocs.length === 0) {
                totalSize += rows[j].size
                j++
            }

            const count = j - i
            // collapse only if long enough OR contains any pre-collapsed regions
            const containsPrecollapsed = rows.slice(i, j).some((r) => r.collapsed)
            if (count >= threshold || containsPrecollapsed) {
                out.push({
                    base: rows[i].base,
                    size: totalSize,
                    collapsed: true,
                    allocs: [],
                    gaps: [],
                })
                i = j
                continue
            }
        }
        out.push(rows[i])
        i++
    }
    return out
}
