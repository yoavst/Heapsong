/**
 * Downloads a file with the given content, filename, and MIME type
 * @param content - The string content to download
 * @param filename - The name of the file to download
 * @param type - The MIME type of the file (e.g., 'application/json', 'text/html')
 */
export function downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}
