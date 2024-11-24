'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Globe, Filter, ChevronDown, ChevronRight, X, Search, MoreVertical, PieChart, Users, Paperclip, Heart, Store, TagIcon, Save, Edit2, Trash2, Package, Plus, Sparkles } from 'lucide-react'
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
import MarketShareChart from './components/MarketShareChart';

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

// Combined filter colors for both product and demographic segments
const FILTER_COLORS = {
  // Product segment colors
  categories: "bg-blue-500/20 text-blue-200 hover:bg-blue-500/30",
  retailers: "bg-green-500/20 text-green-200 hover:bg-green-500/30",
  brands: "bg-purple-500/20 text-purple-200 hover:bg-purple-500/30",
  
  // Demographic segment colors
  age: "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30",
  region: "bg-rose-500/20 text-rose-200 hover:bg-rose-500/30",
  gender: "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30",
  incomeBracket: "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
};

// Add these new constants for demographic data
const demographicData = {
  age: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
  region: ["Northeast", "Southeast", "Midwest", "Southwest", "West"],
  gender: ["Male", "Female", "Non-binary", "Other"],
  incomeBracket: ["Under $25k", "$25k-$49k", "$50k-$74k", "$75k-$99k", "$100k-$149k", "$150k+"]
};

// Add new types
type DemographicSegment = {
  id: string
  name: string
  filters: {
    age: string[]
    region: string[]
    gender: string[]
    incomeBracket: string[]
  }
}

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
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [demographicSegments, setDemographicSegments] = useState<DemographicSegment[]>([]);
  const [selectedAge, setSelectedAge] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedIncomeBrackets, setSelectedIncomeBrackets] = useState<string[]>([]);
  const [activeDemographicSegment, setActiveDemographicSegment] = useState<DemographicSegment | null>(null);
  const [isDemographicSegmentDialogOpen, setIsDemographicSegmentDialogOpen] = useState(false);
  const [demographicSegmentName, setDemographicSegmentName] = useState('');
  const [isEditingDemographicSegment, setIsEditingDemographicSegment] = useState(false);
  const [demographicSegmentStep, setDemographicSegmentStep] = useState(0);

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

  const handleSearchTermChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    
    if (!newSearchTerm) {
      setExpandedPaths(new Set());
      return;
    }

    const newExpandedPaths = new Set<string>();
    
    const expandMatchingPaths = (obj: any, currentPath: string[] = []) => {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = [...currentPath, key];
        if (key.toLowerCase().includes(newSearchTerm.toLowerCase())) {
          // Add all parent paths
          let pathStr = '';
          newPath.forEach(segment => {
            pathStr = pathStr ? `${pathStr}.${segment}` : segment;
            newExpandedPaths.add(pathStr);
          });
        }
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Always traverse deeper regardless of match
          expandMatchingPaths(value, newPath);
          
          // If any children match, expand the parent
          if (Object.entries(value).some(([childKey, childValue]) => {
            if (typeof childValue === 'string') {
              return childValue.toLowerCase().includes(newSearchTerm.toLowerCase());
            }
            if (Array.isArray(childValue)) {
              return childValue.some(item => 
                item.toLowerCase().includes(newSearchTerm.toLowerCase())
              );
            }
            return childKey.toLowerCase().includes(newSearchTerm.toLowerCase());
          })) {
            let pathStr = newPath.join('.');
            newExpandedPaths.add(pathStr);
          }
        } else if (Array.isArray(value)) {
          // Check leaf nodes (array items)
          if (value.some(item => 
            item.toLowerCase().includes(newSearchTerm.toLowerCase())
          )) {
            let pathStr = newPath.join('.');
            newExpandedPaths.add(pathStr);
          }
        }
      });
    };

    expandMatchingPaths(categoryHierarchy);
    setExpandedPaths(newExpandedPaths);
  };

  const CategoryTree: React.FC<{
    categories: any;
    searchTerm: string;
    level?: number;
    path?: string[];
    selectedCategories: SelectedCategory[];
    onSelectCategory: (category: SelectedCategory) => void;
    expandedPaths: Set<string>;
    setExpandedPaths: (paths: Set<string>) => void;
  }> = ({ 
    categories, 
    searchTerm, 
    level = 0, 
    path = [], 
    selectedCategories, 
    onSelectCategory,
    expandedPaths,
    setExpandedPaths
  }) => {
    const isSelected = (category: string) => {
      return selectedCategories.some(sc => sc.path.join('.') === path.concat(category).join('.'));
    };

    const shouldShowItem = (category: string, subcategories: any): boolean => {
      const matchesSearch = !searchTerm || 
        category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (matchesSearch) return true;
      
      if (Array.isArray(subcategories)) {
        return subcategories.some(subcat => 
          subcat.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return Object.entries(subcategories).some(([subcat, grandchildren]) => 
        shouldShowItem(subcat, grandchildren)
      );
    };

    const highlightText = (text: string) => {
      if (!searchTerm) return text;
      
      // Use case-insensitive search term
      const searchRegex = new RegExp(`(${searchTerm})`, 'gi');
      const parts = text.split(searchRegex);
      
      return parts.map((part, index) => 
        part.toLowerCase() === searchTerm.toLowerCase() 
          ? <mark key={index} className="bg-yellow-500/50 text-white">{part}</mark> 
          : part
      );
    };

    const toggleExpand = (path: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newExpandedPaths = new Set(expandedPaths);
      if (newExpandedPaths.has(path)) {
        newExpandedPaths.delete(path);
      } else {
        newExpandedPaths.add(path);
      }
      setExpandedPaths(newExpandedPaths);
    };

    return (
      <ul className={`pl-${level * 4} list-none`}>
        {Object.entries(categories).map(([category, subcategories]) => {
          const currentPath = path.concat(category).join('.');
          const isExpanded = expandedPaths.has(currentPath);
          
          if (!shouldShowItem(category, subcategories)) return null;
          
          return (
            <li key={category} className="mb-2 group">
              <div className="flex items-center">
                {!Array.isArray(subcategories) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-700"
                    onClick={(e) => toggleExpand(currentPath, e)}
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
              </div>
              {!Array.isArray(subcategories) && isExpanded && (
                <CategoryTree 
                  categories={subcategories}
                  searchTerm={searchTerm}
                  level={level + 1}
                  path={path.concat(category)}
                  selectedCategories={selectedCategories}
                  onSelectCategory={onSelectCategory}
                  expandedPaths={expandedPaths}
                  setExpandedPaths={setExpandedPaths}
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
          );
        })}
      </ul>
    );
  };

  // Add handlers for demographic selections
  const handleSelectAge = (age: string) => {
    setSelectedAge(prev => 
      prev.includes(age) ? prev.filter(a => a !== age) : [...prev, age]
    );
  };

  const handleSelectRegion = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const handleSelectGender = (gender: string) => {
    setSelectedGenders(prev => 
      prev.includes(gender) ? prev.filter(g => g !== gender) : [...prev, gender]
    );
  };

  const handleSelectIncomeBracket = (bracket: string) => {
    setSelectedIncomeBrackets(prev => 
      prev.includes(bracket) ? prev.filter(b => b !== bracket) : [...prev, bracket]
    );
  };

  // Add save/edit/delete handlers for demographic segments
  const saveDemographicSegment = () => {
    if (demographicSegmentName.trim() === '') return;

    const newSegment: DemographicSegment = {
      id: isEditingDemographicSegment && activeDemographicSegment 
        ? activeDemographicSegment.id 
        : Date.now().toString(),
      name: demographicSegmentName,
      filters: {
        age: selectedAge,
        region: selectedRegions,
        gender: selectedGenders,
        incomeBracket: selectedIncomeBrackets
      }
    };

    if (isEditingDemographicSegment && activeDemographicSegment) {
      setDemographicSegments(prev => 
        prev.map(seg => seg.id === activeDemographicSegment.id ? newSegment : seg)
      );
    } else {
      setDemographicSegments(prev => [...prev, newSegment]);
    }

    setActiveDemographicSegment(newSegment);
    setDemographicSegmentName('');
    setIsEditingDemographicSegment(false);
    setIsDemographicSegmentDialogOpen(false);
    setDemographicSegmentStep(0);
  };

  // Add this function to your DashboardControlPanel component
  const clearDemographicSegment = () => {
    setSelectedAge([]);
    setSelectedRegions([]);
    setSelectedGenders([]);
    setSelectedIncomeBrackets([]);
    setActiveDemographicSegment(null);
  };

  // First, add a new function to generate segment names
  const generateSegmentName = async () => {
    // First, check if we have any filters selected
    if (selectedGlobalCategories.length === 0 && 
        selectedRetailers.length === 0 && 
        selectedBrands.length === 0) {
      console.log('No filters selected');
      return;
    }

    try {
      // Prepare the filters
      const categories = selectedGlobalCategories.map(cat => cat.name).join(', ');
      const retailers = selectedRetailers.join(', ');
      const brands = selectedBrands.join(', ');

      // Log what we're sending
      console.log('Sending filters:', { categories, retailers, brands });

      // Make the API call
      const response = await fetch('/api/generate-segment-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Categories: ${categories}\nRetailers: ${retailers}\nBrands: ${brands}`
        })
      });

      // Check if the response is ok
      if (!response.ok) {
        console.log('API response not ok:', response.status, response.statusText);
        return;
      }

      // Parse the response
      const data = await response.json();
      console.log('Received data:', data);

      // Update the segment name if we got one
      if (data.name) {
        setSegmentName(data.name);
      }
    } catch (err) {
      // Log any errors
      console.log('Error generating name:', err);
    }
  };

  // Add the generate name function for Customer Profiles
  const generateCustomerProfileName = async () => {
    try {
      const filters = {
        age: selectedAge,
        region: selectedRegions,
        gender: selectedGenders,
        incomeBracket: selectedIncomeBrackets
      };

      // Skip if no filters selected
      if (Object.values(filters).every(arr => arr.length === 0)) {
        console.log('No filters selected, skipping name generation');
        return;
      }

      const prompt = `Generate a short, professional customer profile name (2-4 words) for a demographic segment with these characteristics:
      Age Groups: ${filters.age.join(', ')}
      Regions: ${filters.region.join(', ')}
      Gender: ${filters.gender.join(', ')}
      Income Brackets: ${filters.incomeBracket.join(', ')}
      
      The name should be concise and business-appropriate. Just return the name without quotes or explanation.`;

      console.log('Sending request to API...');
      const response = await fetch('/api/generate-profile-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API response not ok:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received response:', data);

      if (data.name) {
        setDemographicSegmentName(data.name);
      } else {
        console.error('No name in response:', data);
      }
    } catch (error) {
      console.error('Detailed error in generateCustomerProfileName:', {
        error,
        message: error.message,
        stack: error.stack
      });
    }
  };

  // Add these new functions near your other demographic-related functions:
  const applyDemographicSegment = (segment: DemographicSegment) => {
    setSelectedAge(segment.filters.age);
    setSelectedRegions(segment.filters.region);
    setSelectedGenders(segment.filters.gender);
    setSelectedIncomeBrackets(segment.filters.incomeBracket);
    setActiveDemographicSegment(segment);
  };

  const editDemographicSegment = (segment: DemographicSegment) => {
    setDemographicSegmentName(segment.name);
    setSelectedAge(segment.filters.age);
    setSelectedRegions(segment.filters.region);
    setSelectedGenders(segment.filters.gender);
    setSelectedIncomeBrackets(segment.filters.incomeBracket);
    setIsEditingDemographicSegment(true);
    setActiveDemographicSegment(segment);
    setIsDemographicSegmentDialogOpen(true);
  };

  const deleteDemographicSegment = (segmentId: string) => {
    setDemographicSegments(prev => prev.filter(seg => seg.id !== segmentId));
    if (activeDemographicSegment && activeDemographicSegment.id === segmentId) {
      clearDemographicSegment();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100">
      {/* Global Filter Header */}
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 shadow-xl border-b border-indigo-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Corporate Brands Portal</h1>
          
          {/* Product Segment Dropdown */}
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

          {/* Customer Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="justify-between bg-indigo-700 text-white border-indigo-600 hover:bg-indigo-600">
                <span className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Customer Profile
                </span>
                {activeDemographicSegment && (
                  <Badge variant="secondary" className="ml-2 bg-indigo-500 text-white">
                    {activeDemographicSegment.name}
                  </Badge>
                )}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-background border border-border" style={{ backgroundColor: 'hsl(224 71% 4%)' }}>
              <DropdownMenuItem 
                className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center px-3 py-2 transition-colors"
                onSelect={() => {
                  clearDemographicSegment();
                  setDemographicSegmentName('');
                  setIsEditingDemographicSegment(false);
                  setIsDemographicSegmentDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Customer Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center px-3 py-2 transition-colors"
                onSelect={clearDemographicSegment}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Profile
              </DropdownMenuItem>
              {demographicSegments.map((segment) => (
                <DropdownMenuItem 
                  key={segment.id} 
                  className="hover:bg-indigo-600 hover:text-white cursor-pointer flex items-center justify-between px-3 py-2 transition-colors group"
                  onSelect={() => applyDemographicSegment(segment)}
                >
                  <span>{segment.name}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-blue-600 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        editDemographicSegment(segment);
                      }}
                      title="Edit profile"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDemographicSegment(segment.id);
                      }}
                      title="Delete profile"
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
              
              {activeMenuItem === 'Market Share' ? (
                <div className="w-full">
                  <MarketShareChart 
                    selectedCategories={selectedGlobalCategories}
                    selectedRetailers={selectedRetailers}
                    selectedBrands={selectedBrands}
                    selectedAge={selectedAge}
                    selectedRegions={selectedRegions}
                    selectedGenders={selectedGenders}
                    selectedIncomeBrackets={selectedIncomeBrackets}
                  />
                </div>
              ) : (
                <p className="text-gray-300">Your main dashboard content for {activeMenuItem} goes here. It will be affected by both global and local filters.</p>
              )}

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
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter segment name"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 mt-2"
              />
              <Button
                variant="outline"
                size="icon"
                className="mt-2"
                onClick={generateSegmentName}
                title="Generate name suggestion"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {/* Add the filter pills section here */}
          <div className="border-t border-gray-700 pt-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedGlobalCategories.map((category, index) => (
                <Badge 
                  key={`category-${index}`} 
                  className={`${FILTER_COLORS.categories} transition-colors`}
                >
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
                <Badge 
                  key={`retailer-${index}`} 
                  className={`${FILTER_COLORS.retailers} transition-colors`}
                >
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
                <Badge 
                  key={`brand-${index}`} 
                  className={`${FILTER_COLORS.brands} transition-colors`}
                >
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
            {(selectedGlobalCategories.length === 0 && 
              selectedRetailers.length === 0 && 
              selectedBrands.length === 0) && (
              <p className="text-gray-400 text-sm">
                No filters selected. Add filters from the sections below.
              </p>
            )}
          </div>

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
                        onChange={(e) => handleSearchTermChange(e.target.value)}
                        className="pl-8 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <CategoryTree
                      categories={categoryHierarchy}
                      searchTerm={searchTerm}
                      selectedCategories={selectedGlobalCategories}
                      onSelectCategory={handleSelectCategory}
                      expandedPaths={expandedPaths}
                      setExpandedPaths={setExpandedPaths}
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

      {/* Demographics Segment Dialog */}
      <Dialog open={isDemographicSegmentDialogOpen} onOpenChange={setIsDemographicSegmentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[600px] bg-background border border-border">
          <DialogHeader>
            <DialogTitle>
              {isEditingDemographicSegment ? 'Edit Customer Profile' : 'Create New Customer Profile'}
            </DialogTitle>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter profile name"
                value={demographicSegmentName}
                onChange={(e) => setDemographicSegmentName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 mt-2"
              />
              <Button
                variant="outline"
                size="icon"
                className="mt-2"
                onClick={generateCustomerProfileName}
                title="Generate name suggestion"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Filter Pills */}
          <div className="border-t border-gray-700 pt-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {/* Age Pills */}
              {selectedAge.map((age, index) => (
                <Badge key={`age-${index}`} className={FILTER_COLORS.age}>
                  {age}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-amber-700"
                    onClick={() => handleSelectAge(age)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {/* Region Pills */}
              {selectedRegions.map((region, index) => (
                <Badge key={`region-${index}`} className={FILTER_COLORS.region}>
                  {region}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-rose-700"
                    onClick={() => handleSelectRegion(region)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {/* Gender Pills */}
              {selectedGenders.map((gender, index) => (
                <Badge key={`gender-${index}`} className={FILTER_COLORS.gender}>
                  {gender}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-cyan-700"
                    onClick={() => handleSelectGender(gender)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}

              {/* Income Bracket Pills */}
              {selectedIncomeBrackets.map((bracket, index) => (
                <Badge key={`income-${index}`} className={FILTER_COLORS.incomeBracket}>
                  {bracket}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-4 w-4 p-0 hover:bg-emerald-700"
                    onClick={() => handleSelectIncomeBracket(bracket)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            
            {/* Show message if no filters selected */}
            {(selectedAge.length === 0 && 
              selectedRegions.length === 0 && 
              selectedGenders.length === 0 && 
              selectedIncomeBrackets.length === 0) && (
              <p className="text-gray-400 text-sm">
                No filters selected. Add filters from the sections below.
              </p>
            )}
          </div>

          {/* Left Navigation and Content Area */}
          <div className="flex">
            <div className="w-48 border-r border-gray-700 pr-4">
              <ul className="space-y-2">
                {['Age', 'Region', 'Gender', 'Income Bracket'].map((step, index) => (
                  <li key={step}>
                    <Button
                      variant={demographicSegmentStep === index ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setDemographicSegmentStep(index)}
                    >
                      {step}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 pl-4">
              <div className="space-y-4">
                {demographicSegmentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Age Groups</h3>
                    {demographicData.age.map((age) => (
                      <div key={age} className="flex items-center space-x-2">
                        <Checkbox
                          id={`age-${age}`}
                          checked={selectedAge.includes(age)}
                          onCheckedChange={() => handleSelectAge(age)}
                        />
                        <label htmlFor={`age-${age}`} className="text-gray-200">{age}</label>
                      </div>
                    ))}
                  </div>
                )}
                {demographicSegmentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Regions</h3>
                    {demographicData.region.map((region) => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={`region-${region}`}
                          checked={selectedRegions.includes(region)}
                          onCheckedChange={() => handleSelectRegion(region)}
                        />
                        <label htmlFor={`region-${region}`} className="text-gray-200">{region}</label>
                      </div>
                    ))}
                  </div>
                )}
                {demographicSegmentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Gender</h3>
                    {demographicData.gender.map((gender) => (
                      <div key={gender} className="flex items-center space-x-2">
                        <Checkbox
                          id={`gender-${gender}`}
                          checked={selectedGenders.includes(gender)}
                          onCheckedChange={() => handleSelectGender(gender)}
                        />
                        <label htmlFor={`gender-${gender}`} className="text-gray-200">{gender}</label>
                      </div>
                    ))}
                  </div>
                )}
                {demographicSegmentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Select Income Brackets</h3>
                    {demographicData.incomeBracket.map((bracket) => (
                      <div key={bracket} className="flex items-center space-x-2">
                        <Checkbox
                          id={`income-${bracket}`}
                          checked={selectedIncomeBrackets.includes(bracket)}
                          onCheckedChange={() => handleSelectIncomeBracket(bracket)}
                        />
                        <label htmlFor={`income-${bracket}`} className="text-gray-200">{bracket}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setDemographicSegmentStep(prev => Math.max(0, prev - 1))}
              disabled={demographicSegmentStep === 0}
            >
              Previous
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDemographicSegmentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setDemographicSegmentStep(prev => prev + 1)}
                disabled={!demographicSegmentName.trim()}
              >
                Next
              </Button>
              <Button
                variant="default"
                onClick={saveDemographicSegment}
                disabled={!demographicSegmentName.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save & Apply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
