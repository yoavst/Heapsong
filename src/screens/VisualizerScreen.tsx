import {
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    Tooltip,
    Typography,
} from '@mui/material'
import TopBar from '../components/TopBar'
import Sidebar from '../components/Sidebar'
import { useAtom, useSetAtom } from 'jotai'
import {
    appliedFiltersAtom,
    heapAllocationsAtom,
    pendingFiltersAtom,
    selectedAddressAtom,
    sidebarWidthAtom,
    collapseEmptyRowsAtom,
    highlightRowBaseAtom,
} from '../state/atoms'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatHex } from '../utils/input'
import { useToast } from '../components/ToastContext'
import { parseInput, computeAddressBounds } from '../utils/input'
import { useNavigate } from 'react-router-dom'

export default function VisualizerScreen() {
    const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom)
    const [dragging, setDragging] = useState(false)
    const dividerRef = useRef<HTMLDivElement | null>(null)
    const [heap, setHeap] = useAtom(heapAllocationsAtom)
    const [, setApplied] = useAtom(appliedFiltersAtom)
    const [, setPending] = useAtom(pendingFiltersAtom)
    const navigate = useNavigate()
    const { show } = useToast()

    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!dragging) return
            setSidebarWidth(Math.max(260, Math.min(640, window.innerWidth - e.clientX)))
        }
        function onUp() {
            setDragging(false)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, setSidebarWidth])

    useEffect(() => {
        if (heap) return
        const cached = localStorage.getItem('heapsong:lastHeap')
        if (!cached) {
            navigate('/')
            return
        }
        try {
            const entries = JSON.parse(cached)
            const normalized = parseInput(entries)
            const sorted = normalized.slice().sort((a, b) => a.address - b.address)
            setHeap(sorted)
            const { min, max } = computeAddressBounds(sorted)
            const defaultsRaw = localStorage.getItem('heapsong:defaults')
            let base = min,
                end = max,
                row = 0x1000
            if (defaultsRaw) {
                try {
                    const d = JSON.parse(defaultsRaw)
                    base = Number.isFinite(d.base) ? d.base : base
                    end = Number.isFinite(d.end) ? d.end : end
                    row = Number.isFinite(d.row) ? d.row : row
                } catch {}
            }
            const next = { baseAddress: base, endAddress: end, rowSize: row }
            setApplied(next)
            setPending(next)
            show('Restored last heap', 'info')
        } catch {
            localStorage.removeItem('heapsong:lastHeap')
            navigate('/')
        }
    }, [heap, navigate, setApplied, setHeap, setPending, show])

    return (
        <Box sx={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
            <TopBar />
            <Box
                sx={{
                    flex: 1,
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: `1fr 6px ${sidebarWidth}px`,
                    minHeight: 0,
                }}
            >
                <Visualization />
                <Box
                    ref={dividerRef}
                    onMouseDown={() => {
                        setDragging(true)
                    }}
                    sx={{ cursor: 'col-resize', bgcolor: dragging ? 'primary.main' : 'divider' }}
                />
                <Box sx={{ borderLeft: 1, borderColor: 'divider', minWidth: 240 }}>
                    <Sidebar />
                </Box>
            </Box>
            <GotoDialog />
        </Box>
    )
}

