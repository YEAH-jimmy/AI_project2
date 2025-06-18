'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, ArrowRight, ArrowLeft, Search, AlertCircle } from 'lucide-react'
import koreaData from '@/data/korea-administrative-district.json'
import { clarifyAmbiguousDestination } from '@/lib/kakao-map'

// 유효한 도시 리스트 생성
const validCities = koreaData.regions.flatMap(region => [
  region.name,
  ...region.districts
]);

// 도시명에서 접미사 제거하는 함수
const normalizeCity = (city: string): string => {
  return city
    .replace(/특별시$/, '')
    .replace(/광역시$/, '')
    .replace(/특별자치시$/, '')
    .replace(/특별자치도$/, '')
    .replace(/도$/, '')
    .replace(/시$/, '')
    .replace(/군$/, '')
    .replace(/구$/, '')
    .trim();
};

// 도시 유효성 검사 함수 (접미사 제거해서도 검색 가능)
const isValidCity = (inputCity: string): boolean => {
  if (!inputCity) return false;
  
  // 1. 정확한 이름으로 먼저 확인
  if (validCities.includes(inputCity)) {
    return true;
  }
  
  // 2. 접미사 제거한 이름으로 확인
  const normalizedInput = normalizeCity(inputCity);
  if (!normalizedInput) return false;
  
  // 정규화된 입력과 매칭되는 도시가 있는지 확인
  const matchingCities = validCities.filter(city => {
    const normalizedCity = normalizeCity(city);
    return normalizedCity === normalizedInput;
  });
  
  return matchingCities.length > 0;
};

// 입력된 도시명을 정확한 도시명으로 변환하는 함수
const getExactCityName = (inputCity: string): string => {
  // 1. 정확한 이름이면 그대로 반환
  if (validCities.includes(inputCity)) {
    return inputCity;
  }
  
  // 2. 접미사 제거한 이름으로 매칭되는 첫 번째 도시 반환
  const normalizedInput = normalizeCity(inputCity);
  const matchingCity = validCities.find(city => {
    const normalizedCity = normalizeCity(city);
    return normalizedCity === normalizedInput;
  });
  
  return matchingCity || inputCity;
};

const destinationSchema = z.object({
  destination: z.string()
    .min(1, '여행지를 선택해주세요')
    .refine((value) => isValidCity(value), {
      message: '지원하지 않는 지역입니다. 한국의 시/군/구 이름을 입력해주세요.',
    }),
})

type DestinationFormData = z.infer<typeof destinationSchema>

// 인기 여행지 데이터 - JSON 파일의 실제 도시명으로 업데이트
const popularDestinations = [
  { name: '제주시', description: '아름다운 자연과 독특한 문화' },
  { name: '부산광역시', description: '해변과 도시의 조화' },
  { name: '경주시', description: '천년 고도의 역사와 문화' },
  { name: '강릉시', description: '동해안의 아름다운 해변' },
  { name: '여수시', description: '밤바다의 로맨틱한 풍경' },
  { name: '전주시', description: '한옥마을과 맛있는 음식' },
  { name: '속초시', description: '설악산과 바다의 만남' },
  { name: '가평군', description: '수도권 근교의 자연휴양' },
  { name: '서울특별시', description: '다양한 문화와 먹거리' },
  { name: '인천광역시', description: '차이나타운과 송도' },
  { name: '대전광역시', description: '과학의 도시' },
  { name: '대구광역시', description: '패션과 문화의 도시' },
]

export function DestinationStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [selectedDestination, setSelectedDestination] = useState(planData.destination || '')
  const [isValidDestination, setIsValidDestination] = useState(true)
  const [ambiguityCheck, setAmbiguityCheck] = useState<{ needsClarification: boolean; message?: string; suggestions?: string[] }>({ needsClarification: false })
  
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

  // 입력값이 변경될 때마다 유효성 검사 및 모호성 검사
  useEffect(() => {
    if (destinationValue) {
      // 먼저 모호한 지명인지 확인
      const clarification = clarifyAmbiguousDestination(destinationValue);
      setAmbiguityCheck(clarification);
      
      // 모호하지 않은 경우에만 유효성 검사 진행
      if (!clarification.needsClarification) {
      setIsValidDestination(isValidCity(destinationValue));
      } else {
        setIsValidDestination(false); // 모호한 경우 유효하지 않음으로 처리
      }
    } else {
      setIsValidDestination(true);
      setAmbiguityCheck({ needsClarification: false });
    }
  }, [destinationValue]);

  const onSubmit = (data: DestinationFormData) => {
    // 모호한 지명인 경우 진행하지 않음
    const clarification = clarifyAmbiguousDestination(data.destination);
    if (clarification.needsClarification) {
      return;
    }
    
    if (!isValidCity(data.destination)) {
      return; // 유효하지 않은 도시면 진행하지 않음
    }
    
    // 입력된 도시명을 정확한 도시명으로 변환
    const exactCityName = getExactCityName(data.destination);
    
    updatePlanData({
      destination: exactCityName
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
            아래 목록에서 선택하거나 정확한 도시명을 입력해주세요.
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
                  placeholder="예: 서울, 부산, 광주광역시, 제주..."
                  {...register('destination')}
                  className={`pl-9 ${errors.destination || !isValidDestination || ambiguityCheck.needsClarification ? 'border-red-500' : ''}`}
                />
              </div>
              
              {/* 모호한 지명 경고 메시지 */}
              {ambiguityCheck.needsClarification && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-yellow-800">
                        {ambiguityCheck.message}
                      </p>
                      {ambiguityCheck.suggestions && (
                        <div className="space-y-1">
                          <p className="text-xs text-yellow-700">다음 중 하나를 선택해주세요:</p>
                          <div className="flex flex-wrap gap-2">
                            {ambiguityCheck.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  const selectedValue = suggestion.includes('경기도') ? '광주시' : '광주광역시';
                                  handleDestinationSelect(selectedValue);
                                }}
                                className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full border border-yellow-300 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {errors.destination && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  {errors.destination.message}
                </div>
              )}
              {!isValidDestination && destinationValue && !errors.destination && !ambiguityCheck.needsClarification && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  입력하신 "{destinationValue}"는 지원하지 않는 지역입니다. 아래 목록에서 선택해주세요.
                </div>
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
            {destinationValue && isValidDestination && !ambiguityCheck.needsClarification && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">선택한 여행지: {destinationValue}</span>
                </p>
                <p className="text-xs text-green-600 mt-1">
                  AI가 {destinationValue}의 최적 여행 코스를 추천해드릴게요!
                </p>
              </div>
            )}

            {/* 도시 목록 힌트 */}
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                💡 <strong>팁:</strong> "서울", "부산", "광주광역시", "제주" 등 정확하게 입력해주세요! 
                광주처럼 동일한 이름의 도시가 있는 경우 정확한 이름을 선택해주세요.
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
                type="submit" 
                disabled={!isValid || !isValidDestination || ambiguityCheck.needsClarification}
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