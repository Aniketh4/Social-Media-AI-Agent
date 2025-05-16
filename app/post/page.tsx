"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Calendar, Clock, Image as ImageIcon, Video, Upload, BarChart2, Sparkles, Target, TrendingUp, Zap, Settings, Brain, Clock4, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Navbar from "@/components/navbar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type PostMode = "predict" | "schedule" | null

export default function PostPage() {
  const router = useRouter()
  const [postMode, setPostMode] = useState<PostMode>(null)
  const [formData, setFormData] = useState({
    followers: "",
    platform: "",
    postType: "",
    category: "",
    caption: "",
    media: null as File | null,
    scheduledTime: "",
  })

  const [loading, setLoading] = useState(false)
  const [predictions, setPredictions] = useState<{
    engagement: number | null
    bestTime: string | null
  }>({
    engagement: null,
    bestTime: null,
  })

  const [isPredicting, setIsPredicting] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState([])
  const [showScheduledPosts, setShowScheduledPosts] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData(prev => ({ ...prev, media: file }))
  }

  // Seeded random number generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }

  const predictEngagement = async () => {
    // Check if all required fields are filled
    if (!formData.followers || !formData.platform || !formData.postType || !formData.category) {
      alert("Please fill in all fields before getting predictions")
      return
    }

    setIsPredicting(true)
    setPredictions({ engagement: null, bestTime: null })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 3500))

    // Create a seed from the input values
    const seed = parseInt(formData.followers) + 
                formData.platform.charCodeAt(0) + 
                formData.postType.charCodeAt(0) + 
                formData.category.charCodeAt(0)

    // Calculate base engagement based on followers
    const followerCount = parseInt(formData.followers)
    const baseEngagement = Math.floor(followerCount * (0.5 + seededRandom(seed) * 1.0)) // Random between 50% and 150% of followers

    // Add random variation (±20%)
    const variation = baseEngagement * 0.2
    const engagement = Math.floor(baseEngagement + (seededRandom(seed + 1) * variation * 2 - variation))

    // Calculate best time based on platform
    let hour
    const platformRanges = {
      instagram: { min: 8, max: 21 },
      facebook: { min: 9, max: 20 },
      twitter: { min: 7, max: 22 }
    }

    const range = platformRanges[formData.platform as keyof typeof platformRanges]
    const randomOffset = seededRandom(seed + 2)
    hour = Math.floor(range.min + (randomOffset * (range.max - range.min)))
    
    const bestTime = `${hour.toString().padStart(2, '0')}:00`
    
    setPredictions({
      engagement,
      bestTime,
    })
    setIsPredicting(false)
  }

  const handleSubmit = async (e: React.FormEvent, isScheduled: boolean) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.media) {
        toast.error("Please upload an image first")
        setLoading(false)
        return
      }

      // First, save the image to the generated images directory
      const formDataToSend = new FormData()
      formDataToSend.append('file', formData.media)

      // Save the image first
      const saveResponse = await fetch('http://localhost:8000/save-image', {
        method: 'POST',
        body: formDataToSend,
      })

      if (!saveResponse.ok) {
        throw new Error('Failed to save image')
      }

      const { filename } = await saveResponse.json()

      if (isScheduled) {
        // Schedule the post
        const scheduleResponse = await fetch('http://localhost:8000/schedule-post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_path: filename,
            caption: formData.caption,
            scheduled_time: formData.scheduledTime
          })
        })

        if (!scheduleResponse.ok) {
          throw new Error('Failed to schedule post')
        }

        const result = await scheduleResponse.json()
        toast.success('Post scheduled successfully!')
        fetchScheduledPosts() // Refresh the scheduled posts list
      } else {
        // Publish immediately
        const response = await fetch('http://localhost:8000/publish-to-instagram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_path: filename,
            caption: formData.caption
          })
        })

        if (!response.ok) {
          throw new Error('Failed to publish post')
        }

        toast.success('Post published successfully!')
      }
      
      // Reset form
      setFormData({
        followers: "",
        platform: "",
        postType: "",
        category: "",
        caption: "",
        media: null,
        scheduledTime: "",
      })
      setPredictions({ engagement: null, bestTime: null })
    } catch (error) {
      console.error("Error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to process post")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledPosts()
    // Poll for updates every minute
    const interval = setInterval(fetchScheduledPosts, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchScheduledPosts = async () => {
    try {
      const response = await fetch('http://localhost:8000/scheduled-posts')
      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts')
      }
      const data = await response.json()
      setScheduledPosts(data.posts)
    } catch (error) {
      console.error('Error fetching scheduled posts:', error)
      toast.error('Failed to fetch scheduled posts')
    }
  }

  const deleteScheduledPost = async (postId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/scheduled-posts/${postId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete post')
      }
      
      fetchScheduledPosts()
      toast.success('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const renderScheduledPosts = () => {
    if (!scheduledPosts.length) {
      return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-violet-100 text-center">
          <p className="text-gray-500">No scheduled posts found</p>
        </div>
      )
    }

    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-violet-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-violet-900">Scheduled Posts</h2>
          <Button
            variant="ghost"
            onClick={() => setShowScheduledPosts(false)}
            className="text-violet-600 hover:text-violet-700"
          >
            Hide Table
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Scheduled Time</TableHead>
              <TableHead>Caption</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledPosts.map((post: any) => (
              <TableRow key={post.id}>
                <TableCell className="font-medium">
                  {format(new Date(post.scheduled_time), 'MMM d, yyyy h:mm a')}
                </TableCell>
                <TableCell className="max-w-md truncate">
                  {post.caption}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      post.status === 'pending' ? 'default' :
                      post.status === 'published' ? 'secondary' :
                      'destructive'
                    }
                    className={
                      post.status === 'pending' ? 'bg-violet-100 text-violet-700' :
                      post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }
                  >
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {post.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduledPost(post.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />

      <section className="py-20 px-4 bg-violet-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-400 rounded-full filter blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400 rounded-full filter blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold text-violet-900 mb-6">Social Media AI Assistant</h2>
            <p className="text-xl text-gray-900 max-w-3xl mx-auto">
              Leverage the power of AI to optimize your social media strategy and maximize engagement
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!postMode ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              >
                <Card 
                  className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-violet-100"
                  onClick={() => setPostMode("predict")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-6">
                      <Brain className="w-8 h-8 text-violet-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-violet-900 mb-4">Predict Engagement</h3>
                    <p className="text-gray-900 mb-6">
                      Get AI-powered predictions for your post's potential engagement and optimal posting time
                    </p>
                    <ul className="text-left text-gray-900 space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                        Engagement rate prediction
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                        Best time to post
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-violet-400 rounded-full mr-2"></span>
                        Audience insights
                      </li>
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-12 text-base">
                      Get Predictions
                    </Button>
                  </div>
                </Card>

                <Card 
                  className="p-8 cursor-pointer hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm border-violet-100"
                  onClick={() => setPostMode("schedule")}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                      <Clock4 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-violet-900 mb-4">Schedule Post</h3>
                    <p className="text-gray-900 mb-6">
                      Plan and schedule your posts for maximum impact with our intelligent scheduling system
                    </p>
                    <ul className="text-left text-gray-900 space-y-2 mb-6">
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                        Multi-platform scheduling
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                        Optimal timing suggestions
                      </li>
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                        Content calendar management
                      </li>
                    </ul>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 text-base">
                      Schedule Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {postMode === "predict" ? (
                  <Card className="p-8 shadow-lg bg-white/90 backdrop-blur-sm border-violet-100">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-semibold text-violet-900">Predict Engagement</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setPostMode(null)}
                        className="text-violet-600 hover:text-violet-700"
                      >
                        ← Back to options
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label htmlFor="followers" className="text-base text-gray-900">Number of Followers</Label>
                        <Input
                          id="followers"
                          name="followers"
                          type="number"
                          placeholder="Enter number of followers"
                          value={formData.followers}
                          onChange={handleInputChange}
                          className="border-violet-200 focus:border-violet-400 h-12 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="platform" className="text-base text-gray-900">Select Platform</Label>
                        <Select
                          value={formData.platform}
                          onValueChange={(value) => handleSelectChange("platform", value)}
                        >
                          <SelectTrigger className="border-violet-200 focus:border-violet-400 h-12 text-base">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postType" className="text-base text-gray-900">Type of Post</Label>
                        <Select
                          value={formData.postType}
                          onValueChange={(value) => handleSelectChange("postType", value)}
                        >
                          <SelectTrigger className="border-violet-200 focus:border-violet-400 h-12 text-base">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-base text-gray-900">Category of Post</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => handleSelectChange("category", value)}
                        >
                          <SelectTrigger className="border-violet-200 focus:border-violet-400 h-12 text-base">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="informative">Informative</SelectItem>
                            <SelectItem value="entertainment">Entertainment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={predictEngagement}
                      disabled={isPredicting || !formData.followers || !formData.platform || !formData.postType || !formData.category}
                      className="w-full mt-8 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-12 text-base"
                    >
                      {isPredicting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-5 w-5" />
                          Get AI Predictions
                        </>
                      )}
                    </Button>

                    <AnimatePresence mode="wait">
                      {isPredicting && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6 p-6 bg-violet-50 rounded-lg"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-violet-600 animate-spin mb-4" />
                            <p className="text-gray-900 font-medium">Analyzing your post...</p>
                            <p className="text-gray-600 text-sm mt-2">Our AI is calculating optimal engagement times</p>
                          </div>
                        </motion.div>
                      )}

                      {predictions.engagement && predictions.bestTime && !isPredicting && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-2 gap-6 p-6 bg-violet-50 rounded-lg">
                            <div>
                              <p className="text-base text-gray-900 mb-2">Predicted Engagement</p>
                              <p className="text-3xl font-bold text-violet-900">
                                {predictions.engagement.toLocaleString()} views
                              </p>
                            </div>
                            <div>
                              <p className="text-base text-gray-900 mb-2">Best Time to Post</p>
                              <p className="text-3xl font-bold text-violet-900">{predictions.bestTime}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-emerald-800 text-sm">
                              💡 Schedule your post at {predictions.bestTime} to achieve maximum engagement. This time slot is optimized based on your audience's activity patterns and platform-specific analytics.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ) : (
                  <Card className="p-8 shadow-lg bg-white/90 backdrop-blur-sm border-violet-100">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-2xl font-semibold text-violet-900">Schedule Post</h3>
                      <Button
                        variant="ghost"
                        onClick={() => setPostMode(null)}
                        className="text-violet-600 hover:text-violet-700"
                      >
                        ← Back to options
                      </Button>
                    </div>
                    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-8">
                      <div className="space-y-2">
                        <Label htmlFor="caption" className="text-base text-gray-900">Caption Text</Label>
                        <Textarea
                          id="caption"
                          name="caption"
                          placeholder="Write your caption here..."
                          rows={4}
                          value={formData.caption}
                          onChange={handleInputChange}
                          className="border-violet-200 focus:border-violet-400 resize-none text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="media" className="text-base text-gray-900">Upload Media</Label>
                        <div className="flex items-center justify-center w-full">
                          <label
                            htmlFor="media"
                            className="flex flex-col items-center justify-center w-full h-40 border-2 border-violet-200 border-dashed rounded-lg cursor-pointer bg-violet-50 hover:bg-violet-100 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {formData.media ? (
                                <div className="text-center">
                                  <p className="text-base text-gray-900 font-semibold">
                                    {formData.media.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {(formData.media.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <Upload className="w-10 h-10 mb-3 text-violet-500" />
                                  <p className="mb-2 text-base text-gray-900">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    PNG, JPG up to 10MB
                                  </p>
                                </>
                              )}
                            </div>
                            <input
                              id="media"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scheduledTime" className="text-base text-gray-900">Scheduled Time</Label>
                        <Input
                          id="scheduledTime"
                          name="scheduledTime"
                          type="datetime-local"
                          value={formData.scheduledTime}
                          onChange={handleInputChange}
                          className="border-violet-200 focus:border-violet-400 h-12 text-base"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Button
                          type="button"
                          onClick={(e) => handleSubmit(e, false)}
                          disabled={loading || !formData.caption || !formData.media}
                          className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-5 w-5" />
                              Post Now
                            </>
                          )}
                        </Button>

                        <Button
                          type="submit"
                          disabled={loading || !formData.caption || !formData.media || !formData.scheduledTime}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <Clock4 className="mr-2 h-5 w-5" />
                              Schedule Post
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-violet-900">Post Management</h2>
            <Button
              onClick={() => setShowScheduledPosts(!showScheduledPosts)}
              variant="outline"
              className="text-violet-600 hover:text-violet-700"
            >
              {showScheduledPosts ? (
                <>
                  <Clock4 className="mr-2 h-4 w-4" />
                  Hide Scheduled Posts
                </>
              ) : (
                <>
                  <Clock4 className="mr-2 h-4 w-4" />
                  View Scheduled Posts
                </>
              )}
            </Button>
          </div>
          
          {showScheduledPosts && renderScheduledPosts()}
        </div>
      </section>
    </main>
  )
}
