import { ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'

const imageFiles = [
  'dH8hE7_8f85fdaf32a3da5f.jpg',
  'dH8hE7_9ae51d0be8607b39.jpg',
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
  const [index, setIndex] = useState(0)
  const pointerStartXRef = useRef(null)

  const length = images.length
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + length) % length), [length])
  const goNext = useCallback(() => setIndex((i) => (i + 1) % length), [length])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev])

  useEffect(() => {
    const nextSrc = images[(index + 1) % images.length]
    const prevSrc = images[(index - 1 + images.length) % images.length]
    const preload = (src) => {
      const img = new Image()
      img.src = src
    }
    preload(nextSrc)
    preload(prevSrc)
  }, [images, index])

  const onPointerDown = (e) => {
    pointerStartXRef.current = e.clientX
  }

  const onPointerUp = (e) => {
    const startX = pointerStartXRef.current
    pointerStartXRef.current = null
    if (typeof startX !== 'number') return

    const dx = e.clientX - startX
    if (Math.abs(dx) < 60) return
    if (dx > 0) goPrev()
    else goNext()
  }

  return (
    <div
      className="fixed inset-0 bg-black"
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      <img
        src={images[index]}
        alt=""
        className="h-full w-full object-contain select-none"
        draggable={false}
      />

      <button
        type="button"
        aria-label="السابق"
        onClick={goPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur hover:bg-black/70 active:bg-black/80"
      >
        <ChevronLeft className="h-7 w-7" />
      </button>

      <button
        type="button"
        aria-label="التالي"
        onClick={goNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white backdrop-blur hover:bg-black/70 active:bg-black/80"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
    </div>
  )
}

function QrPage({ menuUrl }) {
  const [dataUrl, setDataUrl] = useState('')
  const [copied, setCopied] = useState(false)

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
