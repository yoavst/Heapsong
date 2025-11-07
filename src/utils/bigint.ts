export function max(a: bigint, b: bigint): bigint {
    return a > b ? a : b
}

export function min(a: bigint, b: bigint): bigint {
    return a < b ? a : b
}

export function compare(a: bigint, b: bigint): number {
    return a < b ? -1 : a > b ? 1 : 0
}
