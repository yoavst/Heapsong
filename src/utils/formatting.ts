export function formatHex(n: bigint | number): string {
    return '0x' + n.toString(16)
}
