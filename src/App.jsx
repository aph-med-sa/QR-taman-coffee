import { ChevronLeft, ChevronRight, Copy, Download, ImageDown } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'

const imageFiles = [
  'dH8hE7_9ae51d0be8607b39.jpg',
  'dH8hE7_8f85fdaf32a3da5f.jpg',
  'dH8hE7_ce4c7d05f145216a.jpg',
]

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash || '')

  useEffect(() => {
    const onChange = () => setHash(window.location.hash || '')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const route = hash.replace(/^#\/?/, '').split('?')[0].trim().toLowerCase()
  return route || 'menu'
}

function MenuViewer({ images }) {
  return (
    <div className="fixed inset-0 bg-black" dir="rtl">
      <div className="h-full overflow-y-auto">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="block w-full select-none"
            draggable={false}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  )
}

function QrPage({ menuUrl }) {
  const [dataUrl, setDataUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(menuUrl, { width: 320, margin: 2, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [menuUrl])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  const savePng = async () => {
    try {
      setDownloading(true)
      const url = await QRCode.toDataURL(menuUrl, { width: 1024, margin: 2, errorCorrectionLevel: 'M' })
      const a = document.createElement('a')
      a.href = url
      a.download = 'tamancafe-menu-qr.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      setDownloading(false)
    }
  }

  const saveSvg = async () => {
    try {
      setDownloading(true)
      const svg = await QRCode.toString(menuUrl, { type: 'svg', margin: 2, errorCorrectionLevel: 'M', width: 1024 })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tamancafe-menu-qr.svg'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">QR المنيو</h1>
          <a
            href="#/menu"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            فتح المنيو
          </a>
        </div>

        <div className="mt-6 flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="QR"
              className="h-[320px] w-[320px] rounded-xl border bg-white p-2"
            />
          ) : (
            <div className="h-[320px] w-[320px] animate-pulse rounded-xl bg-slate-200" />
          )}
        </div>

        <div className="mt-6 space-y-3">
          <div className="break-all rounded-xl bg-slate-100 p-3 text-sm text-slate-800">
            {menuUrl}
          </div>

          <button
            type="button"
            onClick={copy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'تم النسخ' : 'نسخ الرابط'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={downloading}
              onClick={saveSvg}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
            >
              <ImageDown className="h-4 w-4" />
              تحميل SVG
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={savePng}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              تحميل PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const route = useHashRoute()

  const images = useMemo(() => {
    return imageFiles.map((file) => new URL(`${import.meta.env.BASE_URL}${file}`, window.location.href).href)
  }, [])

  const menuUrl = useMemo(() => {
    const base = new URL('.', window.location.href).href
    return `${base}#/menu`
  }, [])

  if (route === 'qr') return <QrPage menuUrl={menuUrl} />
  return <MenuViewer images={images} />
}
