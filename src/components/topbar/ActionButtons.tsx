import { Box, IconButton, Tooltip } from '@mui/material'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import AssistantNavigationIcon from '@mui/icons-material/AssistantNavigation'
import { useSetAtom } from 'jotai'
import { gotoDialogOpenAtom, gotoGroupDialogOpenAtom, Tab } from '../../state/atoms'
import { useCallback } from 'react'
import { convertToInputFormat } from '../../utils/input'
import { downloadFile } from '../../utils/download'
import { getMetaKey } from '../../utils/os'
import { useHotkeys } from 'react-hotkeys-hook'
import { useToast } from '../ToastContext'

interface ActionButtonsProps {
    activeTab?: Tab
}

export default function ActionButtons({ activeTab }: ActionButtonsProps) {
    const setGotoDialogOpen = useSetAtom(gotoDialogOpenAtom)
    const setGotoGroupDialogOpen = useSetAtom(gotoGroupDialogOpenAtom)
    const { show } = useToast()

    const handleExportJson = useCallback(() => {
        if (!activeTab?.heapAllocations || activeTab.heapAllocations.length === 0) {
            show('No heap allocations to export', 'error')
            return
        }

        const inputAllocations = activeTab.heapAllocations.map(convertToInputFormat)
        const json = JSON.stringify(inputAllocations, null, 4)

        // Generate filename from tab name, sanitize it, and ensure .json extension
        let filename = activeTab.name || 'heap-export'
        // Remove invalid filename characters
        filename = filename.replace(/[<>:"/\\|?*]/g, '').trim()
        // Add .json extension if not present
        if (!filename.toLowerCase().endsWith('.json')) {
            filename += '.json'
        }
        // Fallback if filename is empty after sanitization
        if (!filename || filename === '.json') {
            filename = 'heap-export.json'
        }

        downloadFile(json, filename, 'application/json')
    }, [activeTab, show])

    useHotkeys(
        `${getMetaKey()}+s`,
        () => {
            handleExportJson()
        },
        { preventDefault: true },
        [handleExportJson]
    )

    const hasData = activeTab?.heapAllocations && activeTab.heapAllocations.length > 0

    return (
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
            <Tooltip title="Go to address (right click: Go to group)">
                <span>
                    <IconButton
                        onClick={(e) => {
                            e.preventDefault()
                            setGotoDialogOpen(true)
                        }}
                        onContextMenu={(e) => {
                            e.preventDefault()
                            setGotoGroupDialogOpen(true)
                        }}
                        disabled={!hasData}
                    >
                        <AssistantNavigationIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title="Export JSON">
                <span>
                    <IconButton onClick={handleExportJson} disabled={!hasData}>
                        <FileDownloadIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
    )
}
