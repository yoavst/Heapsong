import { Box, Divider, Typography } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import { heapAllocationsAtom, highlightAtom, selectedAddressAtom } from '../../state/atoms'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import JsonTree from '../JsonTree'
import { groupBy } from '../../utils/collections'
import { compare } from '../../utils/bigint'
import { List, useListRef } from 'react-window'
import { SearchTabRow, type ListItem } from './SearchTabRow'
import GotoGroupDialog from './GotoGroupDialog'
import FilterEditor from './FilterEditor'
import { NormalizedAllocation } from '../../types'

export default function SearchTab() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const setHighlight = useSetAtom(highlightAtom)
    const [appliedFilter, setAppliedFilter] = useState<(e: NormalizedAllocation) => boolean>(() => {
        return () => true
    })
    const listRef = useListRef(null)
    const filtered = useMemo(() => (heap ? heap.filter(appliedFilter) : []), [heap, appliedFilter])
    const grouped = useMemo(() => groupBy(filtered, (e) => e.groupId), [filtered])

    const availableGroupIds = useMemo(() => {
        return Object.keys(grouped)
            .map(Number)
            .sort((a, b) => a - b)
    }, [grouped])

    const fieldNames = useMemo(() => {
        const fields: Set<string> = new Set<string>()
        for (const allocation of heap ?? []) {
            for (const key of Object.keys(allocation)) {
                fields.add(key)
            }
        }
        return Array.from(fields)
    }, [heap])

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
                fieldNames={fieldNames}
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
                    <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body2">No results</Typography>
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
            <GotoGroupDialog onGotoGroup={handleGotoGroup} availableGroupIds={availableGroupIds} />
        </Box>
    )
}
