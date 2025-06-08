'use client'

import { useState } from 'react'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowRight, ArrowLeft, Plus, X } from 'lucide-react'

export function MustVisitStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [mustVisitPlaces, setMustVisitPlaces] = useState(planData.mustVisitPlaces || [])
  const [newPlace, setNewPlace] = useState('')

  const handleAddPlace = () => {
    if (newPlace.trim()) {
      setMustVisitPlaces(prev => [...prev, newPlace.trim()])
      setNewPlace('')
    }
  }

  const handleRemovePlace = (index: number) => {
    setMustVisitPlaces(prev => prev.filter((_, i) => i !== index))
  }

  const handleNext = () => {
    updatePlanData({
      mustVisitPlaces,
    })
    setCurrentStep(8)
  }

  const handlePrevious = () => {
    setCurrentStep(6)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddPlace()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          꼭 가고 싶은 곳이 있나요?
        </h2>
        <p className="text-gray-600">
          반드시 포함하고 싶은 장소가 있다면 알려주세요. (선택사항)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            필수 방문 장소
          </CardTitle>
          <CardDescription>
            특별히 가고 싶은 장소가 있다면 추가해주세요. 일정에 우선적으로 포함됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="예: 남산타워, 해운대 해수욕장, 경복궁..."
                value={newPlace}
                onChange={(e) => setNewPlace(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Button 
              type="button"
              onClick={handleAddPlace}
              disabled={!newPlace.trim()}
              size="icon"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {mustVisitPlaces.length > 0 && (
            <div className="space-y-2">
              <Label>추가된 장소들</Label>
              <div className="space-y-2">
                {mustVisitPlaces.map((place, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        {place}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePlace(index)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mustVisitPlaces.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">
                아직 추가된 장소가 없습니다.<br />
                특별히 가고 싶은 곳이 있다면 위에서 추가해주세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 팁</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 필수 방문 장소는 일정의 핵심이 되어 주변으로 경로가 구성됩니다</li>
          <li>• 너무 많이 추가하면 일정이 빡빡해질 수 있어요</li>
          <li>• 구체적인 장소명을 입력하면 더 정확한 일정을 만들 수 있습니다</li>
          <li>• 비워두셔도 AI가 훌륭한 장소들을 추천해드려요</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={handlePrevious}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          이전 단계
        </Button>
        
        <Button 
          onClick={handleNext}
          className="flex items-center gap-2"
        >
          다음 단계
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
} 