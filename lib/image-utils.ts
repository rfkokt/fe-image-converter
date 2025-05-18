/**
 * Validates if a file is an acceptable image
 * @param file The file to validate
 * @returns Boolean indicating if the file is valid
 */
export function isValidImage(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
  const maxFileSize = 50 * 1024 * 1024 // 50MB limit

  return validTypes.includes(file.type) && file.size <= maxFileSize
}

/**
 * Safely creates an object URL and ensures cleanup
 * @param blob The blob to create a URL for
 * @returns An object with the URL and a cleanup function
 */
export function createSafeObjectURL(blob: Blob): { url: string; revoke: () => void } {
  const url = URL.createObjectURL(blob)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  }
}

/**
 * Safely downloads a file
 * @param blob The blob to download
 * @param filename The filename to use
 */
export function safeDownload(blob: Blob, filename: string): void {
  const { url, revoke } = createSafeObjectURL(blob)

  try {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.rel = "noopener noreferrer" // Security best practice
    document.body.appendChild(a)
    a.click()
  } finally {
    // Ensure cleanup happens even if there's an error
    setTimeout(() => {
      document.body.removeChild(document.body.lastChild as Node)
      revoke()
    }, 100)
  }
}
