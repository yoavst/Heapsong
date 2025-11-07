import { Box, Divider, TextField, Typography, Button } from '@mui/material'

import { useAtom, useSetAtom } from 'jotai'
import { heapAllocationsAtom, highlightAtom, selectedAddressAtom } from '../../state/atoms'
import { useMemo, useState } from 'react'
import JsonTree from '../JsonTree'
import { formatHex } from '../../utils/formatting'
import { groupBy } from '../../utils/collections'
import { NormalizedAllocation } from '../../types'
import { compare } from '../../utils/bigint'

export default function SearchTab() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const setHighlight = useSetAtom(highlightAtom)
    const [pendignSearch, setPendingSearch] = useState<string>('')
    const [appliedSearch, setAppliedSearch] = useState<string>('')

    const filterFn = useMemo(() => createFilter(appliedSearch), [appliedSearch])
    const filtered = useMemo(() => (heap ? heap.filter(filterFn) : []), [heap, filterFn])
    const grouped = useMemo(() => groupBy(filtered, (e) => e.groupId), [filtered])

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
            <Box sx={{ flex: 16, overflow: 'auto', pr: 1 }}>
                {Object.entries(grouped)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([groupId, list]) => (
                        <Box key={groupId} sx={{ mb: 1.5 }}>
                            <Typography
                                variant="subtitle2"
                                sx={{ px: 1, py: 0.5, color: 'text.secondary' }}
                            >
                                Group {groupId}
                            </Typography>
                            {list
                                .sort((a, b) => compare(a.address, b.address))
                                .map((a) => (
                                    <Box
                                        key={a.address.toString()}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            px: 1,
                                            py: 0.5,
                                            borderLeft: `4px solid ${a.color}`,
                                            cursor: 'pointer',
                                            bgcolor:
                                                selected === a.address
                                                    ? 'action.selected'
                                                    : undefined,
                                        }}
                                        onClick={() => {
                                            setSelected(a.address)
                                        }}
                                    >
                                        <Typography variant="body2" noWrap>
                                            {a.type} ({formatHex(a.size)}) → {formatHex(a.address)}
                                        </Typography>
                                    </Box>
                                ))}
                        </Box>
                    ))}
            </Box>
            <Divider />
            <Box sx={{ p: 1.5, flex: selected != null ? 5 : 0, minHeight: 50, overflow: 'auto' }}>
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
        const fn = new Function('e', `return (${expression})`)
        return (e) => {
            try {
                return Boolean(fn(e))
            } catch {
                return false
            }
        }
    } catch {
        return () => true
    }
}
