import { atom } from 'jotai'
import type { AppliedFilters, NormalizedAllocation, PendingFilters } from '../types'

export const heapAllocationsAtom = atom<NormalizedAllocation[] | null>(null)

export const appliedFiltersAtom = atom<AppliedFilters>({
    baseAddress: null,
    endAddress: null,
    rowSize: 0x1000,
})

// Make pending filters a writable base atom (was derived -> not writable)
export const pendingFiltersAtom = atom<PendingFilters>({
    baseAddress: null,
    endAddress: null,
    rowSize: 0x1000,
})

export const setPendingFiltersAtom = atom(null, (_get, set, next: Partial<PendingFilters>) => {
    set(pendingFiltersAtom, (prev) => ({ ...prev, ...next }))
})

export const applyPendingFiltersAtom = atom(null, (get, set) => {
    set(appliedFiltersAtom, get(pendingFiltersAtom))
})

export const selectedAddressAtom = atom<number | null>(null)

export const sidebarWidthAtom = atom<number>(360)

export const collapseEmptyRowsAtom = atom<{ enabled: boolean; threshold: number }>({
    enabled: false,
    threshold: 1,
})

export const themeColorAtom = atom<string>('#7c4dff')

// Row highlight for Go To
export const highlightRowBaseAtom = atom<number | null>(null)
