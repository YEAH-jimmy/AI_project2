'use client'

import { useState, useEffect, useRef } from 'react'
import { searchPlaces, type KakaoPlace } from '@/lib/kakao-map'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, Phone, ExternalLink, Loader2 } from 'lucide-react'

interface PlaceSearchProps {
  onPlaceSelect: (place: {
    name: string
    address: string
    lat: number
    lng: number
    phone?: string
    url?: string
  }) => void
  placeholder?: string
  defaultValue?: string
  className?: string
}

export function PlaceSearch({ 
  onPlaceSelect, 
  placeholder = "장소를 검색하세요...",
  defaultValue = "",
  className = ""
}: PlaceSearchProps) {
  const [query, setQuery] = useState(defaultValue)
  const [results, setResults] = useState<KakaoPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 검색 함수
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const places = await searchPlaces(searchQuery)
      setResults(places)
      setIsOpen(places.length > 0)
    } catch (error) {
      console.error('장소 검색 실패:', error)
      setResults([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 디바운스된 검색
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handlePlaceSelect = (place: KakaoPlace) => {
    onPlaceSelect({
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      phone: place.phone,
      url: place.place_url
    })
    setQuery(place.place_name)
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((place, index) => (
              <button
                key={`${place.id}-${index}`}
                onClick={() => handlePlaceSelect(place)}
                className="w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                      {place.place_name}
                    </h4>
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 line-clamp-1">
                      {place.category_name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {place.road_address_name || place.address_name}
                    </p>
                    {place.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-500">{place.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {isOpen && results.length === 0 && !isLoading && query.trim() && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center text-gray-500">
            <p className="text-sm">검색 결과가 없습니다.</p>
            <p className="text-xs mt-1">다른 키워드로 검색해보세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 