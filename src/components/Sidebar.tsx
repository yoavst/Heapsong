import {
    Box,
    Divider,
    FormControlLabel,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    Button,
} from '@mui/material'
import { useAtom } from 'jotai'
import {
    collapseEmptyRowsAtom,
    DEFAULT_ROW_SIZE,
    defaultFiltersAtom,
    heapAllocationsAtom,
    selectedAddressAtom,
} from '../state/atoms'
import { useCallback, useMemo, useRef, useState } from 'react'
import JsonTree from './JsonTree'
import { formatHex } from '../utils/formatting'
import HexInput from './HexInput'
import { AppliedFilters } from '../types'

function groupBy<T, K extends string | number>(list: T[], key: (t: T) => K): Record<K, T[]> {
    const map = new Map<K, T[]>()
    for (const item of list) {
        const k = key(item)
        const arr = map.get(k)
        if (arr) arr.push(item)
        else map.set(k, [item])
    }
    const out = {} as Record<K, T[]>
    for (const [k, arr] of map.entries()) {
        out[k] = arr
    }
    return out
}

export default function Sidebar() {
    const [tab, setTab] = useState(0)
    return (
        <Box sx={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                value={tab}
                onChange={(_, v) => {
                    setTab(v)
                }}
                variant="fullWidth"
            >
                <Tab label="Search" />
                <Tab label="Settings" />
            </Tabs>
            <Divider />
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {tab === 0 ? <SearchTab /> : <SettingsTab />}
            </Box>
        </Box>
    )
}

function SearchTab() {
    const [heap] = useAtom(heapAllocationsAtom)
    const [selected, setSelected] = useAtom(selectedAddressAtom)
    const [filterSrc, setFilterSrc] = useState<string>('')
    const [appliedSrc, setAppliedSrc] = useState<string>('')

    const filterFn = useMemo(() => {
        if (!appliedSrc.trim()) return (_e: { raw: unknown }) => true
        try {
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            const fn = new Function('e', `return (${appliedSrc})`)
            return (e: { raw: unknown }) => {
                try {
                    return Boolean((fn as (arg: unknown) => unknown)(e))
                } catch {
                    return false
                }
            }
        } catch {
            return () => true
        }
    }, [appliedSrc])

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
                    value={filterSrc}
                    onChange={(e) => {
                        setFilterSrc(e.target.value)
                    }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                        size="small"
                        variant="contained"
                        onClick={() => {
                            setAppliedSrc(filterSrc)
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
                                .sort((a, b) => a.address - b.address)
                                .map((a) => (
                                    <Box
                                        key={a.address}
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
                                            {a.type} ({formatHex(a.size)}) =&gt;{' '}
                                            {formatHex(a.address)}
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

function SettingsTab() {
    const [collapse, setCollapse] = useAtom(collapseEmptyRowsAtom)
    const [defaultFilters, setDefaultFilters] = useAtom(defaultFiltersAtom)
    const pendingDefaultFilterChanges = useRef<Partial<AppliedFilters>>({})

    const applyDefaultFilterChanges = useCallback(() => {
        setDefaultFilters({ ...defaultFilters, ...pendingDefaultFilterChanges.current })
    }, [defaultFilters, setDefaultFilters])

    return (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
                control={
                    <Switch
                        checked={collapse.enabled}
                        onChange={(_, checked) => {
                            setCollapse({ ...collapse, enabled: checked })
                        }}
                    />
                }
                label="Collapse empty rows"
            />

            <TextField
                label="Collapse threshold (rows)"
                type="number"
                size="small"
                value={collapse.threshold}
                onChange={(e) => {
                    setCollapse({
                        ...collapse,
                        threshold: Math.max(1, parseInt(e.target.value || '1', 10)),
                    })
                }}
                slotProps={{
                    input: { inputProps: { min: 1 } },
                }}
            />
            <Divider />
            <Typography variant="subtitle2">Default Parameters</Typography>
            <HexInput
                label="Base address"
                placeholder="0"
                apply={applyDefaultFilterChanges}
                defaultValue={defaultFilters.baseAddress}
                setValue={(value) => {
                    pendingDefaultFilterChanges.current = {
                        ...pendingDefaultFilterChanges,
                        baseAddress: value,
                    }
                }}
            />
            <HexInput
                label="End address"
                placeholder="FF..FF"
                apply={applyDefaultFilterChanges}
                defaultValue={defaultFilters.endAddress}
                setValue={(value) => {
                    pendingDefaultFilterChanges.current = {
                        ...pendingDefaultFilterChanges,
                        endAddress: value,
                    }
                }}
            />
            <HexInput
                label="Row size"
                placeholder={DEFAULT_ROW_SIZE.toString(16)}
                apply={applyDefaultFilterChanges}
                defaultValue={defaultFilters.rowSize}
                setValue={(value) => {
                    pendingDefaultFilterChanges.current = {
                        ...pendingDefaultFilterChanges,
                        rowSize: value ?? DEFAULT_ROW_SIZE,
                    }
                }}
            />
            <Button variant="outlined" onClick={applyDefaultFilterChanges}>
                Apply
            </Button>
            <Typography variant="caption" color="text.secondary">
                Settings persist to local storage across files.
            </Typography>
        </Box>
    )
}
