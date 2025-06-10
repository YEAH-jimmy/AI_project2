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
import { Home, ArrowRight, ArrowLeft, MapPin, Sparkles, Lightbulb, Loader2, Star, Wifi, Car } from 'lucide-react'
import { searchAccommodationsNearby, getCoordinatesByAddress, AccommodationInfo } from '@/lib/kakao-map'

const accommodationSchema = z.object({
  accommodationName: z.string().optional(),
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
  const { 
    planData, 
    updatePlanData, 
    setCurrentStep,
    recommendedAccommodations,
    isLoadingAccommodations,
    setRecommendedAccommodations,
    setIsLoadingAccommodations
  } = useTravelPlannerStore()
  const [hasBookedAccommodation, setHasBookedAccommodation] = useState(
    planData.hasBookedAccommodation || false
  )
  const [showRecommendations, setShowRecommendations] = useState(false)
  
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
      accommodationName: planData.accommodationName || '',
      accommodationAddress: planData.accommodationLocation?.address || '',
      accommodationType: planData.accommodationType || 'hotel',
    }
  })

  const accommodationTypeValue = watch('accommodationType')
  const accommodationNameValue = watch('accommodationName')
  const accommodationAddressValue = watch('accommodationAddress')

  const onSubmit = (data: AccommodationFormData) => {
    updatePlanData({
      hasBookedAccommodation,
      accommodationName: data.accommodationName,
      accommodationLocation: data.accommodationAddress 
        ? { address: data.accommodationAddress } 
        : undefined,
      accommodationType: data.accommodationType,
    })
    setCurrentStep(4)
  }

  const handlePrevious = () => {
    setCurrentStep(2)
  }

  const handleBookingStatusChange = (status: boolean) => {
    setHasBookedAccommodation(status)
    // 선택이 바뀌면 입력 필드 초기화
    if (!status) {
      setValue('accommodationName', '')
      setValue('accommodationAddress', '')
    }
  }

  const handleTypeSelect = (type: string) => {
    setValue('accommodationType', type as any, { shouldValidate: true })
  }

  // AI 숙소 추천 기능
  const handleAIRecommendation = async () => {
    if (!planData.destination) {
      alert('먼저 여행지를 선택해주세요.')
      return
    }

    setIsLoadingAccommodations(true)
    setShowRecommendations(true)

    try {
      console.log(`${planData.destination} 지역 숙소 추천 시작...`)
      
      // 목적지 좌표 얻기
      const coordinates = await getCoordinatesByAddress(planData.destination)
      
      if (!coordinates) {
        throw new Error('목적지 좌표를 찾을 수 없습니다.')
      }

      // 선택된 숙소 타입으로 검색
      const accommodations = await searchAccommodationsNearby(
        coordinates.lat,
        coordinates.lng,
        accommodationTypeValue,
        15 // 15km 반경
      )

      if (accommodations.length === 0) {
        throw new Error('해당 지역에서 숙소를 찾을 수 없습니다.')
      }

      setRecommendedAccommodations(accommodations)
      console.log(`${accommodations.length}개 숙소 추천 완료`)
      
    } catch (error) {
      console.error('숙소 추천 중 오류:', error)
      alert(`숙소 추천 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setShowRecommendations(false)
    } finally {
      setIsLoadingAccommodations(false)
    }
  }

  // 추천 숙소 선택
  const handleSelectRecommendedAccommodation = (accommodation: AccommodationInfo) => {
    setValue('accommodationName', accommodation.name)
    setValue('accommodationAddress', accommodation.address)
    
    // 플랜 데이터 업데이트
    updatePlanData({
      accommodationName: accommodation.name,
      accommodationLocation: { 
        address: accommodation.address,
        lat: accommodation.lat,
        lng: accommodation.lng
      },
    })
    
    setShowRecommendations(false)
    setHasBookedAccommodation(true) // 선택하면 예약한 것으로 처리
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
            숙소 예약 여부에 따라 맞춤형 정보를 제공해드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 숙소 예약 여부 선택 */}
            <div className="space-y-4">
              <Label className="text-base font-medium">숙소를 이미 예약하셨나요?</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBookingStatusChange(true)}
                  className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                    hasBookedAccommodation
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    예, 예약했어요
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    예약한 숙소 정보를 입력해주세요
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleBookingStatusChange(false)}
                  className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                    !hasBookedAccommodation
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    아니요, 아직이에요
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    AI가 적절한 숙소를 추천해드릴게요
                  </div>
                </button>
              </div>
            </div>

            {/* 예약한 숙소 정보 입력 (예약했을 경우) */}
            {hasBookedAccommodation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-green-700 font-medium">
                  <span>📝</span>
                  예약한 숙소 정보
                </div>
                <p className="text-sm text-green-600">
                  예약하신 숙소 정보를 입력해주시면, 숙소 중심으로 최적의 일정을 구성해드려요!
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accommodationName">숙소명</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="accommodationName"
                        placeholder="예: 롯데호텔 제주, 해운대 그랜드 호텔..."
                        {...register('accommodationName')}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accommodationAddress">숙소 주소</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="accommodationAddress"
                        placeholder="예: 서울특별시 중구 명동, 부산광역시 해운대구..."
                        {...register('accommodationAddress')}
                        className="pl-9"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      정확한 주소나 대략적인 지역명을 입력해주세요
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI 숙소 추천 서비스 (예약 안 했을 경우) */}
            {!hasBookedAccommodation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-700 font-medium">
                  <Sparkles className="w-5 h-5" />
                  숙소 추천 서비스
                </div>
                <p className="text-sm text-blue-600">
                  선호하시는 숙소 타입만 선택해주시면, AI가 위치와 일정에 맞는 최적의 숙소를 추천해드려요!
                </p>
                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-sm text-blue-800">
                    • AI가 일정과 장소에 맞는 최적의 숙소 추천<br/>
                    • 선호 지역 내에서 평점이 좋은 숙소 우선 추천<br/>
                    • 숙소 주변 맛집과 관광지 정보도 함께 제공해드려요
                  </p>
                </div>
              </div>
            )}

            {/* 선호하는 숙소 형태 - 예약 안 했을 경우에만 표시 */}
            {!hasBookedAccommodation && (
              <div className="space-y-4">
                <Label>선호하는 숙소 형태</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {accommodationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeSelect(type.value)}
                      className={`p-3 text-center border rounded-lg transition-all hover:shadow-md ${
                        accommodationTypeValue === type.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {type.description}
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* AI 추천 버튼 */}
                <div className="flex justify-center mt-4">
                  <Button
                    type="button"
                    onClick={handleAIRecommendation}
                    disabled={isLoadingAccommodations || !planData.destination}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2"
                  >
                    {isLoadingAccommodations ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        AI가 숙소를 찾는 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI 숙소 추천받기
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* AI 추천 숙소 결과 */}
            {!hasBookedAccommodation && showRecommendations && recommendedAccommodations && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Sparkles className="w-5 h-5" />
                  AI 추천 숙소 ({recommendedAccommodations.length}개)
                </div>
                <p className="text-sm text-purple-600">
                  {planData.destination}에서 {accommodationTypes.find(t => t.value === accommodationTypeValue)?.label} 타입으로 추천드려요!
                </p>
                
                <div className="grid gap-3 max-h-96 overflow-y-auto">
                  {recommendedAccommodations.map((accommodation, index) => (
                    <div
                      key={accommodation.id}
                      className="bg-white border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleSelectRecommendedAccommodation(accommodation)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {index + 1}. {accommodation.name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            📍 {accommodation.address}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            {accommodation.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{accommodation.rating.toFixed(1)}</span>
                              </div>
                            )}
                            {accommodation.reviewCount && (
                              <span>리뷰 {accommodation.reviewCount}개</span>
                            )}
                            {accommodation.distance && (
                              <span>거리 {accommodation.distance.toFixed(1)}km</span>
                            )}
                          </div>
                          
                          {accommodation.priceRange && (
                            <div className="text-sm font-medium text-blue-600 mb-2">
                              💰 {accommodation.priceRange}
                            </div>
                          )}
                          
                          {accommodation.amenities && accommodation.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {accommodation.amenities.slice(0, 4).map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                                >
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <Button
                          type="button"
                          size="sm"
                          className="ml-2 bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectRecommendedAccommodation(accommodation)
                          }}
                        >
                          선택
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 선택 정보 요약 */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              {!hasBookedAccommodation && (
                <p className="text-sm text-gray-600">
                  선택한 숙소 형태: <span className="font-semibold text-gray-900">
                    {accommodationTypes.find(t => t.value === accommodationTypeValue)?.label}
                  </span>
                </p>
              )}
              {hasBookedAccommodation && accommodationNameValue && (
                <p className="text-sm text-green-600">
                  📍 예약 숙소: {accommodationNameValue}
                </p>
              )}
              {hasBookedAccommodation && !accommodationNameValue && (
                <p className="text-sm text-green-600">
                  ✅ 숙소 예약 완료
                </p>
              )}
              {!hasBookedAccommodation && (
                <p className="text-sm text-blue-600 mt-1">
                  🤖 AI가 최적의 숙소를 추천해드릴 예정입니다
                </p>
              )}
            </div>

            {/* 팁 섹션 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                팁
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 정확한 숙소 위치를 입력하면 주변 관광지 위주로 일정이 구성돼요</li>
                <li>• 새로운 지역 방문 시 교통과 접근성을 고려해 숙소를 추천해드려요</li>
                <li>• 숙소 형태에 따라 맞춤형 주변 시설 정보를 제공해드려요</li>
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