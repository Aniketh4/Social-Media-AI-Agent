"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"

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

// Add default overlays configuration
const DEFAULT_OVERLAYS = [
  { name: "5% Off", path: "/overlays/5-off.png" },
  { name: "10% Off", path: "/overlays/10-off.png" },
  { name: "New Year", path: "/overlays/new-year.png" },
  { name: "Diwali Sale", path: "/overlays/diwali-sale.png" },
  { name: "Limited Time", path: "/overlays/limited-time.png" },
  { name: "Free Shipping", path: "/overlays/free-shipping.png" },
]

export default function ImageManipulator() {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null)
  const [overlays, setOverlays] = useState<Overlay[]>([])
  const [textInput, setTextInput] = useState("")
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("Arial")
  const [textColor, setTextColor] = useState("#000000")
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null)
  const [isPlacing, setIsPlacing] = useState(false)
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [overlayImageSize, setOverlayImageSize] = useState(200)
  const [tempOverlayImage, setTempOverlayImage] = useState<HTMLImageElement | null>(null)
  const [secondaryColor, setSecondaryColor] = useState("#FFFFFF")
  const [activeOverlayType, setActiveOverlayType] = useState<'image' | 'text'>('image')
  const [isGenerating, setIsGenerating] = useState(false)

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
        setTempOverlayImage(img)
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

    const overlay = overlays.find(o => o.id === id)
    if (overlay) {
      // Calculate the offset from the mouse position to the overlay's top-left corner
      setDragOffset({
        x: x - overlay.x,
        y: y - overlay.y
      })
    }

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
    setSelectedOverlay(id)
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
              x: x - dragOffset.x,
              y: y - dragOffset.y,
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
    setDragOffset({ x: 0, y: 0 })
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

  // Add a new function to check if the mouse is over an overlay
  const isMouseOverOverlay = (x: number, y: number, overlay: Overlay): boolean => {
    return (
      x >= overlay.x &&
      x <= overlay.x + overlay.width &&
      y >= overlay.y &&
      y <= overlay.y + overlay.height
    )
  }

  // Add a new function to handle mouse over events
  const handleMouseOver = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if mouse is over any overlay
    let isOverOverlay = false
    for (const overlay of overlays) {
      if (isMouseOverOverlay(x, y, overlay)) {
        isOverOverlay = true
        break
      }
    }

    // Change cursor based on whether mouse is over an overlay
    canvas.style.cursor = isOverOverlay || isPlacing ? "move" : "default"
  }

  // Add a new function to handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if mouse is over any overlay
    const clickedOverlay = overlays.find((overlay) => isMouseOverOverlay(x, y, overlay))
    if (clickedOverlay) {
      handleMouseDown(e, clickedOverlay.id)
    } else {
      setSelectedOverlay(null)
      setActiveOverlay(null)
    }
  }

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !baseImage) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Set canvas size to match base image
    canvas.width = baseImage.width
    canvas.height = baseImage.height

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

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

      // Draw selection indicator if overlay is selected
      if (overlay.id === selectedOverlay) {
        ctx.fillStyle = "rgba(59, 130, 246, 0.1)"
        ctx.fillRect(overlay.x - 2, overlay.y - 2, overlay.width + 4, overlay.height + 4)

        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2
        ctx.strokeRect(overlay.x - 2, overlay.y - 2, overlay.width + 4, overlay.height + 4)

        const handleSize = 8
        ctx.fillStyle = "#3b82f6"
        ctx.fillRect(
          overlay.x + overlay.width - handleSize,
          overlay.y + overlay.height - handleSize,
          handleSize,
          handleSize
        )
      }
    })
  }, [baseImage, overlays, selectedOverlay])

  // Add these new functions
  const triggerBaseImageUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerOverlayImageUpload = () => {
    overlayFileInputRef.current?.click()
  }

  // Add function to handle overlay deletion
  const handleDeleteOverlay = (id: string) => {
    setOverlays(overlays.filter((overlay) => overlay.id !== id))
    if (selectedOverlay === id) {
      setSelectedOverlay(null)
    }
  }

  // Add the overlay image with selected size
  const addOverlayImage = () => {
    if (!tempOverlayImage) return

    const newOverlay: Overlay = {
      id: `image-${Date.now()}`,
      type: "image",
      content: "",
      x: 50,
      y: 50,
      width: Math.min(tempOverlayImage.width, overlayImageSize),
      height: Math.min(tempOverlayImage.height, overlayImageSize) * (tempOverlayImage.height / tempOverlayImage.width),
      img: tempOverlayImage,
      isDragging: false,
      isResizing: false,
    }
    setOverlays([...overlays, newOverlay])
    setActiveOverlay(newOverlay.id)
    setIsPlacing(true)
    setTempOverlayImage(null)
  }

  // Cancel overlay image addition
  const cancelOverlayImage = () => {
    setTempOverlayImage(null)
  }

  // Add function to handle default overlay selection
  const handleDefaultOverlaySelect = (path: string) => {
    const img = new Image()
    img.onload = () => {
      setTempOverlayImage(img)
    }
    img.src = path
  }

  // Update the generateAIOverlay function
  const generateAIOverlay = async () => {
    try {
      setIsGenerating(true)
      const response = await fetch('http://localhost:8000/generate-overlay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textInput,
          baseColor: textColor,
          secondaryColor: secondaryColor
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate overlay');
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        // Create a canvas to handle the image at full resolution
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match image dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image at full resolution
        ctx.drawImage(img, 0, 0);

        // Create a new image from the canvas
        const highQualityImage = new Image();
        highQualityImage.onload = () => {
          setTempOverlayImage(highQualityImage);
          setTextInput('');
        };
        highQualityImage.src = canvas.toDataURL('image/png', 1.0); // Use maximum quality
      };
      img.src = imageUrl;
    } catch (error) {
      console.error('Error generating overlay:', error);
    } finally {
      setIsGenerating(false)
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls */}
            <div className="lg:col-span-4 space-y-6 bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border">
              <div>
                <Label htmlFor="base-image" className="text-base font-medium text-primary">Base Image</Label>
                <p className="text-sm text-muted-foreground mb-2">Upload your main image to start editing</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    onClick={triggerBaseImageUpload}
                    variant="outline"
                    className="w-full hover:bg-primary/10"
                  >
                    Choose Base Image
                  </Button>
                  <Input
                    id="base-image"
                    type="file"
                    accept="image/*"
                    onChange={handleBaseImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Overlay Controls */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-primary">Overlays</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveOverlayType('image')}
                      className={activeOverlayType === 'image' ? 'bg-primary/10' : ''}
                    >
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveOverlayType('text')}
                      className={activeOverlayType === 'text' ? 'bg-primary/10' : ''}
                    >
                      Text
                    </Button>
                  </div>
                </div>

                {/* Image Overlay Section */}
                {activeOverlayType === 'image' && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium text-primary">AI Generated Overlays</Label>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label className="text-sm">Overlay Text</Label>
                          <Input
                            placeholder="e.g., 50% OFF, New Year Special"
                            className="mt-1"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Primary Color</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-12 h-10"
                            />
                            <Input
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="flex-1"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Secondary Color (Optional)</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              type="color"
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="w-12 h-10"
                            />
                            <Input
                              value={secondaryColor}
                              onChange={(e) => setSecondaryColor(e.target.value)}
                              className="flex-1"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={generateAIOverlay}
                          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                          disabled={!textInput.trim() || isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            'Generate Overlay'
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Label className="text-base font-medium text-primary">Default Overlays</Label>
                      <Select onValueChange={handleDefaultOverlaySelect}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select an overlay" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFAULT_OVERLAYS.map((overlay) => (
                            <SelectItem key={overlay.path} value={overlay.path}>
                              <div className="flex items-center gap-2">
                                <img
                                  src={overlay.path}
                                  alt={overlay.name}
                                  className="h-6 w-auto object-contain"
                                />
                                <span>{overlay.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="overlay-image" className="text-base font-medium text-primary">Custom Overlay</Label>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          onClick={triggerOverlayImageUpload}
                          variant="outline"
                          className="w-full hover:bg-primary/10"
                        >
                          Upload Custom Image
                        </Button>
                        <Input
                          id="overlay-image"
                          type="file"
                          accept="image/*"
                          onChange={handleOverlayImageUpload}
                          ref={overlayFileInputRef}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {tempOverlayImage && (
                      <div className="mt-4 space-y-4 p-4 bg-primary/5 rounded-lg">
                        <div>
                          <Label className="text-base font-medium text-primary">Image Size</Label>
                          <Slider
                            value={[overlayImageSize]}
                            onValueChange={(value) => setOverlayImageSize(value[0])}
                            min={50}
                            max={500}
                            step={10}
                            className="mt-2"
                          />
                          <span className="text-sm text-muted-foreground mt-1 block">{overlayImageSize}px</span>
                        </div>
                        <div>
                          <div className="mt-2 p-2 border rounded-lg">
                            <div className="relative aspect-video bg-muted">
                              {/* Add cropping interface here */}
                              <img
                                src={tempOverlayImage.src}
                                alt="Preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={addOverlayImage}
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                          >
                            Add Image
                          </Button>
                          <Button 
                            onClick={cancelOverlayImage}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Text Overlay Section */}
                {activeOverlayType === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="text-input" className="text-base font-medium text-primary">Text Overlay</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="text-input"
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Enter text..."
                          className="focus-visible:ring-violet-500"
                        />
                        <Button 
                          onClick={addTextOverlay}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-medium text-primary">Font Size</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        min={12}
                        max={72}
                        step={1}
                        className="mt-2"
                      />
                      <span className="text-sm text-muted-foreground mt-1 block">{fontSize}px</span>
                    </div>

                    <div>
                      <Label className="text-base font-medium text-primary">Font Family</Label>
                      <Select value={fontFamily} onValueChange={setFontFamily}>
                        <SelectTrigger className="mt-2">
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
                      <Label className="text-base font-medium text-primary">Text Color</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-12 h-10"
                        />
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedOverlay && (
                <div className="pt-4 border-t">
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                    <p className="text-sm text-primary font-medium mb-2">Selected Overlay</p>
                    <p className="text-sm text-muted-foreground">
                      Click and drag to move. Use the corner handle to resize.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDeleteOverlay(selectedOverlay)}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete Selected Overlay
                  </Button>
                </div>
              )}

              <Button
                onClick={downloadImage}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                disabled={!baseImage}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Image
              </Button>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-8 bg-card/50 backdrop-blur-sm p-6 rounded-xl shadow-lg border">
              {!baseImage ? (
                <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-border rounded-lg">
                  <p className="text-muted-foreground mb-4">Upload an image to get started</p>
                  <Button 
                    onClick={triggerBaseImageUpload} 
                    variant="outline"
                    className="hover:bg-primary/10"
                  >
                    Choose Base Image
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full border border-border rounded-lg"
                    onMouseDown={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseOver={handleMouseOver}
                  />
                  {selectedOverlay && (
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm text-primary">
                      Selected: {overlays.find(o => o.id === selectedOverlay)?.type || 'overlay'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
