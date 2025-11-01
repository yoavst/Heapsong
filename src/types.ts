export interface NormalizedAllocation {
    type: string
    address: number
    size: number
    actualSize: number
    color: string
    groupId: number

    [key: string]: unknown
}

export interface AppliedFilters {
    baseAddress: number | null
    endAddress: number | null
    rowSize: number
}

export interface SettingsData {
    defaultBaseAddress: number | null
    defaultEndAddress: number | null
    defaultRowSize: number
    themeColor: string
    collapseEmptyRows: boolean
    collapseThreshold: number
}
