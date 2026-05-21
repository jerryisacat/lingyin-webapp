"use client";

import { useRef, useState, type DragEvent, type ChangeEvent } from "react";
import { ImagePlus, X, Loader2, AlertCircle, GripVertical } from "lucide-react";
import type { MediaFile } from "@/types";

const MAX_IMAGES = 9;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface UploadSlot {
  file: File;
  progress: number;
  error: string | null;
  mediaFile: MediaFile | null;
}

interface PhotoUploaderProps {
  images: MediaFile[];
  onImagesChange: (images: MediaFile[]) => void;
}

export default function PhotoUploader({ images, onImagesChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const remaining = MAX_IMAGES - images.length;

  async function uploadFile(file: File): Promise<MediaFile | null> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Upload failed");
    }

    const { data: mediaFile } = await res.json();
    return mediaFile as MediaFile;
  }

  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const picked = Array.from(files)
      .slice(0, remaining)
      .filter((f) => {
        if (!ALLOWED_TYPES.includes(f.type)) return false;
        if (f.size > MAX_SIZE) return false;
        return true;
      });

    if (picked.length === 0) return;

    const newSlots = picked.map((file) => ({
      file,
      progress: 0,
      error: null,
      mediaFile: null as MediaFile | null,
    }));
    setSlots((prev) => [...prev, ...newSlots]);

    picked.forEach((file, i) => {
      const slotIdx = slots.length + i;
      setSlots((prev) =>
        prev.map((s, idx) =>
          idx === slotIdx ? { ...s, progress: 10 } : s
        )
      );

      uploadFile(file)
        .then((mediaFile) => {
          setSlots((prev) =>
            prev.map((s, idx) =>
              idx === slotIdx ? { ...s, progress: 100, mediaFile } : s
            )
          );
          if (mediaFile) {
            onImagesChange([...images, mediaFile]);
          }
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "Upload failed";
          setSlots((prev) =>
            prev.map((s, idx) =>
              idx === slotIdx ? { ...s, error: msg } : s
            )
          );
        });
    });

    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }

    const newImages = [...images];
    const [moved] = newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, moved);
    onImagesChange(newImages);
    setDragIndex(null);
  }

  const totalImages = images.length;
  const gridSlots = Array.from(
    { length: Math.max(totalImages + (remaining > 0 ? 1 : 0), 3) },
    (_, i) => i
  ).slice(0, 9);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-ink-light">
        <ImagePlus className="w-4 h-4" />
        <span>
          图片 ({totalImages}/{MAX_IMAGES})
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {gridSlots.map((_, i) => {
          const image = images[i];
          const slot = slots[i];

          if (image) {
            return (
              <div
                key={image.path ?? i}
                className="relative aspect-square rounded-lg overflow-hidden border border-surface-border bg-surface group cursor-grab active:cursor-grabbing"
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i)}
              >
                <img
                  src={image.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <GripVertical className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          if (slot && slot.error) {
            return (
              <div
                key={`slot-${i}`}
                className="aspect-square rounded-lg border border-red-300 bg-red-50 flex flex-col items-center justify-center gap-1 p-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-xs text-red-500 text-center leading-tight">
                  {slot.error}
                </p>
              </div>
            );
          }

          if (slot && slot.progress < 100) {
            return (
              <div
                key={`slot-${i}`}
                className="aspect-square rounded-lg border border-surface-border bg-surface flex flex-col items-center justify-center gap-2"
              >
                <Loader2 className="w-6 h-6 text-sakura animate-spin" />
                <div className="w-3/4 h-1.5 bg-surface-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sakura rounded-full transition-all"
                    style={{ width: `${slot.progress}%` }}
                  />
                </div>
              </div>
            );
          }

          if (i === totalImages && remaining > 0) {
            return (
              <button
                key="add"
                type="button"
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-dusty-blue/40 hover:border-sakura bg-surface/50 hover:bg-surface flex flex-col items-center justify-center gap-1 transition-colors"
              >
                <ImagePlus className="w-6 h-6 text-dusty-blue" />
                <span className="text-xs text-ink-light">上传</span>
              </button>
            );
          }

          return (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-lg border border-dashed border-surface-border/50 bg-surface/30"
            />
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-ink-light">
        支持 JPG / PNG / WebP，单张不超过 {formatSize(MAX_SIZE)}
      </p>
    </div>
  );
}
