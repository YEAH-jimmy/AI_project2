'use client'

import { useState } from 'react'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Heart, 
  ArrowRight, 
  ArrowLeft, 
  UtensilsCrossed, 
  Mountain, 
  Camera, 
  ShoppingBag,
  Building,
  Waves,
  TreePine,
  Palette,
  Coffee,
  Music
} from 'lucide-react'

const interestOptions = [
  { value: 'food', label: '음식', icon: UtensilsCrossed, description: '맛집, 로컬 음식, 카페' },
  { value: 'nature', label: '자연', icon: TreePine, description: '산, 바다, 공원, 풍경' },
  { value: 'culture', label: '문화/역사', icon: Building, description: '박물관, 사찰, 유적지' },
  { value: 'shopping', label: '쇼핑', icon: ShoppingBag, description: '시장, 백화점, 아울렛' },
  { value: 'photo', label: '사진명소', icon: Camera, description: '인생샷, SNS 명소' },
  { value: 'beach', label: '해변/바다', icon: Waves, description: '해수욕장, 해안드라이브' },
  { value: 'mountain', label: '산/등산', icon: Mountain, description: '하이킹, 트레킹, 케이블카' },
  { value: 'art', label: '예술', icon: Palette, description: '갤러리, 전시회, 공연' },
  { value: 'cafe', label: '카페/디저트', icon: Coffee, description: '감성카페, 디저트 맛집' },
  { value: 'nightlife', label: '나이트라이프', icon: Music, description: '바, 클럽, 야경' },
]

export function InterestsStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [selectedInterests, setSelectedInterests] = useState<string[]>(planData.interests || [])

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  const handleNext = () => {
    // 먼저 데이터 업데이트
    updatePlanData({
      interests: selectedInterests,
    })
    
    // 딜레이 후 다음 단계로 이동 
    setTimeout(() => {
      setCurrentStep(7)
    }, 50)
  }

  const handlePrevious = () => {
    setCurrentStep(5)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          어떤 것에 관심이 있으신가요?
        </h2>
        <p className="text-gray-600">
          관심사를 선택하시면 취향에 맞는 장소와 활동을 추천해드려요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5" />
            관심사 선택
          </CardTitle>
          <CardDescription>
            여러 개를 선택하셔도 됩니다. 선택이 많을수록 더 다양한 추천을 받을 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {interestOptions.map((option) => {
              const Icon = option.icon
              return (
                <label
                  key={option.value}
                  className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedInterests.includes(option.value)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedInterests.includes(option.value)}
                    onCheckedChange={() => handleInterestToggle(option.value)}
                    className="sr-only"
                  />
                  <Icon className={`w-8 h-8 mb-2 ${
                    selectedInterests.includes(option.value) ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <div className="text-center">
                    <div className="font-medium text-sm text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>

          {selectedInterests.length === 0 && (
            <div className="text-center mt-6 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700">
                💡 관심사를 선택하지 않으면 일반적인 관광 명소 위주로 추천됩니다.
              </p>
            </div>
          )}

          {selectedInterests.length > 0 && (
            <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                선택한 관심사: <span className="font-semibold">
                  {selectedInterests.map(interest => 
                    interestOptions.find(opt => opt.value === interest)?.label
                  ).join(', ')}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">🎯 맞춤 추천의 힘</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>음식</strong>: 현지 맛집과 유명 음식점을 우선 추천</li>
          <li>• <strong>자연</strong>: 산, 바다, 공원 등 자연 명소 중심</li>
          <li>• <strong>문화</strong>: 박물관, 역사 유적지, 전통 문화 체험</li>
          <li>• <strong>사진명소</strong>: 인스타그램 핫플레이스와 뷰포인트</li>
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
          type="button"
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