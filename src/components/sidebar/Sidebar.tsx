import { Box, Divider, Tab, Tabs } from '@mui/material'

import { useState } from 'react'
import SettingsTab from './SettingsTab'
import SearchTab from './SearchTab'

export default function Sidebar() {
    const [tab, setTab] = useState(0)
    return (
        <Box sx={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                value={tab}
                onChange={(_, v: number) => {
                    setTab(v)
                }}
                variant="fullWidth"
            >
                <Tab label="Search" />
                <Tab label="Settings" />
            </Tabs>
            <Divider />
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <Box
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        display: tab === 0 ? 'block' : 'none',
                    }}
                >
                    <SearchTab />
                </Box>
                <Box
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        display: tab === 1 ? 'block' : 'none',
                    }}
                >
                    <SettingsTab />
                </Box>
            </Box>
        </Box>
    )
}
