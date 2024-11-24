'use client'

import React, { useState, useEffect } from 'react'
import { Globe, Filter, ChevronDown, ChevronRight, X, Search, MoreVertical, PieChart, Users, Paperclip, Heart, Store, TagIcon, Save, Edit2, Trash2, Package, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categoryHierarchy = {
  "Apparel & Accessories": {
    "Clothing": ["Tops", "Bottoms", "Dresses", "Outerwear"],
    "Shoes": ["Athletic", "Casual", "Formal"],
    "Accessories": ["Bags", "Jewelry", "Watches"]
  },
  "Electronics": {
    "Computers": ["Laptops", "Desktops", "Tablets"],
    "Mobile Devices": ["Smartphones", "Smartwatches"],
    "Audio": ["Headphones", "Speakers"]
  },
  "Home & Garden": {
    "Furniture": ["Living Room", "Bedroom", "Dining Room"],
    "Appliances": ["Kitchen", "Laundry"],
    "Decor": ["Wall Art", "Lighting", "Rugs"]
  }
}

const retailers = ["Target", "Walmart", "The Home Depot", "Lowes", "Dicks"]
const brands = ["Weber", "Traeger", "Nexgrill", "Scotts", "Kamado Joe"]

type SelectedCategory = {
  name: string
  path: string[]
}

type Segment = {
  id: string
  name: string
  filters: {
    categories: SelectedCategory[]
    retailers: string[]
    brands: string[]
  }
}

// Move initial states outside the component
const initialExpanded = {}
const initialSegments = []

export default function DashboardControlPanel() {
  const [globalCategoriesOpen, setGlobalCategoriesOpen] = useState(false)
  const [retailersOpen, setRetailersOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGlobalCategories, setSelectedGlobalCategories] = useState([])
  const [selectedRetailers, setSelectedRetailers] = useState([])
  const [expanded, setExpanded] = useState(initialExpanded)
  const [segments, setSegments] = useState(initialSegments)
  const [isLocalFilterOpen, setIsLocalFilterOpen] = useState(false)
  const [activeMenuItem, setActiveMenuItem] = useState('Market Share')
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null)
  const [segmentName, setSegmentName] = useState('')
  const [isEditingSegment, setIsEditingSegment] = useState(false)
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false)
  const [segmentStep, setSegmentStep] = useState(0)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSegments = localStorage.getItem('segments')
      if (savedSegments) {
        setSegments(JSON.parse(savedSegments))
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('segments', JSON.stringify(segments))
    }
  }, [segments])

  const handleSelectCategory = (category: SelectedCategory) => {
    setSelectedGlobalCategories(prev => {
      const existingIndex = prev.findIndex(sc => sc.path.join('.') === category.path.join('.'))
      if (existingIndex !== -1) {
        return prev.filter((_, index) => index !== existingIndex)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleRemoveCategory = (category: SelectedCategory) => {
    setSelectedGlobalCategories(prev => prev.filter(sc => sc.path.join('.') !== category.path.join('.')))
  }

  const handleSelectRetailer = (retailer: string) => {
    setSelectedRetailers(prev => 
      prev.includes(retailer) ? prev.filter(r => r !== retailer) : [...prev, retailer]
    )
  }

  const handleSelectBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const saveSegment = () => {
    if (segmentName.trim() === '') return

    const newSegment: Segment = {
      id: isEditingSegment && activeSegment ? activeSegment.id : Date.now().toString(),
      name: segmentName,
      filters: {
        categories: selectedGlobalCategories,
        retailers: selectedRetailers,
        brands: selectedBrands,
      }
    }

    if (isEditingSegment && activeSegment) {
      setSegments(prev => prev.map(seg => seg.id === activeSegment.id ? newSegment : seg))
    } else {
      setSegments(prev => [...prev, newSegment])
    }

    setActiveSegment(newSegment)
    setSegmentName('')
    setIsEditingSegment(false)
    setSegmentDialogOpen(false)
    setSegmentStep(0)
  }

  const applySegment = (segment: Segment) => {
    setSelectedGlobalCategories(segment.filters.categories)
    setSelectedRetailers(segment.filters.retailers)
    setSelectedBrands(segment.filters.brands)
    setActiveSegment(segment)
  }

  const clearSegment = () => {
    setSelectedGlobalCategories([])
    setSelectedRetailers([])
    setSelectedBrands([])
    setActiveSegment(null)
  }

  const deleteSegment = (segmentId: string) => {
    setSegments(prev => prev.filter(seg => seg.id !== segmentId))
    if (activeSegment && activeSegment.id === segmentId) {
      clearSegment()
    }
  }

  const editSegment = (segment: Segment) => {
    setSegmentName(segment.name)
    setSelectedGlobalCategories(segment.filters.categories)
    setSelectedRetailers(segment.filters.retailers)
    setSelectedBrands(segment.filters.brands)
    setIsEditingSegment(true)
    setActiveSegment(segment)
    setSegmentDialogOpen(true)
  }

  const CategoryTree: React.FC<{
    categories: any
    searchTerm: string
    level?: number
    path?: string[]
    selectedCategories: SelectedCategory[]
    onSelectCategory: (category: SelectedCategory) => void
    expanded: { [key: string]: boolean }
    setExpanded: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
  }> = ({ categories, searchTerm, level = 0, path = [], selectedCategories, onSelectCategory, expanded, setExpanded }) => {
    const toggleExpand = (category: string) => {
      setExpanded(prev => ({ ...prev, [path.concat(category).join('.')]: !prev[path.concat(category).join('.')] }))
    }

    const isSelected = (category: string) => {
      return selectedCategories.some(sc => sc.path.join('.') === path.concat(category).join('.'))
    }

    const matchesSearch = (category: string, subcategories: any): boolean => {
      const hasMatch = category.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (hasMatch && searchTerm) {
        setExpanded(prev => ({ ...prev, [path.concat(category).join('.')]: true }))
      }
      
      if (Array.isArray(subcategories)) {
        return hasMatch || subcategories.some(subcat => 
          subcat.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      const hasChildMatch = Object.entries(subcategories).some(([subcat, grandchildren]) => 
        matchesSearch(subcat, grandchildren)
      )
      
      if (hasChildMatch && searchTerm) {
        setExpanded(prev => ({ ...prev, [path.concat(category).join('.')]: true }))
      }
      
      return hasMatch || hasChildMatch
    }

    const highlightText = (text: string) => {
      if (!searchTerm) return text
      const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'))
      return parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
          ? <mark key={index} className="bg-yellow-500/50 text-white rounded px-0.5">{part}</mark> 
          : part
      )
    }

    return (
      <ul className={`pl-${level * 4} list-none`}>
        {Object.entries(categories).map(([category, subcategories]) => {
          const isExpanded = expanded[path.concat(category).join('.')]
          const shouldShow = !searchTerm || matchesSearch(category, subcategories)
          if (!shouldShow) return null
          return (
            <li key={category} className="mb-2 group">
              <div className="flex items-center">
                {!Array.isArray(subcategories) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={() => toggleExpand(category)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`ml-2 ${level === 0 ? 'font-semibold' : ''} ${
                    isSelected(category) ? 'bg-blue-600 text-white' : 'text-gray-300'
                  } hover:bg-blue-700 hover:text-white`}
                  onClick={() => onSelectCategory({ name: category, path: path.concat(category) })}
                >
                  {highlightText(category)}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              {!Array.isArray(subcategories) && isExpanded && (
                <CategoryTree 
                  categories={subcategories} 
                  searchTerm={searchTerm} 
                  level={level + 1} 
                  path={path.concat(category)}
                  selectedCategories={selectedCategories}
                  onSelectCategory={onSelectCategory}
                  expanded={expanded}
                  setExpanded={setExpanded}
                />
              )}
              {Array.isArray(subcategories) && (
                <ul className="pl-6 list-disc marker:text-gray-500">
                  {subcategories.map(subcat => (
                    <li key={subcat} className={`text-gray-300 ${
                      subcat.toLowerCase().includes(searchTerm.toLowerCase()) ? '' : 'hidden'
                    }`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`${
                          isSelected(subcat) ? 'bg-blue-600 text-white' : 'text-gray-300'
                        } hover:bg-blue-700 hover:text-white`}
                        onClick={() => onSelectCategory({ name: subcat, path: path.concat(category, subcat) })}
                      >
                        {highlightText(subcat)}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Global Filter Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 shadow-xl border-b border-indigo-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Corporate Brands Portal</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between bg-indigo-700 text-white border-indigo-600 hover:bg-indigo-600">
                <span className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Product Segment
                </span>
                {activeSegment && (
                  <Badge variant="secondary" className="ml-2 bg-indigo-500 text-white">
                    {activeSegment.name}
                  </Badge>
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border border-border" style={{ backgroundColor: 'hsl(224 71% 4%)' }}>
              <DropdownMenuItem 
                className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center px-3 py-2 transition-colors"
                onSelect={() => {
                  clearSegment()
                  setSegmentName('')
                  setIsEditingSegment(false)
                  setSegmentDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Product Segment
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center px-3 py-2 transition-colors"
                onSelect={clearSegment}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Segment
              </DropdownMenuItem>
              {segments.map((segment) => (
                <DropdownMenuItem 
                  key={segment.id} 
                  className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between px-3 py-2 transition-colors group"
                  onSelect={() => applySegment(segment)}
                >
                  <span>{segment.name}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        editSegment(segment)
                      }}
                      title="Edit segment"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSegment(segment.id)
                      }}
                      title="Delete segment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area with Side Navigation */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical Side Navigation */}
        <nav className="w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex flex-col border-r border-border">
          {[
            { name: 'Market Share', icon: PieChart },
            { name: 'Shopper Insights', icon: Users },
            { name: 'Attachment', icon: Paperclip },
            { name: 'Loyalty', icon: Heart },
          ].map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="justify-start mb-2 hover:bg-indigo-500/10 data-[state=active]:bg-indigo-500/20"
              onClick={() => setActiveMenuItem(item.name)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex-1 pl-4 overflow-hidden flex flex-col">
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedGlobalCategories.map((category, index) => (
                <Badge key={`category-${index}`} className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors">
                  {category.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-blue-700"
                    onClick={() => handleRemoveCategory(category)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {selectedRetailers.map((retailer, index) => (
                <Badge key={`retailer-${index}`} className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors">
                  {retailer}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-green-700"
                    onClick={() => handleSelectRetailer(retailer)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {selectedBrands.map((brand, index) => (
                <Badge key={`brand-${index}`} className="bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors">
                  {brand}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-purple-700"
                    onClick={() => handleSelectBrand(brand)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            {/* Step content */}
            <ScrollArea className="flex-1">
              <h2 className="text-2xl font-bold mb-4 text-white">{activeMenuItem}</h2>
              <p className="text-gray-300">Your main dashboard content for {activeMenuItem} goes here. It will be affected by both global and local filters.</p>
              {(selectedGlobalCategories.length > 0 || selectedRetailers.length > 0 || selectedBrands.length > 0) && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-white">Applied Global Filters:</h3>
                  {selectedGlobalCategories.length > 0 && (
                    <>
                      <h4 className="text-md font-medium text-white mt-2">Categories:</h4>
                      <ul className="list-disc list-inside text-gray-300">
                        {selectedGlobalCategories.map((category, index) => (
                          <li key={index}>{category.name}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {selectedRetailers.length > 0 && (
                    <>
                      <h4 className="text-md font-medium text-white mt-2">Retailers:</h4>
                      <ul className="list-disc list-inside text-gray-300">
                        {selectedRetailers.map((retailer, index) => (
                          <li key={index}>{retailer}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {selectedBrands.length > 0 && (
                    <>
                      <h4 className="text-md font-medium text-white mt-2">Brands:</h4>
                      <ul className="list-disc list-inside text-gray-300">
                        {selectedBrands.map((brand, index) => (
                          <li key={index}>{brand}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </main>
      </div>

      {/* Product Segment Dialog */}
      <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[600px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle>{isEditingSegment ? 'Edit Product Segment' : 'Create New Product Segment'}</DialogTitle>
            <Input
              type="text"
              placeholder="Enter segment name"
              value={segmentName}
              onChange={(e) => setSegmentName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 mt-2"
            />
          </DialogHeader>
          <div className="flex">
            {/* Left vertical nav */}
            <div className="w-48 border-r border-gray-700 pr-4">
              <ul className="space-y-2">
                {['Categories', 'Retailers', 'Brands'].map((step, index) => (
                  <li key={step}>
                    <Button
                      variant={segmentStep === index ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSegmentStep(index)}
                    >
                      {step}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Main content area */}
            <div className="flex-1 pl-4">
              <div className="space-y-4">
                {segmentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Categories</h3>
                    <div className="relative mb-4">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <CategoryTree
                      categories={categoryHierarchy}
                      searchTerm={searchTerm}
                      selectedCategories={selectedGlobalCategories}
                      onSelectCategory={handleSelectCategory}
                      expanded={expanded}
                      setExpanded={setExpanded}
                    />
                  </div>
                )}
                {segmentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Retailers</h3>
                    {retailers.map((retailer) => (
                      <div key={retailer} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`retailer-${retailer}`}
                          checked={selectedRetailers.includes(retailer)}
                          onCheckedChange={() => handleSelectRetailer(retailer)}
                        />
                        <label htmlFor={`retailer-${retailer}`}>{retailer}</label>
                      </div>
                    ))}
                  </div>
                )}
                {segmentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Brands</h3>
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => handleSelectBrand(brand)}
                        />
                        <label htmlFor={`brand-${brand}`}>{brand}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Navigation buttons */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => setSegmentStep(prev => Math.max(0, prev - 1))}
                  disabled={segmentStep === 0}
                >
                  Previous
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setSegmentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => setSegmentStep(prev => prev + 1)}
                    disabled={!segmentName.trim()}
                  >
                    Next
                  </Button>
                  <Button
                    variant="default"
                    onClick={saveSegment}
                    disabled={!segmentName.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save & Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
