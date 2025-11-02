import { formatHex } from './formatting'

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
    for (const a of list) {
        const start = Math.floor((a.address - base) / rowSize)
        const end = Math.floor((a.address + a.actualSize - base) / rowSize)
        if (start < minIndex) minIndex = start
        if (end > maxIndex) maxIndex = end
    }
    if (!Number.isFinite(minIndex)) return []
    const rows: RowEntry[] = []
    for (let i = minIndex; i <= maxIndex; i++) {
        const rowBase = base + i * rowSize
        rows[i - minIndex] = {
            base: rowBase,
            allocs: [],
            gaps: [],
            collapsed: false,
            size: rowSize,
        }
    }
    // Slice each allocation into segments across rows
    for (const a of list) {
        const allocStart = a.address
        const allocEnd = a.address + a.actualSize
        let requestedRemaining = a.size
        const startRow = Math.floor((allocStart - base) / rowSize)
        const endRow = Math.floor((allocEnd - base - 1) / rowSize)
        for (let r = startRow; r <= endRow; r++) {
            const idx = r - minIndex
            if (!rows[idx]) continue
            const rowBase = rows[idx].base
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
            rows[idx].allocs.push({
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
    // compute gaps per row
    for (const row of rows) {
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
    // collapse empty rows using current UI settings
    if (!collapse.enabled) return rows
    const threshold = collapse.threshold

    const out: RowEntry[] = []
    let i = 0
    while (i < rows.length) {
        if (rows[i].allocs.length === 0) {
            let j = i
            while (j < rows.length && rows[j].allocs.length === 0) j++
            const count = j - i
            if (count >= threshold) {
                const totalSize = count * rowSize
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