function Visualization() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [applied] = useAtom(appliedFiltersAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const [collapse] = useAtom(collapseEmptyRowsAtom)
    const [highlightRowBase] = useAtom(highlightRowBaseAtom)
    const containerRef = useRef<HTMLDivElement | null>(null)

    const filtered = useMemo(() => {
        if (!heap) return []
        return heap.filter((a) => {
            if (applied.baseAddress != null && a.address + a.actualSize <= applied.baseAddress)
                return false
            if (applied.endAddress != null && a.address >= applied.endAddress) return false
            return true
        })
    }, [heap, applied])

    const rows = useMemo(
        () =>
            buildRows(
                filtered,
                applied.rowSize,
                applied.baseAddress ?? filtered[0]?.address ?? 0,
                collapse
            ),
        [filtered, applied, collapse]
    )

    useEffect(() => {
        if (selected == null || !containerRef.current) return
        const container = containerRef.current

        function centerElement(el: Element) {
            const target = el as HTMLElement
            const containerRect = container.getBoundingClientRect()
            const targetRect = target.getBoundingClientRect()
            const current = container.scrollTop
            const delta =
                targetRect.top -
                containerRect.top -
                container.clientHeight / 2 +
                targetRect.height / 2
            container.scrollTo({ top: current + delta, behavior: 'smooth' })
        }

        function tryScroll(attempt: number) {
            const alloc = container.querySelector(`[data-addr="${selected}"]`)
            if (alloc) {
                centerElement(alloc)
                return
            }
            const base = applied.baseAddress ?? 0
            const rowSize = Math.max(1, Number(applied.rowSize) || 0x1000)
            const rowBase = base + Math.floor((selected - base) / rowSize) * rowSize
            const row = container.querySelector(`[data-row-base="${rowBase}"]`)
            if (row) {
                centerElement(row)
                return
            }
            if (attempt < 5) {
                requestAnimationFrame(() => {
                    tryScroll(attempt + 1)
                })
            }
        }

        tryScroll(0)
    }, [selected, applied])

    if (!heap) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                }}
            >
                No heap loaded
            </Box>
        )
    }

    return (
        <Box
            ref={containerRef}
            sx={{ overflow: 'auto', position: 'relative', bgcolor: 'background.default' }}
        >
            {rows.map((row) => (
                <Box
                    key={`${row.base}-${row.collapsed ? 'c' : 'n'}`}
                    data-row-base={row.base}
                    sx={{ display: 'flex', alignItems: 'stretch', px: 2, py: 1, gap: 1 }}
                >
                    <Box
                        sx={{
                            width: 140,
                            fontFamily: 'ui-monospace',
                            color:
                                highlightRowBase === row.base ? 'warning.main' : 'text.secondary',
                            transition: 'color 200ms',
                        }}
                    >
                        {formatHex(row.base)}
                    </Box>
                    {row.collapsed ? (
                        <Box
                            sx={{
                                flex: 1,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                px: 1,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                {row.label}
                            </Typography>
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                flex: 1,
                                display: 'flex',
                                position: 'relative',
                                height: 28,
                                bgcolor: 'action.hover',
                                borderRadius: 1,
                                overflow: 'hidden',
                            }}
                        >
                            {row.gaps.map((g, idx) => (
                                <Box
                                    key={`gap-${idx}`}
                                    sx={{
                                        position: 'absolute',
                                        left: `${g.leftPct}%`,
                                        width: `${g.widthPct}%`,
                                        top: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{ color: 'text.secondary', opacity: 0.8 }}
                                    >
                                        {g.sizeHex}
                                    </Typography>
                                </Box>
                            ))}
                            {row.allocs.map((a) => (
                                <Tooltip
                                    key={a.address}
                                    title={`${a.type} #${a.groupId} (${formatHex(a.size)}) @ ${formatHex(a.address)}`}
                                    arrow
                                >
                                    <Box
                                        data-addr={a.address}
                                        onClick={() => {
                                            setSelected(a.address)
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            left: `${a.leftPct}%`,
                                            width: `${a.widthPct}%`,
                                            height: '100%',
                                            bgcolor: a.color,
                                            opacity: 0.5,
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: `${a.requestedPct}%`,
                                                bgcolor: a.color,
                                                opacity: selected === a.address ? 0.95 : 0.8,
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                zIndex: 1,
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'black',
                                                fontSize: 12,
                                                textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                                            }}
                                        >
                                            {a.type} #{a.groupId} ({formatHex(a.size)})
                                        </Box>
                                        {selected === a.address && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    border: '2px solid #fff',
                                                    boxSizing: 'border-box',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Tooltip>
                            ))}
                        </Box>
                    )}
                </Box>
            ))}
        </Box>
    )
}

interface RowAllocSegment {
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
interface RowGap {
    leftPct: number
    widthPct: number
    sizeHex: string
}
interface RowEntry {
    base: number
    allocs: RowAllocSegment[]
    gaps: RowGap[]
    collapsed: boolean
    label?: string
}

function buildRows(
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
    const safeRowSize = Math.max(1, Number(rowSize) || 0x1000)
    // compute full range starting from the first allocation row, not necessarily the user base row
    let minIndex = Number.POSITIVE_INFINITY
    let maxIndex = 0
    for (const a of list) {
        const start = Math.floor((a.address - base) / safeRowSize)
        const end = Math.floor((a.address + a.actualSize - base) / safeRowSize)
        if (start < minIndex) minIndex = start
        if (end > maxIndex) maxIndex = end
    }
    if (!Number.isFinite(minIndex)) return []
    const rows: RowEntry[] = []
    for (let i = minIndex; i <= maxIndex; i++) {
        const rowBase = base + i * safeRowSize
        rows[i - minIndex] = {
            base: rowBase,
            allocs: [] as any[],
            gaps: [] as any[],
            collapsed: false,
        }
    }
    // Slice each allocation into segments across rows
    for (const a of list) {
        const allocStart = a.address
        const allocEnd = a.address + a.actualSize
        let requestedRemaining = a.size
        const startRow = Math.floor((allocStart - base) / safeRowSize)
        const endRow = Math.floor((allocEnd - base - 1) / safeRowSize)
        for (let r = startRow; r <= endRow; r++) {
            const idx = r - minIndex
            if (!rows[idx]) continue
            const rowBase = rows[idx].base
            const rowEnd = rowBase + safeRowSize
            const segStart = Math.max(allocStart, rowBase)
            const segEnd = Math.min(allocEnd, rowEnd)
            const segLen = Math.max(0, segEnd - segStart)
            if (segLen <= 0) continue
            const leftPct = ((segStart - rowBase) / safeRowSize) * 100
            const widthPct = (segLen / safeRowSize) * 100
            const requestedInSeg = Math.max(0, Math.min(requestedRemaining, segLen))
            const requestedPct = (requestedInSeg / safeRowSize) * 100
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
                const size = Math.round((widthPct / 100) * safeRowSize)
                row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
            }
            cursor = Math.min(100, a.leftPct + a.widthPct)
        }
        if (cursor < 100) {
            const widthPct = 100 - cursor
            const size = Math.round((widthPct / 100) * safeRowSize)
            row.gaps.push({ leftPct: cursor, widthPct, sizeHex: formatHex(size) })
        }
    }
    // collapse empty rows using current UI settings
    if (!collapse?.enabled) return rows
    const threshold = Math.max(1, Number(collapse.threshold) || 4)

    const out: RowEntry[] = []
    let i = 0
    while (i < rows.length) {
        if (rows[i].allocs.length === 0) {
            let j = i
            while (j < rows.length && rows[j].allocs.length === 0) j++
            const count = j - i
            if (count >= threshold) {
                const totalSize = count * safeRowSize
                out.push({
                    base: rows[i].base,
                    collapsed: true,
                    label: `Collapsed ${count} empty rows (${formatHex(totalSize)})`,
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

function GotoDialog() {
    const [open, setOpen] = useState(false)
    const [input, setInput] = useState('')
    const [applied] = useAtom(appliedFiltersAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const setHighlight = useSetAtom(highlightRowBaseAtom)
    const { show } = useToast()

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'g') setOpen(true)
        }
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
        }
    }, [])

    function apply() {
        const raw = input.trim()
        if (raw === '') return
        let n: number
        if (/^0x/i.test(raw) || /[a-f]/i.test(raw)) {
            const cleaned = raw.replace(/^0x/i, '')
            n = parseInt(cleaned, 16)
        } else {
            n = parseInt(raw, 10)
        }
        if (Number.isNaN(n)) {
            show('Invalid address', 'error')
            return
        }
        if (applied.baseAddress != null && n < applied.baseAddress) {
            show(
                `Address ${formatHex(n)} is below base ${formatHex(applied.baseAddress)}`,
                'warning'
            )
            return
        }
        if (applied.endAddress != null && n > applied.endAddress) {
            show(`Address ${formatHex(n)} is above end ${formatHex(applied.endAddress)}`, 'warning')
            return
        }
        setSelected(n)
        const base = applied.baseAddress ?? 0
        const rowSize = Math.max(1, Number(applied.rowSize) || 0x1000)
        const rowBase = base + Math.floor((n - base) / rowSize) * rowSize
        setHighlight(rowBase)
        setTimeout(() => {
            setHighlight(null)
        }, 1500)
        setOpen(false)
        setInput('')
    }

    return (
        <Dialog
            open={open}
            onClose={() => {
                setOpen(false)
            }}
        >
            <DialogTitle>Go to address</DialogTitle>
            <DialogContent>
                <input
                    style={{ width: 320, padding: 8 }}
                    placeholder="0x1234 or 4660"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && apply()}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setOpen(false)
                    }}
                >
                    Cancel
                </Button>
                <Button variant="contained" onClick={apply}>
                    Go
                </Button>
            </DialogActions>
        </Dialog>
    )
}
