import { useAtom } from 'jotai'
import {
    collapseEmptyRowsAtom,
    DEFAULT_ROW_SIZE,
    defaultFiltersAtom,
    defaultSearchShowAllGroupAtom,
} from '../../state/atoms'
import { useCallback, useRef } from 'react'
import { AppliedFilters } from '../../types'
import {
    Box,
    Switch,
    FormControlLabel,
    TextField,
    Divider,
    Typography,
    Button,
} from '@mui/material'
import HexInput from '../HexInput'

export default function SettingsTab() {
    const [collapse, setCollapse] = useAtom(collapseEmptyRowsAtom)
    const [defaultFilters, setDefaultFilters] = useAtom(defaultFiltersAtom)
    const [defaultSearchShowAllGroup, setDefaultSearchShowAllGroup] = useAtom(
        defaultSearchShowAllGroupAtom
    )
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

            <FormControlLabel
                control={
                    <Switch
                        checked={defaultSearchShowAllGroup}
                        onChange={(_, checked) => {
                            setDefaultSearchShowAllGroup(checked)
                        }}
                    />
                }
                label={
                    defaultSearchShowAllGroup
                        ? 'Search: By default show the whole group for results.'
                        : "Search: By default do not show the whole group for results."
                }
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
