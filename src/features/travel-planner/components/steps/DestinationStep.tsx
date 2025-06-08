'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowRight, ArrowLeft, Search } from 'lucide-react'

const destinationSchema = z.object({
  destination: z.string().min(1, '여행지를 선택해주세요'),
})

type DestinationFormData = z.infer<typeof destinationSchema>

// 인기 여행지 데이터
const popularDestinations = [
  { name: '제주도', description: '아름다운 자연과 독특한 문화' },
  { name: '부산', description: '해변과 도시의 조화' },
  { name: '경주', description: '천년 고도의 역사와 문화' },
  { name: '강릉', description: '동해안의 아름다운 해변' },
  { name: '여수', description: '밤바다의 로맨틱한 풍경' },
  { name: '전주', description: '한옥마을과 맛있는 음식' },
  { name: '속초', description: '설악산과 바다의 만남' },
  { name: '가평', description: '수도권 근교의 자연휴양' },
  { name: '서울', description: '다양한 문화와 먹거리' },
  { name: '인천', description: '차이나타운과 송도' },
  { name: '대전', description: '과학의 도시' },
  { name: '대구', description: '패션과 문화의 도시' },
]

export function DestinationStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [selectedDestination, setSelectedDestination] = useState(planData.destination || '')
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    mode: 'onChange',
    defaultValues: {
      destination: planData.destination || '',
    }
  })

  const destinationValue = watch('destination')

  const onSubmit = (data: DestinationFormData) => {
    updatePlanData({
      destination: data.destination
    })
    setCurrentStep(3)
  }

  const handleDestinationSelect = (destination: string) => {
    setSelectedDestination(destination)
    setValue('destination', destination, { shouldValidate: true })
  }

  const handlePrevious = () => {
    setCurrentStep(1)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          어디로 여행을 떠나실 건가요?
        </h2>
        <p className="text-gray-600">
          여행하고 싶은 도시나 지역을 선택해주세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            여행지 선택
          </CardTitle>
          <CardDescription>
            직접 입력하시거나 인기 여행지에서 선택하실 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 직접 입력 */}
            <div className="space-y-2">
              <Label htmlFor="destination">여행지 입력</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="destination"
                  placeholder="예: 제주도, 부산, 경주, 서울..."
                  {...register('destination')}
                  className={`pl-9 ${errors.destination ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.destination && (
                <p className="text-sm text-red-500">{errors.destination.message}</p>
              )}
            </div>

            {/* 인기 여행지 선택 */}
            <div className="space-y-3">
              <Label>인기 여행지 빠른 선택</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {popularDestinations.map((dest) => (
                  <button
                    key={dest.name}
                    type="button"
                    onClick={() => handleDestinationSelect(dest.name)}
                    className={`p-3 text-left border rounded-lg transition-all hover:shadow-md ${
                      destinationValue === dest.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {dest.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {dest.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 선택된 여행지 표시 */}
            {destinationValue && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">선택한 여행지: {destinationValue}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  AI가 {destinationValue}의 최적 여행 코스를 추천해드릴게요!
                </p>
              </div>
            )}

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
                type="submit" 
                disabled={!isValid}
                className="flex items-center gap-2"
              >
                다음 단계
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 