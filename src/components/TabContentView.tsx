import { Box } from '@mui/material'
import { useAtom } from 'jotai'
import { sidebarWidthAtom } from '../state/atoms'
import { useEffect, useRef, useState } from 'react'
import Sidebar from './sidebar/Sidebar'
import Visualization from './visualizer/Visualization'
import GotoDialog from './visualizer/GotoDialog'
import GotoGroupDialog from './sidebar/GotoGroupDialog'
import FiltersBar from './FiltersBar'
import DropFile from './DropFile'
import { NormalizedAllocation, AppliedFilters } from '../types'

interface TabContentViewProps {
    isActive: boolean
    heapAllocations: NormalizedAllocation[] | null
    appliedFilters: AppliedFilters
    setAppliedFilters: (filters: AppliedFilters) => void
    onData: (data: string, fileName?: string) => void
}

export default function TabContentView({
    isActive,
    heapAllocations,
    appliedFilters,
    setAppliedFilters,
    onData,
}: TabContentViewProps) {
    const [sidebarWidth, setSidebarWidth] = useAtom(sidebarWidthAtom)
    const [dragging, setDragging] = useState(false)
    const dividerRef = useRef<HTMLDivElement | null>(null)
    const [availableGroupIds, setAvailableGroupIds] = useState<number[]>([])
    const [onGotoGroup, setOnGotoGroup] = useState<((groupId: number) => void)>(() => {
        return (_groupId: number) => { /* empty */ }
    })
    const [selected, setSelected] = useState<bigint | null>(null)
    const [highlight, setHighlight] = useState<bigint | null>(null)

    useEffect(() => {
        function onMove(e: MouseEvent) {
            if (!dragging) return
            e.preventDefault()
            setSidebarWidth(Math.max(260, Math.min(640, window.innerWidth - e.clientX)))
        }
        function onUp() {
            setDragging(false)
        }
        if (dragging) {
            // Prevent text selection during drag
            document.body.style.userSelect = 'none'
            window.addEventListener('mousemove', onMove)
            window.addEventListener('mouseup', onUp)
        }
        return () => {
            // Restore text selection when done dragging
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragging, setSidebarWidth])

    const height = `calc(100vh - 70px - 64px)`

    // Show import UI if tab has no heap data
    if (!heapAllocations) {
        return (
            <Box
                sx={{
                    display: isActive ? 'flex' : 'none',
                    height,
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <DropFile samplePath="./sample-heap.json" onData={onData} />
            </Box>
        )
    }

    return (
        <Box
            sx={{
                display: isActive ? 'flex' : 'none',
                flexDirection: 'column',
                height,
                width: '100%',
            }}
        >
            <FiltersBar appliedFilters={appliedFilters} setAppliedFilters={setAppliedFilters} />
            <Box
                sx={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: `1fr 6px ${sidebarWidth}px`,
                    minHeight: 0,
                }}
            >
                <Visualization
                    heap={heapAllocations}
                    appliedFilters={appliedFilters}
                    selected={selected}
                    setSelected={setSelected}
                    highlight={highlight}
                    setHighlight={setHighlight}
                />
                <Box
                    ref={dividerRef}
                    onMouseDown={(e) => {
                        e.preventDefault()
                        setDragging(true)
                    }}
                    sx={{ cursor: 'col-resize', bgcolor: dragging ? 'primary.main' : 'divider' }}
                />
                <Box sx={{ borderLeft: 1, borderColor: 'divider', minWidth: 240 }}>
                    <Sidebar
                        heapAllocations={heapAllocations}
                        setSelected={setSelected}
                        setHighlight={setHighlight}
                        getSelected={() => selected}
                        setAvailableGroupIds={setAvailableGroupIds}
                        setOnGotoGroup={setOnGotoGroup}
                    />
                </Box>
            </Box>
            {isActive && (
                <>
                    <GotoDialog
                        appliedFilters={appliedFilters}
                        heapAllocations={heapAllocations}
                        setHighlight={setHighlight}
                    />
                    <GotoGroupDialog
                        onGotoGroup={onGotoGroup}
                        availableGroupIds={availableGroupIds}
                    />
                </>
            )}
        </Box>
    )
}
