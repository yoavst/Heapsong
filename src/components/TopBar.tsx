import { AppBar, Box, Button, Stack, Toolbar, Typography } from '@mui/material'
import { useAtom } from 'jotai'
import { appliedFiltersAtom, DEFAULT_ROW_SIZE } from '../state/atoms'
import HexInput from './HexInput'
import { useRef } from 'react'
import { AppliedFilters } from '../types'
import { useNavigate } from 'react-router-dom'

export default function TopBar() {
    const [appliedFilters, setAppliedFilter] = useAtom(appliedFiltersAtom)
    const pendingFilterChanges = useRef<Partial<AppliedFilters>>({})
    const navigate = useNavigate()

    const applyAll = () => {
        setAppliedFilter({ ...appliedFilters, ...pendingFilterChanges.current })
    }

    return (
        <AppBar
            position="sticky"
            color="default"
            elevation={1}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
            <Toolbar sx={{ gap: 2 }}>
                <Typography
                    role="button"
                    sx={{
                        cursor: 'pointer',
                    }}
                    variant="h6"
                    fontWeight={800}
                    color="primary"
                    onClick={() => {
                        void navigate('/')
                    }}
                >
                    HeapSong
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <HexInput
                        label="Base address"
                        placeholder="0"
                        apply={applyAll}
                        defaultValue={appliedFilters.baseAddress}
                        setValue={(value) => {
                            pendingFilterChanges.current = {
                                ...pendingFilterChanges,
                                baseAddress: value,
                            }
                        }}
                    />
                    <HexInput
                        label="End address"
                        placeholder="FF..FF"
                        apply={applyAll}
                        defaultValue={appliedFilters.endAddress}
                        setValue={(value) => {
                            pendingFilterChanges.current = {
                                ...pendingFilterChanges,
                                endAddress: value,
                            }
                        }}
                    />
                    <HexInput
                        label="Row size"
                        placeholder={DEFAULT_ROW_SIZE.toString(16)}
                        apply={applyAll}
                        defaultValue={appliedFilters.rowSize}
                        setValue={(value) => {
                            pendingFilterChanges.current = {
                                ...pendingFilterChanges,
                                rowSize: value ?? DEFAULT_ROW_SIZE,
                            }
                        }}
                    />
                    <Box flex={1} />
                    <Button variant="contained" onClick={applyAll}>
                        Apply
                    </Button>
                </Stack>
            </Toolbar>
        </AppBar>
    )
}
