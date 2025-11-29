"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import {
  Search,
  LogOut,
  Download,
  Star,
  MessageCircle,
  BookOpen,
  FileText,
  File,
  Eye,
  TrendingUp,
  X,
  ArrowLeft,
} from "lucide-react"
import { getResources, addReview, getReviews, initializeDB, getResourceById, updateResource, getUserById, updateUser } from "../utils/indexeddb"

export function StudentDashboard({ userName, onBack, onLogout }) {
  const [resources, setResources] = useState([])
  const [reviews, setReviews] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedResourceId, setSelectedResourceId] = useState(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedPdfResource, setSelectedPdfResource] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeDB()
        const savedResources = await getResources()
        const savedReviews = await getReviews()
        setResources(savedResources)
        setReviews(savedReviews)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleBackClick = () => {
    // If any modal/view is open, close it first
    if (selectedPdfResource) {
      setSelectedPdfResource(null)
    } else if (showAnalytics) {
      setShowAnalytics(false)
    } else if (selectedResourceId) {
      setSelectedResourceId(null)
    } else {
      // If nothing is open, go back to home page
      onBack()
    }
  }

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddReview = async (resourceId) => {
    if (!comment.trim()) {
      alert("Please write a comment")
      return
    }

    const newReview = {
      id: Date.now().toString(),
      resourceId,
      studentName: userName,
      rating,
      comment,
      date: new Date().toLocaleDateString(),
    }

    try {
      await addReview(newReview)
      const updatedReviews = await getReviews()
      setReviews(updatedReviews)

      // Check if this is a 1-star review
      if (rating === 1) {
        const resource = await getResourceById(resourceId)
        if (resource) {
          // Get all 1-star reviews for this resource
          const oneStarReviews = updatedReviews.filter(
            (review) => review.resourceId === resourceId && review.rating === 1
          )

          // Update resource with 1-star count and flag if needed
          const oneStarCount = oneStarReviews.length
          const hasRedFlag = oneStarCount >= 10
          
          await updateResource(resourceId, {
            oneStarCount,
            hasRedFlag,
          })

          // If 100 or more 1-star reviews, block the admin
          if (oneStarCount >= 100 && resource.uploadedBy) {
            const admin = await getUserById(resource.uploadedBy)
            if (admin && admin.role === "admin" && !admin.isBlocked) {
              await updateUser(resource.uploadedBy, {
                isBlocked: true,
                blockReason: "Exceeded 100 one-star reviews on a resource",
                blockedAt: new Date().toISOString(),
              })
              alert("This admin account has been blocked due to excessive poor ratings (100+ one-star reviews).")
            }
          }

          // Reload resources to show updated flags
          const updatedResources = await getResources()
          setResources(updatedResources)
        }
      }

      setComment("")
      setRating(5)
      setSelectedResourceId(null)
      alert("Review added successfully!")
    } catch (error) {
      console.error("[v0] Error adding review:", error)
      alert("Error adding review. Please try again.")
    }
  }

  const handleDownload = async (resource) => {
    if (resource.fileData) {
      try {
        const blob = new Blob([new Uint8Array(resource.fileData)], { type: "application/pdf" })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = resource.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error("[v0] Error downloading file:", error)
        alert("Error downloading file. Please try again.")
      }
    } else {
      alert(`Downloading: ${resource.fileName}`)
    }
  }

  const getResourceReviews = (resourceId) => {
    return reviews.filter((review) => review.resourceId === resourceId)
  }

  const getAverageRating = (resourceId) => {
    const resourceReviews = getResourceReviews(resourceId)
    if (resourceReviews.length === 0) return 0
    const sum = resourceReviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / resourceReviews.length).toFixed(1)
  }

  const getResourceAnalytics = () => {
    return filteredResources.map((resource) => ({
      title: resource.title,
      reviews: getResourceReviews(resource.id).length,
      rating: getAverageRating(resource.id),
      downloads: Math.floor(Math.random() * 100) + 1,
    }))
  }

  const categories = ["all", "textbooks", "research-papers", "study-guides", "lecture-notes", "videos"]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-yellow-900 to-black">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-green-400 rounded-full mx-auto mb-4"></div>
          <p className="text-yellow-400 font-bold text-lg">Loading your library...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-900 to-green-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 via-green-500 to-yellow-500 border-b-4 border-yellow-400 shadow-2xl animate-[fadeInDown_0.6s_ease-out]">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-3 rounded-lg shadow-lg animate-[pulse_2s_ease-in-out_infinite] hover:rotate-12 transition-transform duration-300">
              <BookOpen className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Edulibrary Student</h1>
              <p className="text-sm text-yellow-200 font-semibold">Welcome, {userName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleBackClick}
              className="bg-white text-black hover:bg-gray-100 font-bold flex items-center gap-2 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold flex items-center gap-2 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
            >
              <TrendingUp className="w-4 h-4" />📊 Analytics
            </Button>
            <Button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Analytics Dashboard */}
        {showAnalytics && (
          <div className="mb-8 space-y-6 animate-[fadeInUp_0.5s_ease-out]">
            {/* Statistics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-4 border-blue-400 shadow-xl hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-600">Total Resources</p>
                      <p className="text-3xl font-bold text-blue-900">{resources.length}</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-full">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-green-400 shadow-xl hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-green-50 to-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-green-600">Total Reviews</p>
                      <p className="text-3xl font-bold text-green-900">{reviews.length}</p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-full">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-yellow-400 shadow-xl hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-yellow-600">Categories</p>
                      <p className="text-3xl font-bold text-yellow-900">
                        {[...new Set(resources.map(r => r.category))].length}
                      </p>
                    </div>
                    <div className="bg-yellow-500 p-3 rounded-full">
                      <File className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4 border-red-400 shadow-xl hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 bg-gradient-to-br from-red-50 to-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-red-600">Avg Rating</p>
                      <p className="text-3xl font-bold text-red-900">
                        {resources.length > 0 
                          ? (resources.reduce((sum, r) => sum + parseFloat(getAverageRating(r.id) || 0), 0) / resources.filter(r => getAverageRating(r.id) > 0).length || 0).toFixed(1)
                          : "0"}⭐
                      </p>
                    </div>
                    <div className="bg-red-500 p-3 rounded-full">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Distribution Chart */}
            <Card className="border-4 border-purple-400 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500">
                <CardTitle className="text-white text-xl font-bold">📊 Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="space-y-4">
                  {[...new Set(resources.map(r => r.category))].map((category, idx) => {
                    const count = resources.filter(r => r.category === category).length
                    const percentage = (count / resources.length) * 100
                    return (
                      <div key={category} className="animate-[slideInLeft_0.6s_ease-out]" style={{animationDelay: `${idx * 0.1}s`}}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-gray-900">{category.replace("-", " ").toUpperCase()}</span>
                          <span className="font-bold text-purple-600">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <div
                            className="h-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000 shadow-lg"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Rated Resources */}
            <Card className="border-4 border-yellow-400 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <CardTitle className="flex items-center gap-2 text-white text-xl font-bold">
                  <TrendingUp className="w-5 h-5" />🏆 Top Rated Resources
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getResourceAnalytics()
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 6)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        style={{animationDelay: `${idx * 0.1}s`}}
                        className="bg-white p-5 rounded-xl border-2 border-yellow-400 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-[fadeInUp_0.5s_ease-out]"
                      >
                        <h4 className="font-bold text-gray-900 mb-3 truncate text-lg">{item.title}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-yellow-100 rounded-lg">
                            <span className="text-sm font-bold text-gray-700">⭐ Rating:</span>
                            <span className="font-bold text-yellow-600 text-lg">
                              {item.rating > 0 ? `${item.rating}/5` : "No reviews"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-green-100 rounded-lg">
                            <span className="text-sm font-bold text-gray-700">💬 Reviews:</span>
                            <span className="font-bold text-green-600 text-lg">{item.reviews}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-blue-100 rounded-lg">
                            <span className="text-sm font-bold text-gray-700">⬇️ Downloads:</span>
                            <span className="font-bold text-blue-600 text-lg">{item.downloads}</span>
                          </div>
                          {item.rating > 0 && (
                            <div className="pt-2">
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-3 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 transition-all duration-1000"
                                  style={{ width: `${(item.rating / 5) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Rating Distribution Chart */}
            <Card className="border-4 border-green-400 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500">
                <CardTitle className="text-white text-xl font-bold">⭐ Rating Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-green-50 to-teal-50">
                <div className="space-y-4">
                  {[5, 4, 3, 2, 1].map((stars, idx) => {
                    const count = reviews.filter(r => r.rating === stars).length
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                    return (
                      <div key={stars} className="animate-[slideInRight_0.6s_ease-out]" style={{animationDelay: `${idx * 0.1}s`}}>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 w-24">
                            {[...Array(stars)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                            ))}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                              <div
                                className={`h-6 rounded-full transition-all duration-1000 ${
                                  stars === 5 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                                  stars === 4 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                  stars === 3 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                  stars === 2 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                  'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-gray-900 w-20 text-right">
                              {count} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Section */}
        <Card className="mb-8 shadow-xl border-4 border-green-400 rounded-xl">
          <CardHeader className="bg-gradient-to-r from-green-500 to-yellow-500 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white text-xl font-bold">
              <Search className="w-5 h-5" />
              Search Resources
            </CardTitle>
            <CardDescription className="text-gray-100 font-semibold">
              Find educational materials to enhance your learning
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6 bg-gradient-to-b from-green-50 to-yellow-50">
            <div>
              <Input
                placeholder="Search by title, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-base border-2 border-green-400 focus:border-yellow-500 font-semibold bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className={`capitalize font-bold ${
                      selectedCategory === cat
                        ? "bg-gradient-to-r from-green-600 to-yellow-500 text-white shadow-lg"
                        : "border-2 border-green-400 text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {cat === "all" ? "All" : cat.replace("-", " ")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-sm font-bold text-gray-900 p-3 bg-yellow-200 rounded-lg border-2 border-yellow-400">
              Found <span className="text-green-700 font-bold text-lg">{filteredResources.length}</span> resource(s)
            </div>
          </CardContent>
        </Card>

        {/* Resources Grid */}
        {filteredResources.length === 0 ? (
          <Card className="border-4 border-dashed border-green-400 bg-green-50 rounded-xl">
            <CardContent className="py-12 text-center">
              <FileText className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p className="text-gray-900 font-bold text-lg">No resources found</p>
              <p className="text-gray-700 text-sm font-semibold">Try adjusting your search or category filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource) => {
              const resourceReviews = getResourceReviews(resource.id)
              const averageRating = getAverageRating(resource.id)

              return (
                <Card
                  key={resource.id}
                  className="shadow-xl border-2 border-green-400 hover:border-yellow-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 rounded-xl overflow-hidden bg-gradient-to-r from-green-50 to-yellow-50 animate-[fadeInUp_0.6s_ease-out]"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="bg-gradient-to-br from-yellow-400 to-green-400 p-4 rounded-lg shadow-lg hover:scale-110 hover:rotate-6 transition-all duration-300">
                          <File className="w-6 h-6 text-black" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-bold text-gray-900">{resource.title}</h3>
                            {resource.uploadedByName && (
                              <span className="text-sm text-gray-600 font-semibold bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                                📤 By: {resource.uploadedByName}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mt-1 font-semibold">{resource.description}</p>

                          <div className="flex items-center gap-4 mt-3 flex-wrap">
                            <span className="inline-block bg-red-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg">
                              {resource.category.replace("-", " ").toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-700 font-semibold">📄 {resource.fileName}</span>
                            {resource.fileSize && (
                              <span className="text-sm text-gray-700 font-semibold">Size: {resource.fileSize} MB</span>
                            )}
                            <span className="text-sm text-gray-700 font-semibold">📅 {resource.uploadedDate}</span>
                          </div>

                          {/* Rating Display */}
                          <div className={`flex items-center gap-3 mt-4 p-3 rounded-lg border-2 ${
                            resource.hasRedFlag 
                              ? "bg-red-200 border-red-400" 
                              : "bg-yellow-200 border-yellow-400"
                          }`}>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={18}
                                  className={
                                    resource.hasRedFlag
                                      ? "fill-red-500 text-red-600 drop-shadow-lg"
                                      : i < Math.round(averageRating)
                                      ? "fill-yellow-400 text-yellow-500 drop-shadow-lg"
                                      : "text-gray-400"
                                  }
                                />
                              ))}
                            </div>
                            <span className={`text-sm font-bold ${resource.hasRedFlag ? "text-red-900" : "text-gray-900"}`}>
                              {averageRating > 0
                                ? `${averageRating} (${resourceReviews.length} reviews)`
                                : "No reviews yet"}
                              {resource.hasRedFlag && (
                                <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">
                                  ⚠️ {resource.oneStarCount || 0}+ Poor Ratings
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col">
                        <Button
                          onClick={() => setSelectedPdfResource(resource)}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold flex items-center gap-2 shadow-lg transform hover:scale-110 hover:shadow-2xl transition-all duration-300"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                        <Button
                          onClick={() => handleDownload(resource)}
                          className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold flex items-center gap-2 shadow-lg transform hover:scale-110 hover:shadow-2xl transition-all duration-300"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          onClick={() => setSelectedResourceId(resource.id)}
                          className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold flex items-center gap-2 shadow-lg transform hover:scale-110 hover:shadow-2xl transition-all duration-300"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Review
                        </Button>
                      </div>
                    </div>

                    {/* Reviews Section */}
                    {resourceReviews.length > 0 && (
                      <div className="mt-4 pt-4 border-t-2 border-yellow-300">
                        <h4 className="font-bold text-gray-900 mb-3 text-lg">Student Reviews</h4>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {resourceReviews.map((review) => (
                            <div
                              key={review.id}
                              className="bg-gradient-to-r from-green-100 to-yellow-100 p-4 rounded-lg border-l-4 border-green-500 shadow-md"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-gray-900">{review.studentName}</span>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={14}
                                      className={
                                        i < review.rating ? "fill-yellow-400 text-yellow-500" : "text-gray-400"
                                      }
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-800 font-semibold">{review.comment}</p>
                              <p className="text-xs text-gray-700 mt-1 font-semibold">{review.date}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Form */}
                    {selectedResourceId === resource.id && (
                      <div className="mt-4 pt-4 border-t-2 border-green-300 bg-gradient-to-r from-green-100 to-yellow-100 p-5 rounded-lg shadow-lg border-2 border-green-400">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Add Your Review</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-3">Rating</label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setRating(star)}
                                  className="focus:outline-none transition-transform hover:scale-125"
                                >
                                  <Star
                                    size={28}
                                    className={
                                      star <= rating
                                        ? "fill-yellow-400 text-yellow-500 drop-shadow-lg"
                                        : "text-gray-400"
                                    }
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Your Comment</label>
                            <textarea
                              placeholder="Share your thoughts about this resource..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="w-full border-2 border-green-400 rounded-lg px-4 py-3 text-sm font-semibold focus:border-yellow-500"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleAddReview(resource.id)}
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold shadow-lg transform hover:scale-105 transition"
                            >
                              Submit Review
                            </Button>
                            <Button
                              onClick={() => setSelectedResourceId(null)}
                              className="border-2 border-gray-400 text-gray-900 font-bold hover:bg-gray-100"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* PDF Viewer Modal */}
      {selectedPdfResource && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-96 shadow-2xl border-4 border-yellow-400 rounded-xl overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-yellow-500 to-green-500 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-xl font-bold">{selectedPdfResource.title}</CardTitle>
                  <CardDescription className="text-yellow-100 font-semibold">
                    {selectedPdfResource.fileName}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setSelectedPdfResource(null)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto bg-gray-900 p-4">
              <div className="bg-gradient-to-br from-green-100 to-yellow-100 rounded-lg p-8 text-center border-4 border-yellow-400">
                <div className="bg-yellow-400 w-20 h-20 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <FileText className="w-12 h-12 text-black" />
                </div>
                <p className="text-gray-900 font-bold text-lg mb-4">PDF File Preview</p>
                <p className="text-gray-700 font-semibold mb-6">
                  📄 {selectedPdfResource.fileName}
                  <br />
                  Size: {selectedPdfResource.fileSize} MB
                </p>
                <p className="text-gray-600 font-semibold mb-6 text-sm max-h-20 overflow-y-auto">
                  {selectedPdfResource.description}
                </p>
                <Button
                  onClick={() => {
                    handleDownload(selectedPdfResource)
                    setSelectedPdfResource(null)
                  }}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold flex items-center gap-2 shadow-lg transform hover:scale-105 transition mx-auto"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-black via-yellow-900 to-green-900 border-t-4 border-yellow-400 mt-12 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-white font-bold text-lg">© 2025 Edulibrary. Happy Learning! 📚</p>
        </div>
      </footer>
    </div>
  )
}
