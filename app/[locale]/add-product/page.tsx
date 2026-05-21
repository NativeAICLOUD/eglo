"use client"

import { useState, useEffect } from "react"
import { Button } from "../../../components/Button"
import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { useRouter, useParams } from "next/navigation"
import { apiService, BackendCategory } from "../../../lib/api"

type Step = 1 | 2 | 3 | 4

interface FieldItem {
  id: string
  label: string
  value: string
}

interface CategoryFields {
  [key: string]: FieldItem[]
}

interface ProductImage {
  id: string
  file: File
  preview: string
}

export default function AddProductPage() {
  const router = useRouter()
  const { locale } = useParams() as { locale: string }
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subcategory: ""
  })

  // Product images state
  const [productImages, setProductImages] = useState<ProductImage[]>([])

  // Dynamic fields state
  const [categoryFields, setCategoryFields] = useState<CategoryFields>({
    "product-details": [],
    "dimensions": [],
    "technical-information": [],
    "other-information": []
  })

  // Toggle state for showing input fields
  const [showInputs, setShowInputs] = useState<{[key: string]: boolean}>({
    "product-details": false,
    "dimensions": false,
    "technical-information": false,
    "other-information": false
  })

  // Input values state
  const [inputValues, setInputValues] = useState<{[key: string]: {label: string, value: string}}>({
    "product-details": { label: "", value: "" },
    "dimensions": { label: "", value: "" },
    "technical-information": { label: "", value: "" },
    "other-information": { label: "", value: "" }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDynamicInputChange = (category: string, field: 'label' | 'value', value: string) => {
    setInputValues(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }

  const toggleInputs = (category: string) => {
    setShowInputs(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const saveField = (category: string) => {
    const { label, value } = inputValues[category]
    console.log(`📝 [FRONTEND] Saving field for category "${category}":`, { label, value })
    
    if (label.trim() && value.trim()) {
      const newField: FieldItem = {
        id: Date.now().toString(),
        label: label.trim(),
        value: value.trim()
      }
      
      console.log(`✅ [FRONTEND] Created new field:`, newField)
      
      setCategoryFields(prev => {
        const updated = {
          ...prev,
          [category]: [...prev[category], newField]
        }
        console.log(`📝 [FRONTEND] Updated category fields for "${category}":`, updated[category])
        return updated
      })

      // Clear inputs and hide them
      setInputValues(prev => ({
        ...prev,
        [category]: { label: "", value: "" }
      }))
      setShowInputs(prev => ({
        ...prev,
        [category]: false
      }))
      
      console.log(`🧹 [FRONTEND] Cleared inputs for category "${category}"`)
    } else {
      console.log(`❌ [FRONTEND] Cannot save field - missing label or value for category "${category}"`)
    }
  }

  const deleteField = (category: string, fieldId: string) => {
    setCategoryFields(prev => ({
      ...prev,
      [category]: prev[category].filter(field => field.id !== fieldId)
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const newImage: ProductImage = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              file: file,
              preview: e.target?.result as string
            }
            setProductImages(prev => [...prev, newImage])
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const removeImage = (imageId: string) => {
    setProductImages(prev => prev.filter(img => img.id !== imageId))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const newImage: ProductImage = {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              file: file,
              preview: e.target?.result as string
            }
            setProductImages(prev => [...prev, newImage])
          }
          reader.readAsDataURL(file)
        }
      })
    }
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    console.log("🚀 [FRONTEND] Starting product submission process...")
    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      console.log("📝 [FRONTEND] Validating form data...")
      console.log("📝 [FRONTEND] Form data:", formData)
      console.log("📝 [FRONTEND] Category fields:", categoryFields)
      
      // Validate required fields
      if (!formData.name.trim()) {
        console.error("❌ [FRONTEND] Validation failed: Product name is required")
        throw new Error('Product name is required')
      }
      if (!formData.description.trim()) {
        console.error("❌ [FRONTEND] Validation failed: Product description is required")
        throw new Error('Product description is required')
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        console.error("❌ [FRONTEND] Validation failed: Valid product price is required")
        throw new Error('Valid product price is required')
      }
      
      console.log("✅ [FRONTEND] Validation passed")

      // Prepare the data for API submission
      const productDetails = categoryFields["product-details"].reduce((acc, field) => {
        acc[field.label] = field.value
        return acc
      }, {} as Record<string, string>)
      
      const dimensions = categoryFields["dimensions"].reduce((acc, field) => {
        acc[field.label] = field.value
        return acc
      }, {} as Record<string, string>)
      
      const technicalInfo = categoryFields["technical-information"].reduce((acc, field) => {
        acc[field.label] = field.value
        return acc
      }, {} as Record<string, string>)
      
      const otherInfo = categoryFields["other-information"].reduce((acc, field) => {
        acc[field.label] = field.value
        return acc
      }, {} as Record<string, string>)

      const submissionData = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        category: formData.category,
        subcategory: formData.subcategory,
        productDetails,
        dimensions,
        technicalInfo,
        otherInfo
      }

      console.log("📤 [FRONTEND] Prepared submission data:")
      console.log("📤 [FRONTEND] - Basic info:", { name: submissionData.name, description: submissionData.description, price: submissionData.price, category: submissionData.category, subcategory: submissionData.subcategory })
      console.log("📤 [FRONTEND] - Product details:", productDetails)
      console.log("📤 [FRONTEND] - Dimensions:", dimensions)
      console.log("📤 [FRONTEND] - Technical info:", technicalInfo)
      console.log("📤 [FRONTEND] - Other info:", otherInfo)
      console.log("📤 [FRONTEND] - Full payload:", JSON.stringify(submissionData, null, 2))

      console.log("🌐 [FRONTEND] Sending request to /api/products/add...")
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token')
      console.log("🔐 [FRONTEND] Auth token:", token ? "Found" : "Not found")
      console.log("🔐 [FRONTEND] Token value:", token ? `${token.substring(0, 20)}...` : "No token")
      
      // Check all localStorage keys to debug
      console.log("🔐 [FRONTEND] All localStorage keys:", Object.keys(localStorage))
      
      const response = await fetch('/api/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(submissionData),
      })

      console.log("📥 [FRONTEND] Received response:")
      console.log("📥 [FRONTEND] - Status:", response.status)
      console.log("📥 [FRONTEND] - Status text:", response.statusText)
      console.log("📥 [FRONTEND] - Headers:", Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log("📥 [FRONTEND] - Response body:", result)

      if (response.ok) {
        console.log("✅ [FRONTEND] Product created successfully!")
        setSubmitSuccess(true)
      } else {
        console.error("❌ [FRONTEND] Error creating product:", result)
        setSubmitError(result.message || 'Failed to create product. Please try again.')
      }
    } catch (error) {
      console.error("💥 [FRONTEND] Exception occurred:", error)
      console.error("💥 [FRONTEND] Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      setSubmitError(error instanceof Error ? error.message : 'Failed to create product. Please try again.')
    } finally {
      console.log("🏁 [FRONTEND] Submission process completed")
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: "Product Information", description: "Product name and pricing details" },
    { number: 2, title: "Category Selection", description: "Select category and subcategory" },
    { number: 3, title: "Product Images", description: "Upload product images" },
    { number: 4, title: "Review & Create", description: "Review your product and create it" }
  ]

  // Categories loaded from the same backend API as the storefront — single source of truth
  const [categories, setCategories] = useState<BackendCategory[]>([])
  useEffect(() => {
    apiService.getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const selectedCategory = categories.find(cat => cat.id === formData.category)
  const subcategories: BackendCategory[] = selectedCategory?.subcategories ?? []

  const renderCategorySection = (categoryKey: string, title: string) => {
    const fields = categoryFields[categoryKey]
    const isShowingInputs = showInputs[categoryKey]
    const inputData = inputValues[categoryKey]

    // Get placeholder based on category
    const getLabelPlaceholder = (category: string) => {
      switch (category) {
        case "product-details":
          return "e.g., Material Number"
        case "dimensions":
          return "e.g., Article Height"
        case "technical-information":
          return "e.g., Protection Class"
        case "other-information":
          return "e.g., Illuminant Type"
        default:
          return "Field Name"
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button
            onClick={() => toggleInputs(categoryKey)}
            className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Input Fields */}
        {isShowingInputs && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name
                </label>
                <input
                  type="text"
                  value={inputData.label}
                  onChange={(e) => handleDynamicInputChange(categoryKey, 'label', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder={getLabelPlaceholder(categoryKey)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value
                </label>
                <input
                  type="text"
                  value={inputData.value}
                  onChange={(e) => handleDynamicInputChange(categoryKey, 'value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Enter value"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => saveField(categoryKey)}
                variant="primary"
                size="sm"
                disabled={!inputData.label.trim() || !inputData.value.trim()}
              >
                Save
              </Button>
              <Button
                onClick={() => toggleInputs(categoryKey)}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Saved Fields */}
        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field) => (
              <div key={field.id} className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg p-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-teal-800">{field.label}:</span>
                  <span className="text-sm text-teal-700 ml-2">{field.value}</span>
                </div>
                <button
                  onClick={() => deleteField(categoryKey, field.id)}
                  className="p-1 text-teal-600 hover:text-teal-700 hover:bg-teal-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4 pb-8">
      <div className="w-full max-w-4xl">
        {/* Back to Dashboard Link */}
        <div className="absolute top-4 left-4">
          <Link href={`/${locale}/dashboard/products`} className="text-teal-600 hover:text-teal-700 flex items-center gap-2">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product in 3 simple steps</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step.number 
                        ? "bg-teal-600 border-teal-600 text-white" 
                        : "bg-white border-gray-300 text-gray-500"
                    }`}>
                      {currentStep > step.number ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-medium">{step.number}</span>
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        currentStep > step.number ? "bg-teal-600" : "bg-gray-300"
                      }`} />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4">
              {steps.map((step) => (
                <div key={step.number} className="text-center flex-1">
                  <div className="flex flex-col items-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? "text-teal-600" : "text-gray-500"
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-8">
                <h2 className="text-xl font-semibold text-gray-900">Product Information</h2>
                
                {/* Basic Product Info */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter product description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Price
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Price Details</p>
                    <p className="text-sm text-gray-500">Includes 18% VAT, plus shipping costs</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Shipping</p>
                    <p className="text-sm text-blue-500">Shipping in 2-3 business days</p>
                  </div>
                </div>

                {/* Dynamic Fields Sections */}
                <div className="space-y-8">
                  {renderCategorySection("product-details", "Product Details")}
                  {renderCategorySection("dimensions", "Dimensions")}
                  {renderCategorySection("technical-information", "Technical Information")}
                  {renderCategorySection("other-information", "Other Information")}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Category Selection</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Subcategory
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange("subcategory", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select a subcategory</option>
                      {subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Images</h2>
                
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">Upload Product Images</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Drag and drop images here, or click to select files
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          Supported formats: JPG, PNG, GIF, WEBP (Max 10MB each)
                        </p>
                      </div>
                      <div>
                        <input
                          id="image-upload"
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all bg-teal-600 text-white shadow-xs hover:bg-teal-700 h-10 px-6">
                            Choose Images
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Images */}
                  {productImages.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Images ({productImages.length})</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {productImages.map((image) => (
                          <div key={image.id} className="relative group">
                            <Image
                              src={image.preview}
                              alt="Product preview"
                              width={128}
                              height={128}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => removeImage(image.id)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg">
                              {image.file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 text-center">
                {submitSuccess ? (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-gray-900">Your Product is Created!</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Congratulations! Your product &quot;{formData.name}&quot; has been successfully created and added to your store.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-gray-600">Product Details:</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.name}</p>
                      <p className="text-sm text-gray-600">€{formData.price}</p>
                      {formData.category && (
                        <p className="text-sm text-gray-600">
                          {selectedCategory ? selectedCategory.name : ''}
                          {formData.subcategory && (() => {
                            const sub = subcategories.find(s => s.id === formData.subcategory)
                            return sub ? ` > ${sub.name}` : ''
                          })()}
                        </p>
                      )}
                      {productImages.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {productImages.length} image{productImages.length !== 1 ? 's' : ''} uploaded
                        </p>
                      )}
                    </div>
                  </>
                ) : submitError ? (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <X className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-gray-900">Error Creating Product</h2>
                    <p className="text-red-600 max-w-md mx-auto">
                      {submitError}
                    </p>
                    
                    <div className="bg-red-50 p-4 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-red-600">
                        Please check your product information and try again. If the problem persists, contact support.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-gray-600" />
                      </div>
                    </div>
                    
                    <h2 className="text-2xl font-semibold text-gray-900">Ready to Create Product</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Review your product details below and click &quot;Create Product&quot; to add it to your store.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
                      <p className="text-sm text-gray-600">Product Details:</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formData.name}</p>
                      <p className="text-sm text-gray-600">€{formData.price}</p>
                      {formData.category && (
                        <p className="text-sm text-gray-600">
                          {selectedCategory ? selectedCategory.name : ''}
                          {formData.subcategory && (() => {
                            const sub = subcategories.find(s => s.id === formData.subcategory)
                            return sub ? ` > ${sub.name}` : ''
                          })()}
                        </p>
                      )}
                      {productImages.length > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          {productImages.length} image{productImages.length !== 1 ? 's' : ''} uploaded
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            {currentStep === 4 ? (
              submitSuccess ? (
                <Button
                  variant="primary"
                  onClick={() => router.push(`/${locale}/dashboard/products`)}
                  className="flex items-center gap-2"
                >
                  Back to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : submitError ? (
                    <>
                      Try Again
                      <Check className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Create Product
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button
                variant="primary"
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 