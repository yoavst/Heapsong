import { Box, Divider, Typography } from '@mui/material'
import { useAtom } from 'jotai'
import { defaultSearchShowAllGroupAtom } from '../../state/atoms'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import JsonTree from '../JsonTree'
import { groupBy } from '../../utils/collections'
import { compare } from '../../utils/bigint'
import { List, useListRef } from 'react-window'
import { SearchTabRow, type ListItem } from './SearchTabRow'
import FilterEditor, { FilterScope } from './FilterEditor'
import { NormalizedAllocation } from '../../types'

interface SearchTabProps {
    heapAllocations: NormalizedAllocation[] | null
    setSelected: (addr: bigint | null) => void
    setHighlight: (addr: bigint | null) => void
    getSelected: () => bigint | null
    setAvailableGroupIds: (ids: number[]) => void
    setOnGotoGroup: (callback: (groupId: number) => void) => void
}

export default function SearchTab({
    heapAllocations: heap,
    setSelected,
    setHighlight,
    getSelected,
    setAvailableGroupIds,
    setOnGotoGroup,
}: SearchTabProps) {
    const [defaultSearchShowAllGroup] = useAtom(defaultSearchShowAllGroupAtom)
    const [showAllFromGroup, setShowAllFromGroup] = useState(defaultSearchShowAllGroup)
    const selected = getSelected()
    const scope = useMemo(() => new FilterScope(heap ?? []), [heap])
    const listRef = useListRef(null)

    const [appliedFilter, setAppliedFilter] = useState<
        (
            a: NormalizedAllocation,
            allocations: NormalizedAllocation[],
            scope: FilterScope
        ) => boolean
    >(() => {
        return () => true
    })

    const { filtered, errorMessage } = useMemo<{
        filtered: NormalizedAllocation[]
        errorMessage: string | null
    }>(() => {
        if (!heap) return { filtered: [], errorMessage: null }

        let directlyFiltered: NormalizedAllocation[]
        try {
            directlyFiltered = heap.filter((a) => appliedFilter(a, heap, scope))
        } catch (error) {
            return {
                filtered: [],
                errorMessage: error instanceof Error ? error.message : String(error),
            }
        }

        if (
            !showAllFromGroup ||
            directlyFiltered.length === 0 ||
            directlyFiltered.length === heap.length
        ) {
            return { filtered: directlyFiltered, errorMessage: null }
        }

        const matchingGroupIds = new Set(directlyFiltered.map((a) => a.groupId))
        return { filtered: heap.filter((a) => matchingGroupIds.has(a.groupId)), errorMessage: null }
    }, [heap, appliedFilter, scope, showAllFromGroup])
    const grouped = useMemo(() => groupBy(filtered, (a) => a.groupId), [filtered])

    const availableGroupIds = useMemo(() => {
        return Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b)
    }, [grouped])

    useEffect(() => {
        setAvailableGroupIds(availableGroupIds)
    }, [availableGroupIds, setAvailableGroupIds])

    const listItems = useMemo(() => {
        const items: ListItem[] = []
        const sortedGroups = Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0]))

        for (const [groupId, list] of sortedGroups) {
            items.push({ type: 'group', groupId: Number(groupId) })
            const sortedList = [...list].sort((a, b) => compare(a.address, b.address))
            for (const allocation of sortedList) {
                items.push({ type: 'item', allocation })
            }
        }

        return items
    }, [grouped])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerHeight, setContainerHeight] = useState(0)

    const handleGotoGroup = useCallback(
        (groupId: number) => {
            // Find the index of the group in listItems
            const groupIndex = listItems.findIndex(
                (item) => item.type === 'group' && item.groupId === groupId
            )

            if (groupIndex === -1) {
                return
            }

            // Scroll to the group
            if (listRef.current) {
                listRef.current.scrollToRow({
                    index: groupIndex,
                    align: 'start',
                    behavior: 'smooth',
                })
            }
        },
        [listItems, listRef]
    )

    useEffect(() => {
        setOnGotoGroup(() => handleGotoGroup)
    }, [handleGotoGroup, setOnGotoGroup])

    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.offsetHeight)
            }
        }

        updateHeight()
        const resizeObserver = new ResizeObserver(updateHeight)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        return () => {
            resizeObserver.disconnect()
        }
    }, [])

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <FilterEditor
                showAllFromGroup={showAllFromGroup}
                setShowAllFromGroup={setShowAllFromGroup}
                allocations={heap}
                defaultValue="return "
                onApply={(f) => {
                    setAppliedFilter(() => f)
                }}
            />
            <Box ref={containerRef} sx={{ flex: 16, minHeight: 0, height: 0 }}>
                {listItems.length > 0 ? (
                    <List
                        listRef={listRef}
                        rowComponent={SearchTabRow}
                        rowCount={listItems.length}
                        rowHeight={32}
                        rowProps={{
                            items: listItems,
                            selected,
                            setSelected,
                            setHighlight,
                        }}
                        style={{
                            height: containerHeight || 400,
                        }}
                    />
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        {errorMessage != null ? (
                            <Typography variant="body2" color="error">
                                Error evaluating filter: {errorMessage}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No results
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
            <Divider />
            <Box sx={{ p: 1.5, flex: selected != null ? 5.5 : 0, minHeight: 50, overflow: 'auto' }}>
                {selected != null ? (
                    <JsonTree data={heap?.find((x) => x.address === selected)} />
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        Select an allocation to view details
                    </Typography>
                )}
            </Box>
        </Box>
    )
}
