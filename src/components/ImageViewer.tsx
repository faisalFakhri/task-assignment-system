import { useState } from 'react'

interface MockImage {
  id: string
  fileName: string
  fileUrl: string
  description: string
}

interface ImageViewerProps {
  images: MockImage[]
  currentIndex: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

export default function ImageViewer({ images, currentIndex, onClose, onIndexChange }: ImageViewerProps) {
  const [imageError, setImageError] = useState(false)

  if (images.length === 0 || currentIndex < 0 || currentIndex >= images.length) return null
  const current = images[currentIndex]

  const next = () => {
    if (currentIndex < images.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }

  const prev = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-950/90 text-white font-mono text-xs">
      {/* Top Bar */}
      <div className="flex h-12 items-center justify-between border-b border-gray-800 px-4">
        <div>
          <span className="font-semibold text-gray-200">{current.fileName}</span>
          <span className="ml-2 text-gray-500">
            ({currentIndex + 1} of {images.length})
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded border border-gray-700 bg-gray-900 px-3 py-1 hover:bg-gray-800"
        >
          [CLOSE]
        </button>
      </div>

      {/* Main Preview Container */}
      <div className="flex flex-1 items-center justify-between p-4 relative">
        <button
          onClick={prev}
          disabled={currentIndex === 0}
          className="z-10 rounded border border-gray-700 bg-gray-900/50 p-3 text-lg hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-gray-900/50"
        >
          &larr;
        </button>

        <div className="flex max-h-[70vh] max-w-[80vw] flex-col items-center justify-center">
          {imageError ? (
            <div className="flex max-h-[60vh] min-h-[200px] items-center justify-center border border-gray-800 bg-gray-900 px-6 text-sm text-gray-400">
              Image unavailable
            </div>
          ) : (
            <img
              src={current.fileUrl}
              alt={current.description || current.fileName}
              onError={() => setImageError(true)}
              className="max-h-[60vh] object-contain border border-gray-800"
            />
          )}
          {current.description && (
            <p className="mt-4 text-center text-sm text-gray-300 max-w-xl bg-gray-900/40 p-2 rounded">
              {current.description}
            </p>
          )}
        </div>

        <button
          onClick={next}
          disabled={currentIndex === images.length - 1}
          className="z-10 rounded border border-gray-700 bg-gray-900/50 p-3 text-lg hover:bg-gray-800 disabled:opacity-30 disabled:hover:bg-gray-900/50"
        >
          &rarr;
        </button>
      </div>
    </div>
  )
}
