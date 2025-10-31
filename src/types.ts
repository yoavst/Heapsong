export type HexOrNumber = number | string

export interface Allocation {
    // required
    type: string
    address: HexOrNumber
    size: HexOrNumber
    actual_size: HexOrNumber
    color?: string
    group_id: number
    // allow any extra fields
    [key: string]: unknown
}

export interface NormalizedAllocation {
    type: string
    address: number
    size: number
    actualSize: number
    color: string
    groupId: number
    raw: Allocation
}

export interface HeapFile {
    entries: Allocation[]
}

export interface AppliedFilters {
    baseAddress: number | null
    endAddress: number | null
    rowSize: number
}

export interface PendingFilters extends AppliedFilters {}

export interface SettingsData {
    defaultBaseAddress: number | null
    defaultEndAddress: number | null
    defaultRowSize: number
    themeColor: string
    collapseEmptyRows: boolean
    collapseThreshold: number
}
