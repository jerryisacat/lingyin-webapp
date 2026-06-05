"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Image as ImageIcon,
  Trash2,
  Loader2,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
} from "lucide-react"

interface ImageItem {
  key: string
  filename: string
  size: number
  uploadedAt: string
  entryDate: string | null
  thumbnailUrl: string
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ImageManagement() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selecting, setSelecting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  const fetchImages = useCallback(async (cursor?: string) => {
    const isFirstLoad = !cursor
    if (isFirstLoad) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams({ limit: "40" })
      if (cursor) params.set("cursor", cursor)

      const res = await fetch(`/api/user/images?${params}`)
      const json = await res.json()

      if (!json.ok) {
        setError(json.error ?? "加载失败")
        return
      }

      const newImages: ImageItem[] = json.data.images
      setImages((prev) => (cursor ? [...prev, ...newImages] : newImages))
      setTotalCount(json.data.totalCount)
      setNextCursor(json.data.nextCursor)
    } catch {
      setError("网络错误")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const toggleSelect = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === images.length) return new Set()
      return new Set(images.map((img) => img.key))
    })
  }, [images])

  const handleDelete = useCallback(
    async (keysToDelete: string[]) => {
      setDeleting(true)
      try {
        const res = await fetch("/api/user/images", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keys: keysToDelete }),
        })
        const json = await res.json()

        if (!json.ok) {
          setError(json.error ?? "删除失败")
          setDeleting(false)
          return
        }

        const deletedSet = new Set(keysToDelete)
        setImages((prev) => prev.filter((img) => !deletedSet.has(img.key)))
        setTotalCount((prev) => prev - keysToDelete.length)
        setSelected(new Set())
        setSelecting(false)
      } catch {
        setError("网络错误")
      } finally {
        setDeleting(false)
        setConfirmDelete(false)
      }
    },
    []
  )

  const initiateDelete = useCallback(() => {
    setConfirmDelete(true)
  }, [])

  const getDeleteKeys = (): string[] => {
    return selected.size > 0 ? [...selected] : []
  }

  const exitSelectMode = useCallback(() => {
    setSelecting(false)
    setSelected(new Set())
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">图片管理</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-ink-light" />
        </div>
      </div>
    )
  }

  if (error && images.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">图片管理</h2>
        </div>
        <p className="text-sm text-red-500 py-4">{error}</p>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-sakura" strokeWidth={1.5} />
          <h2 className="text-lg font-medium text-ink">图片管理</h2>
        </div>
        <span className="text-xs text-ink-light">
          {totalCount} 张 · {formatSize(images.reduce((s, i) => s + i.size, 0))}
        </span>
      </div>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-ink-light">
          <ImageIcon className="h-10 w-10 mb-2 opacity-30" strokeWidth={1} />
          <p className="text-sm">还没有上传过图片</p>
        </div>
      ) : (
        <>
          {selecting && (
            <div className="flex items-center justify-between rounded-lg bg-sakura/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-sm text-ink-light hover:text-ink"
                >
                  {selected.size === images.length ? (
                    <CheckSquare className="h-4 w-4 text-sakura" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  全选
                </button>
                <span className="text-xs text-ink-light">
                  已选 {selected.size} 张
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={initiateDelete}
                    className="flex items-center gap-1 rounded-md bg-red-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除所选
                  </button>
                )}
                <button
                  type="button"
                  onClick={exitSelectMode}
                  className="flex items-center gap-1 text-xs text-ink-light hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" />
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {images.map((img) => (
              <div
                key={img.key}
                className="group relative aspect-square overflow-hidden rounded-lg border border-surface-border bg-surface-hover"
              >
                <img
                  src={img.thumbnailUrl}
                  alt={img.filename}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                {selecting ? (
                  <button
                    type="button"
                    onClick={() => toggleSelect(img.key)}
                    className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-100 transition-opacity"
                  >
                    {selected.has(img.key) ? (
                      <CheckSquare className="h-6 w-6 text-white drop-shadow" />
                    ) : (
                      <Square className="h-6 w-6 text-white/80 drop-shadow" />
                    )}
                  </button>
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="p-2 space-y-0.5">
                      <p className="text-[10px] text-white/90 truncate">
                        {img.filename}
                      </p>
                      <p className="text-[10px] text-white/70">
                        {formatSize(img.size)}
                        {img.entryDate && ` · ${img.entryDate}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(new Set([img.key]))
                        setConfirmDelete(true)
                      }}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/40 p-1 text-white/80 opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {nextCursor && (
            <button
              type="button"
              onClick={() => fetchImages(nextCursor)}
              disabled={loadingMore}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loadingMore ? "加载中..." : "加载更多"}
            </button>
          )}

          {!selecting && images.length > 0 && (
            <button
              type="button"
              onClick={() => setSelecting(true)}
              className="btn-ghost text-sm flex items-center gap-1.5 text-dusty-blue hover:bg-sakura/5"
            >
              <CheckSquare className="h-4 w-4" />
              批量管理
            </button>
          )}
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-warm-white p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-medium text-ink">确认删除</h3>
            </div>
            <p className="text-sm text-ink-light">
              此操作不可恢复。删除后，如果这些图片仍被某些日记引用，对应位置将显示为破损图片。
            </p>
            <p className="text-sm font-medium text-ink">
              确定要删除 {getDeleteKeys().length} 张图片吗？
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false)
                  if (!selecting) setSelected(new Set())
                }}
                className="btn-ghost text-sm"
                disabled={deleting}
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDelete(getDeleteKeys())}
                className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 active:scale-[0.98] disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
