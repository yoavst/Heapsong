import {
    Box,
    Divider,
    FormControlLabel,
    Switch,
    Tab,
    Tabs,
    TextField,
    Typography,
    Stack,
    Button,
    InputAdornment,
} from '@mui/material'
import { useAtom } from 'jotai'
import { collapseEmptyRowsAtom, heapAllocationsAtom, selectedAddressAtom } from '../state/atoms'
import { useEffect, useMemo, useState } from 'react'
import JsonTree from './JsonTree'
import { formatHex } from '../utils/parse'

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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    return Boolean((fn as (arg: unknown) => unknown)(e.raw))
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
                    inputProps={{ list: 'heap-fields' }}
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
                <datalist id="heap-fields">
                    <option value="e.type" />
                    <option value="e.address" />
                    <option value="e.size" />
                    <option value="e.actual_size" />
                    <option value="e.color" />
                    <option value="e.group_id" />
                </datalist>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
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
            <Box sx={{ p: 1.5, minHeight: 120, maxHeight: 240, overflow: 'auto' }}>
                {selected != null ? (
                    <JsonTree data={heap?.find((x) => x.address === selected)?.raw} />
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
    const [defaults, setDefaults] = useState<{ base: number | ''; end: number | ''; row: number }>({
        base: '',
        end: '',
        row: 0x1000,
    })
    const [rowText, setRowText] = useState<string>('1000')
    const [hydrated, setHydrated] = useState(false)
    // load once
    useEffect(() => {
        const savedCollapse = localStorage.getItem('heapsong:collapse')
        const savedDefaults = localStorage.getItem('heapsong:defaults')
        if (savedCollapse) {
            try {
                const parsed = JSON.parse(savedCollapse)
                if (parsed && typeof parsed === 'object') {
                    setCollapse({
                        enabled: Boolean(parsed.enabled),
                        threshold: Math.max(1, Number(parsed.threshold) || 4),
                    })
                }
            } catch {}
        }

        if (savedDefaults) {
            try {
                const d = JSON.parse(savedDefaults)
                setDefaults({
                    base: Number.isFinite(d.base) ? d.base : '',
                    end: Number.isFinite(d.end) ? d.end : '',
                    row: Number.isFinite(d.row) ? d.row : 0x1000,
                })
                const initialRow = Number.isFinite(d.row) ? Number(d.row) : 0x1000
                setRowText(initialRow.toString(16).toUpperCase())
            } catch {}
        }
        setHydrated(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // persist on change
    useEffect(() => {
        localStorage.setItem('heapsong:collapse', JSON.stringify(collapse))
    }, [collapse])

    useEffect(() => {
        if (!hydrated) return
        localStorage.setItem(
            'heapsong:defaults',
            JSON.stringify({
                base: defaults.base === '' ? null : defaults.base,
                end: defaults.end === '' ? null : defaults.end,
                row: defaults.row,
            })
        )
    }, [defaults, hydrated])
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
                InputProps={{ inputProps: { min: 1 } }}
            />
            <Divider />
            <Typography variant="subtitle2">Defaults</Typography>
            <Stack
                direction="row"
                sx={{ flexWrap: 'wrap', '& .MuiFormControl-root': { flex: '1 1 220px' } }}
            >
                <TextField
                    fullWidth
                    label="Default base"
                    size="small"
                    placeholder="0x0"
                    value={
                        defaults.base === ''
                            ? ''
                            : `0x${Number(defaults.base).toString(16).toUpperCase()}`
                    }
                    onChange={(e) => {
                        const v = e.target.value.trim()
                        if (v === '') setDefaults((d) => ({ ...d, base: '' }))
                        else {
                            const n = v.startsWith('0x') ? parseInt(v, 16) : parseInt(v, 10)
                            if (!Number.isNaN(n)) setDefaults((d) => ({ ...d, base: n }))
                        }
                    }}
                    sx={{ minWidth: 220 }}
                />
                <TextField
                    fullWidth
                    label="Default end"
                    size="small"
                    placeholder="0xFFFF"
                    value={
                        defaults.end === ''
                            ? ''
                            : `0x${Number(defaults.end).toString(16).toUpperCase()}`
                    }
                    onChange={(e) => {
                        const v = e.target.value.trim()
                        if (v === '') setDefaults((d) => ({ ...d, end: '' }))
                        else {
                            const n = v.startsWith('0x') ? parseInt(v, 16) : parseInt(v, 10)
                            if (!Number.isNaN(n)) setDefaults((d) => ({ ...d, end: n }))
                        }
                    }}
                    sx={{ minWidth: 220 }}
                />
                <TextField
                    fullWidth
                    label="Default row size"
                    size="small"
                    placeholder="0x1000"
                    value={rowText}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/^0x/i, '')
                        setRowText(raw.toUpperCase())
                        if (/^[0-9a-fA-F]+$/.test(raw)) {
                            const n = parseInt(raw, 16)
                            if (!Number.isNaN(n))
                                setDefaults((d) => ({ ...d, row: Math.max(1, n) }))
                        }
                    }}
                    onBlur={() => {
                        setRowText(Number(defaults.row).toString(16).toUpperCase())
                    }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start">0x</InputAdornment>,
                    }}
                    inputProps={{ inputMode: 'text', pattern: '[0-9a-fA-F]*' }}
                    sx={{ minWidth: 220 }}
                />
                <Button
                    variant="outlined"
                    onClick={() => {
                        setDefaults({ base: '', end: '', row: 0x1000 })
                    }}
                >
                    Clear
                </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary">
                Settings persist to local storage across files.
            </Typography>
        </Box>
    )
}
