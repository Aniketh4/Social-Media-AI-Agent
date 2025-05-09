"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Video, Sparkles, Send, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/hero-section"
import HowItWorks from "@/components/how-it-works"
import { cn } from "@/lib/utils"

export default function Home() {
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    occasion: "",
    includeText: true,
    isSale: false,
  })

  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<null | { type: "image" | "video"; url: string }>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, occasion: value }))
  }

  const handleSubmit = async (type: "image" | "video") => {
    setLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock response
      const mockUrl = type === "image" ? "/placeholder.svg?height=400&width=600" : "https://example.com/video.mp4"

      setGeneratedContent({ type, url: mockUrl })
    } catch (error) {
      console.error("Error generating content:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      <HeroSection />

      <HowItWorks />

      <section id="try-it-now" className="py-20 px-4 bg-violet-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-400 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-violet-900 mb-4">Try It Now</h2>
            <p className="text-lg text-violet-700 max-w-2xl mx-auto">
              Fill in the details below and let our AI create the perfect social media post for your brand
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <Card className="p-6 shadow-lg bg-white/90 backdrop-blur-sm border-violet-100">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      name="productName"
                      placeholder="e.g. Premium Headphones"
                      value={formData.productName}
                      onChange={handleInputChange}
                      className="border-violet-200 focus:border-violet-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productDescription">Product Description</Label>
                    <Textarea
                      id="productDescription"
                      name="productDescription"
                      placeholder="Describe your product in detail..."
                      rows={4}
                      value={formData.productDescription}
                      onChange={handleInputChange}
                      className="border-violet-200 focus:border-violet-400 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occasion">Occasion</Label>
                    <Select onValueChange={handleSelectChange} value={formData.occasion}>
                      <SelectTrigger id="occasion" className="border-violet-200 focus:border-violet-400">
                        <SelectValue placeholder="Select an occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="birthday">Birthday</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="newLaunch">New Launch</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="includeText"
                        checked={formData.includeText}
                        onCheckedChange={(checked) => handleSwitchChange("includeText", checked)}
                      />
                      <Label htmlFor="includeText">Include Text on Post</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isSale"
                        checked={formData.isSale}
                        onCheckedChange={(checked) => handleSwitchChange("isSale", checked)}
                      />
                      <Label htmlFor="isSale">Is this a Sale?</Label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                      onClick={() => handleSubmit("image")}
                      disabled={loading || !formData.productName || !formData.productDescription || !formData.occasion}
                      className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </Button>

                    <Button
                      onClick={() => handleSubmit("video")}
                      disabled={loading || !formData.productName || !formData.productDescription || !formData.occasion}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Generate Video
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <Card
                className={cn(
                  "p-6 shadow-lg bg-white/90 backdrop-blur-sm border-violet-100 min-h-[400px] flex flex-col items-center justify-center",
                  loading && "animate-pulse",
                )}
              >
                {loading ? (
                  <div className="text-center">
                    <Sparkles className="h-16 w-16 text-violet-500 mx-auto mb-4 animate-spin" />
                    <p className="text-violet-700 font-medium">Creating your perfect social media post...</p>
                  </div>
                ) : generatedContent ? (
                  <div className="w-full">
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden mb-4">
                      {generatedContent.type === "image" ? (
                        <img
                          src={generatedContent.url || "/placeholder.svg"}
                          alt="Generated content"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-violet-100">
                          <Video className="h-16 w-16 text-violet-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <Button variant="outline" className="border-violet-200 text-violet-700">
                        <Send className="mr-2 h-4 w-4" />
                        Post to Social Media
                      </Button>
                      <Button variant="outline" className="border-violet-200 text-violet-700">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Your generated content will appear here</p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 bg-violet-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2025 Social Media Manager AI. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
