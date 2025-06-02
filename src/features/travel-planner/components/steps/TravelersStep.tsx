'use client'

import { useState } from 'react'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Users, ArrowRight, ArrowLeft, Minus, Plus } from 'lucide-react'

const ageGroupOptions = [
  { value: '10s', label: '10대', description: '10-19세' },
  { value: '20s', label: '20대', description: '20-29세' },
  { value: '30s', label: '30대', description: '30-39세' },
  { value: '40s', label: '40대', description: '40-49세' },
  { value: '50s', label: '50대', description: '50-59세' },
  { value: '60+', label: '60대 이상', description: '60세 이상' },
]

export function TravelersStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [travelers, setTravelers] = useState(planData.travelers || 1)
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<string[]>(planData.ageGroups || [])

  const handleTravelersChange = (delta: number) => {
    const newCount = Math.max(1, Math.min(20, travelers + delta))
    setTravelers(newCount)
  }

  const handleAgeGroupToggle = (ageGroup: string) => {
    setSelectedAgeGroups(prev => 
      prev.includes(ageGroup) 
        ? prev.filter(g => g !== ageGroup)
        : [...prev, ageGroup]
    )
  }

  const handleNext = () => {
    // 먼저 데이터 업데이트
    updatePlanData({
      travelers,
      ageGroups: selectedAgeGroups,
    })
    
    // 딜레이 후 다음 단계로 이동
    setTimeout(() => {
      setCurrentStep(6)
    }, 50)
  }

  const handlePrevious = () => {
    setCurrentStep(4)
  }

  const isValid = travelers >= 1 && travelers <= 20 && selectedAgeGroups.length > 0

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          몇 명이서 여행하시나요?
        </h2>
        <p className="text-gray-600">
          인원 수와 연령대를 알려주시면 더 적합한 장소를 추천해드려요.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              여행 인원
            </CardTitle>
            <CardDescription>
              총 몇 명이서 여행하시는지 알려주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleTravelersChange(-1)}
                disabled={travelers <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{travelers}</div>
                <div className="text-sm text-gray-500">명</div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleTravelersChange(1)}
                disabled={travelers >= 20}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                1명부터 20명까지 선택 가능합니다
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연령대</CardTitle>
            <CardDescription>
              여행하시는 분들의 연령대를 모두 선택해주세요. (중복 선택 가능)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ageGroupOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedAgeGroups.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedAgeGroups.includes(option.value)}
                    onCheckedChange={() => handleAgeGroupToggle(option.value)}
                  />
                  <div>
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {selectedAgeGroups.length === 0 && (
              <p className="text-sm text-red-500 mt-2">연령대를 하나 이상 선택해주세요</p>
            )}
          </CardContent>
        </Card>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{travelers}명</span>의 여행자 
            {selectedAgeGroups.length > 0 && (
              <span> ({selectedAgeGroups.map(age => 
                ageGroupOptions.find(opt => opt.value === age)?.label
              ).join(', ')})</span>
            )}
          </p>
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
            type="button"
            onClick={handleNext}
            disabled={!isValid}
            className="flex items-center gap-2"
          >
            다음 단계
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 