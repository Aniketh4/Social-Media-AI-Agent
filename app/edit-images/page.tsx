"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Overlay {
  id: string
  type: "text" | "image"
  content: string
  x: number
  y: number
  width: number
  height: number
  fontSize?: number
  fontFamily?: string
  color?: string
  img?: HTMLImageElement
  isDragging: boolean
  isResizing: boolean
}

export default function ImageManipulator() {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [textInput, setTextInput] = useState("")
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#000000")
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const overlayFileInputRef = useRef<HTMLInputElement>(null)

  // Handle base image upload
  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setBaseImage(img)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Handle overlay image upload
  const handleOverlayImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const newOverlay: Overlay = {
          id: `image-${Date.now()}`,
          type: "image",
          content: "",
          x: 50,
          y: 50,
          width: Math.min(img.width, 200),
          height: Math.min(img.height, 200) * (img.height / img.width),
          img,
          isDragging: false,
          isResizing: false,
        }
        setOverlays([...overlays, newOverlay])
        setActiveOverlay(newOverlay.id)
        setIsPlacing(true)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Add text overlay
  const addTextOverlay = () => {
    if (!textInput.trim()) return

    const newOverlay: Overlay = {
      id: `text-${Date.now()}`,
      type: "text",
      content: textInput,
      x: 50,
      y: 50,
      width: textInput.length * fontSize * 0.6,
      height: fontSize * 1.2,
      fontSize,
      fontFamily,
      color: textColor,
      isDragging: false,
      isResizing: false,
    }

    setOverlays([...overlays, newOverlay])
    setActiveOverlay(newOverlay.id)
    setTextInput("")
  }

  // Handle mouse down on overlay
  const handleMouseDown = (e: React.MouseEvent, id: string, isResize = false) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setOverlays(
      overlays.map((overlay) => {
        if (overlay.id === id) {
          return {
            ...overlay,
            isDragging: !isResize,
            isResizing: isResize,
          }
        }
        return { ...overlay, isDragging: false, isResizing: false }
      }),
    )

    setActiveOverlay(id)
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isPlacing && activeOverlay) {
      setOverlays(
        overlays.map((overlay) => {
          if (overlay.id === activeOverlay) {
            return {
              ...overlay,
              x,
              y,
            }
          }
          return overlay
        }),
      )
    } else {
      setOverlays(
        overlays.map((overlay) => {
          if (overlay.isDragging) {
            return {
              ...overlay,
              x,
              y,
            }
          } else if (overlay.isResizing) {
            return {
              ...overlay,
              width: Math.max(30, x - overlay.x),
              height: overlay.type === "text" ? overlay.fontSize! * 1.2 : Math.max(30, y - overlay.y),
            }
          }
          return overlay
        }),
      )
    }
  }

  // Handle mouse up
  const handleMouseUp = () => {
    if (isPlacing) {
      setIsPlacing(false)
    }
    setOverlays(
      overlays.map((overlay) => ({
        ...overlay,
        isDragging: false,
        isResizing: false,
      })),
    )
  }

  // Remove overlay
  const removeOverlay = (id: string) => {
    setOverlays(overlays.filter((overlay) => overlay.id !== id))
    if (activeOverlay === id) {
      setActiveOverlay(null)
    }
  }

  // Download image
  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "edited-image.png"
    link.href = canvas.toDataURL()
    link.click()
  }

  // Check if mouse is over overlay
  const isMouseOverOverlay = (x: number, y: number, overlay: Overlay): boolean => {
    return (
      x >= overlay.x &&
      x <= overlay.x + overlay.width &&
      y >= overlay.y &&
      y <= overlay.y + overlay.height
    )
  }

  // Handle mouse over
  const handleMouseOver = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const isOverAnyOverlay = overlays.some((overlay) => isMouseOverOverlay(x, y, overlay))
    canvas.style.cursor = isOverAnyOverlay ? "move" : "default"
  }

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedOverlay = overlays.find((overlay) => isMouseOverOverlay(x, y, overlay))
    setActiveOverlay(clickedOverlay?.id || null)
  }

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !baseImage) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match base image
    canvas.width = baseImage.width
    canvas.height = baseImage.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw base image
    ctx.drawImage(baseImage, 0, 0)

    // Draw overlays
    overlays.forEach((overlay) => {
      if (overlay.type === "text") {
        ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`
        ctx.fillStyle = overlay.color || "#000000"
        ctx.fillText(overlay.content, overlay.x, overlay.y + overlay.fontSize!)
      } else if (overlay.type === "image" && overlay.img) {
        ctx.drawImage(overlay.img, overlay.x, overlay.y, overlay.width, overlay.height)
      }
    })
  }, [baseImage, overlays])

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Controls */}
        <div className="w-full md:w-64 space-y-4">
          <div>
            <Label htmlFor="base-image">Base Image</Label>
            <Input
              id="base-image"
              type="file"
              accept="image/*"
              onChange={handleBaseImageUpload}
              ref={fileInputRef}
            />
          </div>

          <div>
            <Label htmlFor="overlay-image">Overlay Image</Label>
            <Input
              id="overlay-image"
              type="file"
              accept="image/*"
              onChange={handleOverlayImageUpload}
              ref={overlayFileInputRef}
            />
          </div>

          <div>
            <Label htmlFor="text-input">Text Overlay</Label>
            <div className="flex gap-2">
              <Input
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
              />
              <Button onClick={addTextOverlay}>Add</Button>
            </div>
          </div>

          <div>
            <Label>Font Size</Label>
            <Slider
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              min={12}
              max={72}
              step={1}
            />
          </div>

          <div>
            <Label>Font Family</Label>
            <Select value={fontFamily} onValueChange={setFontFamily}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                <SelectItem value="Courier New">Courier New</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Text Color</Label>
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-full h-10"
            />
          </div>

          <Button
            onClick={downloadImage}
            className="w-full"
            disabled={!baseImage}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg"
            onMouseDown={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseOver={handleMouseOver}
          />
        </div>
      </div>
    </div>
  )
}
