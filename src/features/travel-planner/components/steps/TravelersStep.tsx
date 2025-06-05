'use client'

import { useState } from 'react'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ArrowRight, ArrowLeft, Minus, Plus } from 'lucide-react'

const ageGroupOptions = [
  { value: '10s', label: '10대', description: '10-19세' },
  { value: '20s', label: '20대', description: '20-29세' },
  { value: '30s', label: '30대', description: '30-39세' },
  { value: '40s', label: '40대', description: '40-49세' },
  { value: '50s', label: '50대', description: '50-59세' },
  { value: '60+', label: '60대 이상', description: '60세 이상' },
]

type AgeGroupCounts = {
  [key: string]: number
}

export function TravelersStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  
  // 연령대별 인원 수 상태 관리
  const [ageGroupCounts, setAgeGroupCounts] = useState<AgeGroupCounts>(() => {
    // 기존 데이터가 있으면 복원, 없으면 빈 객체
    if (planData.ageGroupCounts) {
      return planData.ageGroupCounts
    }
    return {}
  })

  // 총 인원 계산
  const totalTravelers = Object.values(ageGroupCounts).reduce((sum, count) => sum + count, 0)

  const handleAgeGroupCountChange = (ageGroup: string, delta: number) => {
    setAgeGroupCounts(prev => {
      const currentCount = prev[ageGroup] || 0
      const newCount = Math.max(0, Math.min(20, currentCount + delta))
      
      if (newCount === 0) {
        // 0이면 해당 연령대 제거
        const { [ageGroup]: removed, ...rest } = prev
        return rest
      } else {
        // 새로운 개수 설정
        return { ...prev, [ageGroup]: newCount }
      }
    })
  }

  const handleNext = () => {
    // 선택된 연령대들만 필터링
    const selectedAgeGroups = Object.keys(ageGroupCounts).filter(key => ageGroupCounts[key] > 0)
    
    updatePlanData({
      travelers: totalTravelers,
      ageGroups: selectedAgeGroups,
      ageGroupCounts: ageGroupCounts, // 연령대별 상세 인원 수 저장
    })
    
    setTimeout(() => {
      setCurrentStep(6)
    }, 50)
  }

  const handlePrevious = () => {
    setCurrentStep(4)
  }

  const handleRestart = () => {
    // 처음부터 다시 시작
    setCurrentStep(1)
  }

  const isValid = totalTravelers >= 1 && totalTravelers <= 20

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          몇 명이서 여행하시나요?
        </h2>
        <p className="text-gray-600">
          연령대별 인원 수를 상세히 입력해주시면 더 적합한 장소를 추천해드려요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            연령대별 인원 설정
          </CardTitle>
          <CardDescription>
            각 연령대별로 몇 명인지 설정해주세요. 총 20명까지 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 연령대별 선택 */}
          <div className="space-y-4">
            {ageGroupOptions.map((option) => {
              const count = ageGroupCounts[option.value] || 0
              return (
                <div
                  key={option.value}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleAgeGroupCountChange(option.value, -1)}
                      disabled={count <= 0}
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="text-center min-w-[2rem]">
                      <span className="text-xl font-bold text-blue-600">
                        {count}
                      </span>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleAgeGroupCountChange(option.value, 1)}
                      disabled={totalTravelers >= 20}
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* 에러 메시지 */}
          {totalTravelers === 0 && (
            <div className="text-center p-3 text-red-500 text-sm">
              최소 1명 이상의 연령대를 선택해주세요
            </div>
          )}
          
          {totalTravelers > 20 && (
            <div className="text-center p-3 text-red-500 text-sm">
              최대 20명까지만 가능합니다
            </div>
          )}

          {/* 여행자 요약 */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">여행자 요약</h3>
            <div className="text-2xl font-bold text-blue-600 mb-3">
              총 {totalTravelers}명
            </div>
            {totalTravelers > 0 && (
              <div className="text-sm text-gray-600 space-y-1">
                {Object.entries(ageGroupCounts)
                  .filter(([_, count]) => count > 0)
                  .map(([ageGroup, count]) => {
                    const option = ageGroupOptions.find(opt => opt.value === ageGroup)
                    return (
                      <div key={ageGroup} className="flex justify-center items-center gap-2">
                        <span>{option?.label}:</span>
                        <span className="font-medium">{count}명</span>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* 버튼들 */}
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
        </CardContent>
      </Card>

      {/* 처음부터 다시 시작하기 */}
      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleRestart}
          className="text-blue-600 hover:text-blue-700"
        >
          처음부터 다시 시작하기
        </Button>
      </div>
    </div>
  )
} 