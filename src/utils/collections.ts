export function groupBy<T, K extends string | number>(list: T[], key: (t: T) => K): Record<K, T[]> {
    const map = new Map<K, T[]>()
    for (const item of list) {
        const k = key(item)
        const arr = map.get(k)
        if (arr) arr.push(item)
        else map.set(k, [item])
    }
    const out = {} as Record<K, T[]>
    for (const [k, arr] of map.entries()) {
        out[k] = arr
    }
    return out
}
