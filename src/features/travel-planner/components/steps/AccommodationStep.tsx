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
import { Home, ArrowRight, ArrowLeft, MapPin } from 'lucide-react'
import { PlaceSearch } from '../PlaceSearch'

const accommodationSchema = z.object({
  accommodationAddress: z.string().optional(),
  accommodationType: z.enum(['hotel', 'airbnb', 'guesthouse', 'resort', 'other']),
})

type AccommodationFormData = z.infer<typeof accommodationSchema>

const accommodationTypes = [
  { value: 'hotel', label: '호텔', description: '편안한 서비스와 시설' },
  { value: 'airbnb', label: '에어비앤비', description: '현지인처럼 머물기' },
  { value: 'guesthouse', label: '게스트하우스', description: '저렴하고 소셜한 분위기' },
  { value: 'resort', label: '리조트', description: '휴양과 레저 활동' },
  { value: 'other', label: '기타', description: '펜션, 모텔 등' },
]

export function AccommodationStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [accommodationCoordinates, setAccommodationCoordinates] = useState<{
    lat: number
    lng: number
  } | null>(null)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<AccommodationFormData>({
    resolver: zodResolver(accommodationSchema),
    mode: 'onChange',
    defaultValues: {
      accommodationAddress: planData.accommodationLocation?.address || '',
      accommodationType: planData.accommodationType || 'hotel',
    }
  })

  const accommodationTypeValue = watch('accommodationType')
  const accommodationAddressValue = watch('accommodationAddress')

  const onSubmit = (data: AccommodationFormData) => {
    updatePlanData({
      accommodationLocation: data.accommodationAddress || accommodationCoordinates
        ? { 
            address: data.accommodationAddress || '',
            lat: accommodationCoordinates?.lat || 0, 
            lng: accommodationCoordinates?.lng || 0 
          } 
        : undefined,
      accommodationType: data.accommodationType,
    })
    setCurrentStep(4)
  }

  const handlePrevious = () => {
    setCurrentStep(2)
  }

  const handleTypeSelect = (type: string) => {
    setValue('accommodationType', type as any, { shouldValidate: true })
  }

  const handleAccommodationSelect = (place: {
    name: string
    address: string
    lat: number
    lng: number
  }) => {
    setValue('accommodationAddress', place.address, { shouldValidate: true })
    setAccommodationCoordinates({ lat: place.lat, lng: place.lng })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          어디에서 숙박하실 예정인가요?
        </h2>
        <p className="text-gray-600">
          숙소 위치와 형태를 알려주시면 더 정확한 일정을 짤 수 있어요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            숙소 정보
          </CardTitle>
          <CardDescription>
            숙소 정보는 선택사항이며, 나중에 AI가 추천해드릴 수도 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="accommodationAddress">숙소 위치 검색 (선택사항)</Label>
              <PlaceSearch
                placeholder="숙소나 숙박 지역을 검색하세요..."
                defaultValue={accommodationAddressValue}
                onPlaceSelect={handleAccommodationSelect}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accommodationAddress-manual">또는 직접 입력</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="accommodationAddress-manual"
                  placeholder="예: 명동, 해운대, 중문관광단지..."
                  {...register('accommodationAddress')}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-gray-500">
                구체적인 주소나 대략적인 지역명을 입력하세요
              </p>
            </div>

            <div className="space-y-3">
              <Label>선호하는 숙소 형태</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {accommodationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeSelect(type.value)}
                    className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                      accommodationTypeValue === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {type.label}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(accommodationAddressValue || accommodationCoordinates) && (
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">
                  선택한 숙소 형태: <span className="font-semibold">
                    {accommodationTypes.find(t => t.value === accommodationTypeValue)?.label}
                  </span>
                  {accommodationCoordinates && (
                    <span className="text-xs block mt-1">
                      📍 숙소 위치가 확인되었습니다
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 팁</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 숙소 위치를 입력하면 주변 관광지 위주로 일정을 구성해드려요</li>
                <li>• 비워두시면 AI가 최적의 숙소 위치를 추천해드려요</li>
                <li>• 숙소 형태에 따라 예산과 일정이 조정됩니다</li>
                <li>• 카카오 검색으로 정확한 위치를 찾을 수 있어요</li>
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
                type="submit"
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