/// <reference types="user-agent-data-types" />

import {
    AppBar,
    Box,
    Button,
    IconButton,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
    Link,
} from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import AssistantNavigationIcon from '@mui/icons-material/AssistantNavigation'
import { useAtom, useSetAtom } from 'jotai'
import {
    appliedFiltersAtom,
    DEFAULT_ROW_SIZE,
    heapAllocationsAtom,
    gotoDialogOpenAtom,
    gotoGroupDialogOpenAtom,
} from '../state/atoms'
import HexInput from './HexInput'
import { useCallback, useRef } from 'react'
import { AppliedFilters } from '../types'
import { convertToInputFormat } from '../utils/input'
import { downloadFile } from '../utils/download'
import { getMetaKey } from '../utils/os'
import { useHotkeys } from 'react-hotkeys-hook'

export default function TopBar() {
    const [appliedFilters, setAppliedFilter] = useAtom(appliedFiltersAtom)
    const [heap] = useAtom(heapAllocationsAtom)
    const setGotoDialogOpen = useSetAtom(gotoDialogOpenAtom)
    const setGotoGroupDialogOpen = useSetAtom(gotoGroupDialogOpenAtom)
    const pendingFilterChanges = useRef<Partial<AppliedFilters>>({})

    const applyAll = () => {
        setAppliedFilter({ ...appliedFilters, ...pendingFilterChanges.current })
    }

    const handleExportJson = useCallback(() => {
        if (!heap || heap.length === 0) return

        const inputAllocations = heap.map(convertToInputFormat)
        const json = JSON.stringify(inputAllocations, null, 4)
        downloadFile(json, 'heap-export.json', 'application/json')
    }, [heap])

    useHotkeys(
        `${getMetaKey()}+s`,
        () => {
            handleExportJson()
        },
        { preventDefault: true },
        [handleExportJson]
    )

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
                >
                    <Link href="./" underline="none">
                        HeapSong
                    </Link>
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
                    <Button variant="contained" onClick={applyAll}>
                        Apply
                    </Button>
                    <Box flex={1} />
                    <Tooltip title="Go to address (right click: Go to group)">
                        <IconButton
                            onClick={(e) => {
                                e.preventDefault()
                                setGotoDialogOpen(true)
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault()
                                setGotoGroupDialogOpen(true)
                            }}
                            disabled={!heap || heap.length === 0}
                        >
                            <AssistantNavigationIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Export JSON">
                        <IconButton
                            onClick={handleExportJson}
                            disabled={!heap || heap.length === 0}
                        >
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Toolbar>
        </AppBar>
    )
}
