export interface NormalizedAllocation {
    type: string
    address: bigint
    size: bigint
    actualSize: bigint
    color: string
    groupId: number

    [key: string]: unknown
}

export interface AppliedFilters {
    baseAddress: bigint | null
    endAddress: bigint | null
    rowSize: bigint
}

export interface SettingsData {
    defaultBaseAddress: bigint | null
    defaultEndAddress: bigint | null
    defaultRowSize: bigint
    themeColor: string
    collapseEmptyRows: boolean
    collapseThreshold: number
}
