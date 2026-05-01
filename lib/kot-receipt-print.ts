function openPrintWindowWithHtml(html: string): void {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) {
    throw new Error('Pop-up blocked. Allow pop-ups to print the KOT receipt.')
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => {
    try {
      w.print()
    } catch {
      // ignore
    }
  }, 300)
}

function printPdfBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const w = window.open(url, '_blank', 'noopener,noreferrer')
  if (!w) {
    URL.revokeObjectURL(url)
    throw new Error('Pop-up blocked. Allow pop-ups to print the KOT receipt.')
  }
  const revoke = () => URL.revokeObjectURL(url)
  w.addEventListener('load', () => {
    setTimeout(() => {
      try {
        w.print()
      } catch {
        // ignore
      }
      setTimeout(revoke, 60_000)
    }, 500)
  })
  w.addEventListener('beforeunload', revoke)
}

function readStringField(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim().length > 0) return v
  }
  return null
}

function tryPrintFromJsonPayload(json: unknown): boolean {
  if (!json || typeof json !== 'object') return false
  const root = json as Record<string, unknown>
  const data = root.data
  const payload =
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : root

  const html =
    readStringField(payload, ['html', 'receipt_html', 'kot_html', 'receipt', 'body']) ??
    (typeof payload.content === 'string' ? payload.content : null)
  if (html) {
    openPrintWindowWithHtml(html)
    return true
  }

  const url =
    readStringField(payload, ['pdf_url', 'receipt_url', 'url', 'print_url', 'kot_url']) ??
    (typeof payload.signed_url === 'string' ? payload.signed_url : null)
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  const b64 =
    readStringField(payload, ['pdf_base64', 'base64_pdf', 'receipt_pdf_base64']) ??
    (typeof payload.pdf === 'string' ? payload.pdf : null)
  if (b64) {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    printPdfBlob(new Blob([bytes], { type: 'application/pdf' }))
    return true
  }

  // Some cashier APIs trigger printing server-side and only return success JSON.
  // In that case, treat the response as a valid successful KOT action.
  if (root.success === true) {
    return true
  }

  return false
}

/**
 * Handles cashier KOT receipt responses: PDF, HTML, or JSON with html/url/base64 fields.
 */
export async function printKotReceiptFromResponse(res: Response): Promise<void> {
  if (!res.ok) {
    const text = await res.text()
    let msg = `KOT request failed (${res.status})`
    try {
      const j = JSON.parse(text) as {
        message?: string
        error?: { message?: string; code?: string }
        errors?: Record<string, string[]>
      }
      if (typeof j.message === 'string' && j.message.trim()) msg = j.message.trim()
      else if (typeof j.error?.message === 'string' && j.error.message.trim()) {
        msg = j.error.message.trim()
        if (j.error.code) msg = `${msg} (${j.error.code})`
      } else if (j.errors && typeof j.errors === 'object') {
        const parts = Object.entries(j.errors).flatMap(([k, v]) =>
          Array.isArray(v) ? v.map((e) => `${k}: ${e}`) : [],
        )
        if (parts.length) msg = parts.join('; ')
      }
    } catch {
      if (text.trim()) msg = text.trim()
    }
    throw new Error(msg)
  }

  const contentType = res.headers.get('content-type') ?? ''

  if (contentType.includes('application/pdf')) {
    printPdfBlob(await res.blob())
    return
  }

  if (contentType.includes('text/html')) {
    openPrintWindowWithHtml(await res.text())
    return
  }

  const json: unknown = await res.json()
  if (typeof json === 'object' && json !== null && 'success' in json && (json as { success: boolean }).success === false) {
    const msg = (json as { message?: string }).message?.trim()
    throw new Error(msg || 'KOT request failed')
  }
  if (tryPrintFromJsonPayload(json)) return

  throw new Error('KOT response was not a printable receipt (expected PDF, HTML, or known JSON fields).')
}
