import { Box, Divider, TextField, Typography, Button } from '@mui/material'

import { useAtom, useSetAtom } from 'jotai'
import { heapAllocationsAtom, highlightAtom, selectedAddressAtom } from '../../state/atoms'
import { useMemo, useState, useRef, useEffect } from 'react'
import JsonTree from '../JsonTree'
import { groupBy } from '../../utils/collections'
import { NormalizedAllocation } from '../../types'
import { compare } from '../../utils/bigint'
import { List } from 'react-window'
import { SearchTabRow, type ListItem } from './SearchTabRow'

export default function SearchTab() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const setHighlight = useSetAtom(highlightAtom)
    const [pendignSearch, setPendingSearch] = useState<string>('')
    const [appliedSearch, setAppliedSearch] = useState<string>('')

    const filterFn = useMemo(() => createFilter(appliedSearch), [appliedSearch])
    const filtered = useMemo(() => (heap ? heap.filter(filterFn) : []), [heap, filterFn])
    const grouped = useMemo(() => groupBy(filtered, (e) => e.groupId), [filtered])

    const listItems = useMemo(() => {
        const items: ListItem[] = []
        const sortedGroups = Object.entries(grouped).sort((a, b) => Number(a[0]) - Number(b[0]))

        for (const [groupId, list] of sortedGroups) {
            items.push({ type: 'group', groupId })
            const sortedList = [...list].sort((a, b) => compare(a.address, b.address))
            for (const allocation of sortedList) {
                items.push({ type: 'item', allocation })
            }
        }

        return items
    }, [grouped])

    const containerRef = useRef<HTMLDivElement | null>(null)
    const [containerHeight, setContainerHeight] = useState(0)

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
            <Box>
                <Typography variant="caption" color="text.secondary">
                    (e) =&gt;
                </Typography>
                <TextField
                    fullWidth
                    placeholder="e.type === 'FOO'"
                    minRows={3}
                    maxRows={8}
                    multiline
                    value={pendignSearch}
                    onChange={(e) => {
                        setPendingSearch(e.target.value)
                    }}
                    onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault()
                            setAppliedSearch(pendignSearch)
                        }
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                            setAppliedSearch(pendignSearch)
                        }}
                    >
                        Apply
                    </Button>
                </Box>
            </Box>
            <Box ref={containerRef} sx={{ flex: 16, minHeight: 0, height: 0 }}>
                {listItems.length > 0 ? (
                    <List
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
        </Box>
    )
}

const createFilter = (expression: string): ((e: NormalizedAllocation) => boolean) => {
    if (!expression.trim()) {
        return (_e) => true
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const fn: (e: NormalizedAllocation) => unknown = new Function(
            'e',
            `return (${expression})`
        ) as (e: NormalizedAllocation) => unknown
        return (e) => {
            try {
                return !!fn(e)
            } catch {
                return false
            }
        }
    } catch {
        return () => true
    }
}
