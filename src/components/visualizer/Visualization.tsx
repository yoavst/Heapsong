import { Box } from '@mui/material'
import { useAtom } from 'jotai'
import {
    appliedFiltersAtom,
    heapAllocationsAtom,
    selectedAddressAtom,
    collapseEmptyRowsAtom,
    highlightAtom,
} from '../../state/atoms'
import { useEffect, useMemo, useRef, useState } from 'react'
import { buildRows, RowEntry } from '../../utils/rows'
import { RowWithAddress, HeapRowHeight } from './HeapRow'
import { List, RowComponentProps, useListRef } from 'react-window'

interface RowProps {
    rows: RowEntry[]
    selected: bigint | null
    setSelected: (addr: bigint) => void
    containerWidth: number
    highlight: bigint | null
    addrWidth: number
}

function Row({
    index,
    style,
    rows,
    selected,
    setSelected,
    containerWidth,
    highlight,
    addrWidth,
}: RowComponentProps<RowProps>) {
    const row = rows[index]
    const selectedInRow = selected != null && row.base <= selected && selected < row.base + row.size
    const highlightInRow =
        highlight != null && row.base <= highlight && highlight < row.base + row.size

    return (
        <Box
            style={style}
            data-row-base={row.base.toString()}
            sx={{
                display: 'flex',
                alignItems: 'stretch',
                paddingLeft: 1,
                paddingRight: 2,
                py: 1,
                gap: 1,
            }}
        >
            <RowWithAddress
                row={row}
                selected={selectedInRow ? selected : null}
                setSelected={setSelected}
                width={containerWidth}
                highlight={highlightInRow ? highlight : null}
                addrWidth={addrWidth}
            />
        </Box>
    )
}

export default function Visualization() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [appliedFilters] = useAtom(appliedFiltersAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const [collapse] = useAtom(collapseEmptyRowsAtom)
    const [highlight, setHighlight] = useAtom(highlightAtom)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const listRef = useListRef(null)
    const [containerWidth, setContainerWidth] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
                setContainerHeight(containerRef.current.offsetHeight)
            }
        }

        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    const filtered = useMemo(() => {
        if (!heap) return []
        return heap.filter((a) => {
            if (
                appliedFilters.baseAddress != null &&
                a.address + a.actualSize <= appliedFilters.baseAddress
            )
                return false
            if (appliedFilters.endAddress != null && a.address >= appliedFilters.endAddress)
                return false
            return true
        })
    }, [heap, appliedFilters])

    const rows = useMemo(() => {
        if (filtered.length === 0) return []
        return buildRows(
            filtered,
            appliedFilters.rowSize,
            appliedFilters.baseAddress ?? filtered[0].address,
            collapse
        )
    }, [filtered, appliedFilters, collapse])

    useEffect(() => {
        if (highlight == null || !listRef.current) return

        const row = findRowContaining(rows, highlight)
        if (row == null) {
            setHighlight(null)
            return
        }

        const rowIndex = rows.findIndex((r) => r.base === row.base)
        if (rowIndex !== -1) {
            listRef.current.scrollToRow({ index: rowIndex, align: 'center', behavior: 'smooth' })
        }
    }, [highlight, rows, setHighlight])

    useEffect(() => {
        if (highlight == null) return

        const timer = setTimeout(() => {
            setHighlight(null)
        }, 2000)

        return () => {
            clearTimeout(timer)
        }
    }, [highlight, setHighlight])

    if (rows.length === 0) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                }}
            >
                All allocations were filtered
            </Box>
        )
    }

    const addressFontLength = rows[rows.length - 1].base.toString(16).length
    let addrWidth = 80
    if (addressFontLength > 12) {
        addrWidth = 120
    } else if (addressFontLength > 8) {
        addrWidth = 100
    }

    // Row height = HeapRowHeight (28) + padding top (8) + padding bottom (8) = 44
    const rowHeight = HeapRowHeight + 16

    return (
        <Box
            ref={containerRef}
            sx={{ height: '100%', width: '100%', bgcolor: 'background.default' }}
        >
            <List
                listRef={listRef}
                rowComponent={Row}
                rowCount={rows.length}
                rowHeight={rowHeight}
                overscanCount={10}
                rowProps={{
                    rows,
                    selected,
                    setSelected,
                    containerWidth,
                    highlight,
                    addrWidth,
                }}
                style={{
                    height: containerHeight || 600,
                }}
            />
        </Box>
    )
}

function findRowContaining(rows: RowEntry[], n: bigint): RowEntry | null {
    let low = 0
    let high = rows.length - 1

    while (low <= high) {
        const mid = Math.floor(low + (high - low) / 2)
        const row = rows[mid]

        if (n < row.base) {
            high = mid - 1
        } else if (n >= row.base + row.size) {
            low = mid + 1
        } else {
            // n is in [row.base, row.base + row.size)
            return row
        }
    }

    return null // not found
}
