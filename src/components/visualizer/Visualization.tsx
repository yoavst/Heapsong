import { Box } from '@mui/material'
import { useAtom } from 'jotai'
import {
    appliedFiltersAtom,
    heapAllocationsAtom,
    selectedAddressAtom,
    collapseEmptyRowsAtom,
    highlightAtom,
} from '../../state/atoms'
import { useEffect, useMemo, useRef } from 'react'
import { formatHex } from '../../utils/formatting'
import { buildRows, RowEntry } from '../../utils/rows'
import { CollapsedRow, HeapRow } from './HeapRow'

export default function Visualization() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [appliedFilters] = useAtom(appliedFiltersAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const [collapse] = useAtom(collapseEmptyRowsAtom)
    const [highlight, setHighlight] = useAtom(highlightAtom)
    const containerRef = useRef<HTMLDivElement | null>(null)

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
        if (highlight == null || !containerRef.current) return
        const container = containerRef.current

        function tryScroll(attempt: number) {
            if (highlight === null) {
                return
            }

            const row = findRowContaining(rows, highlight)
            if (row == null) {
                setHighlight(null)
                return
            }

            const rowElement = container.querySelector(`[data-row-base="${row.base.toString()}"]`)
            if (rowElement) {
                centerElement(container, rowElement)
                return
            }
            if (attempt < 5) {
                requestAnimationFrame(() => {
                    tryScroll(attempt + 1)
                })
            }
        }

        tryScroll(0)
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
    let width = 80
    if (addressFontLength > 12) {
        width = 120
    } else if (addressFontLength > 8) {
        width = 100
    }

    return (
        <Box
            ref={containerRef}
            sx={{ overflow: 'auto', position: 'relative', bgcolor: 'background.default' }}
        >
            {rows.map((row) => (
                <Box
                    key={`${row.base}`}
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
                    <Box
                        sx={{
                            width,
                            fontSize: 14,
                            fontFamily: 'Courier New',
                            textAlign: 'center',
                            color:
                                highlight != null &&
                                row.base <= highlight &&
                                row.base + row.size > highlight
                                    ? 'warning.main'
                                    : 'text.secondary',
                            transition: 'color 200ms',
                        }}
                    >
                        {formatHex(row.base)}
                    </Box>
                    {row.collapsed ? (
                        <CollapsedRow row={row} />
                    ) : (
                        <HeapRow
                            row={row}
                            selected={selected}
                            setSelected={setSelected}
                            setHighlight={setHighlight}
                        />
                    )}
                </Box>
            ))}
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

function centerElement(container: Element, el: Element) {
    const target = el as HTMLElement
    const containerRect = container.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    const current = container.scrollTop
    const delta =
        targetRect.top - containerRect.top - container.clientHeight / 2 + targetRect.height / 2
    container.scrollTo({ top: current + delta, behavior: 'smooth' })
}
