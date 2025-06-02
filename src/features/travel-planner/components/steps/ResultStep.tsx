'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  CheckCircle,
  Map
} from 'lucide-react'
import { KakaoMap } from '../KakaoMap'

// 샘플 여행지 데이터 (실제로는 AI가 생성)
const sampleDestinations = [
  { lat: 37.5665, lng: 126.9780, name: '서울 시청', description: '서울의 중심지' },
  { lat: 37.5796, lng: 126.9770, name: '경복궁', description: '조선 왕조의 대표 궁궐' },
  { lat: 37.5665, lng: 126.9849, name: '명동', description: '쇼핑과 맛집의 거리' },
  { lat: 37.5547, lng: 126.9707, name: '남산타워', description: '서울의 랜드마크' },
]

export function ResultStep() {
  const { planData, setCurrentStep, resetPlanData, setIsGenerating, isGenerating } = useTravelPlannerStore()
  const [generationComplete, setGenerationComplete] = useState(false)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    // AI 일정 생성 시뮬레이션
    setIsGenerating(true)
    const timer = setTimeout(() => {
      setIsGenerating(false)
      setGenerationComplete(true)
    }, 3000) // 3초 후 완료

    return () => clearTimeout(timer)
  }, [setIsGenerating])

  const handlePrevious = () => {
    setCurrentStep(8)
  }

  const handleStartOver = () => {
    resetPlanData()
  }

  const handleDownloadCalendar = () => {
    // TODO: 캘린더 다운로드 기능 구현
    alert('캘린더 다운로드 기능은 추후 구현 예정입니다.')
  }

  const handleShare = () => {
    // TODO: 공유 기능 구현
    alert('공유 기능은 추후 구현 예정입니다.')
  }

  // 여행지에 따른 지도 중심점 설정
  const getMapCenter = () => {
    const destinations: { [key: string]: { lat: number; lng: number } } = {
      '제주도': { lat: 33.4996, lng: 126.5312 },
      '부산': { lat: 35.1796, lng: 129.0756 },
      '경주': { lat: 35.8562, lng: 129.2247 },
      '강릉': { lat: 37.7519, lng: 128.8761 },
      '여수': { lat: 34.7604, lng: 127.6622 },
      '전주': { lat: 35.8242, lng: 127.1480 },
      '속초': { lat: 38.2070, lng: 128.5918 },
      '가평': { lat: 37.8314, lng: 127.5109 },
    }
    
    return destinations[planData.destination || ''] || { lat: 37.5665, lng: 126.9780 }
  }

  const getDestinationMarkers = () => {
    // 실제로는 AI가 생성한 일정에서 마커를 만들어야 함
    const center = getMapCenter()
    
    if (planData.destination === '서울' || !planData.destination) {
      return sampleDestinations
    }

    // 다른 도시의 경우 중심점만 표시
    return [{
      lat: center.lat,
      lng: center.lng,
      name: planData.destination || '여행지',
      description: '선택하신 여행 목적지'
    }]
  }

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            AI가 여행 일정을 생성 중입니다
          </h2>
          <p className="text-gray-700">
            입력해주신 정보를 바탕으로 최적의 여행 일정을 만들고 있어요.
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto">
                  <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
                </div>
                <Sparkles className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">AI 분석 중...</p>
                <p className="text-sm text-gray-700">
                  📍 최적 경로 계산<br />
                  🏨 숙소 및 맛집 추천<br />
                  ⏰ 시간표 최적화<br />
                  💰 예산 맞춤 조정<br />
                  🗺️ 카카오맵 경로 생성
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            여행 일정이 완성되었습니다!
          </h2>
        </div>
        <p className="text-gray-600">
          AI가 생성한 맞춤형 여행 일정을 확인해보세요.
        </p>
      </div>

      {/* 여행 정보 요약 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Calendar className="w-5 h-5" />
            여행 정보 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">여행지:</span>
                <span className="font-medium text-gray-900">{planData.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">기간:</span>
                <span className="font-medium text-gray-900">
                  {planData.startDate && planData.endDate && (
                    `${format(new Date(planData.startDate), 'M월 d일', { locale: ko })} - ${format(new Date(planData.endDate), 'M월 d일', { locale: ko })}`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">인원:</span>
                <span className="font-medium text-gray-900">{planData.travelers}명</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">교통수단:</span>
                <span className="font-medium text-gray-900">{planData.intercityTransport}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">숙소 형태:</span>
                <span className="font-medium text-gray-900">{planData.accommodationType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">예산:</span>
                <span className="font-medium text-gray-900">
                  {planData.budget ? 
                    `${planData.budget.toLocaleString()}${planData.budgetCurrency === 'KRW' ? '원' : '$'}` 
                    : '제한 없음'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 카카오 지도 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-gray-900">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5" />
              여행 경로 지도
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? '지도 숨기기' : '지도 보기'}
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-700">
            카카오맵으로 여행 경로와 주요 관광지를 확인하세요.
          </CardDescription>
        </CardHeader>
        {showMap && (
          <CardContent>
            <KakaoMap
              center={getMapCenter()}
              markers={getDestinationMarkers()}
              height="400px"
              level={5}
            />
            <p className="text-xs text-gray-700 mt-2">
              💡 지도의 마커를 클릭하면 더 자세한 정보를 볼 수 있습니다.
            </p>
          </CardContent>
        )}
      </Card>

      {/* 샘플 일정 (실제로는 AI가 생성) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MapPin className="w-5 h-5" />
            AI 추천 일정
          </CardTitle>
          <CardDescription className="text-gray-700">
            입력하신 정보를 바탕으로 생성된 맞춤 일정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {planData.startDate && planData.endDate && (
              Array.from({ 
                length: Math.ceil((new Date(planData.endDate).getTime() - new Date(planData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 
              }).map((_, dayIndex) => {
                const currentDate = new Date(new Date(planData.startDate!).getTime() + dayIndex * 24 * 60 * 60 * 1000)
                return (
                  <div key={dayIndex} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {format(currentDate, 'M월 d일 (EEE)', { locale: ko })}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">09:00</span>
                        <span className="text-gray-900">호텔 조식 및 체크아웃</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">10:30</span>
                        <span className="text-gray-900">주요 관광지 방문 ({planData.destination})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">12:30</span>
                        <span className="text-gray-900">현지 맛집에서 점심</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">14:00</span>
                        <span className="text-gray-900">문화 체험 및 쇼핑</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">18:00</span>
                        <span className="text-gray-900">저녁 식사 및 야경 감상</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Button 
          onClick={handleDownloadCalendar}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Download className="w-4 h-4" />
          캘린더에 저장
        </Button>
        
        <Button 
          onClick={handleShare}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Share2 className="w-4 h-4" />
          일정 공유하기
        </Button>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🎉 여행 일정 완성!</h4>
        <p className="text-sm text-green-800">
          AI가 생성한 맞춤 일정이 마음에 드시나요? 
          실제 여행에서는 현지 상황에 따라 유연하게 조정하시기 바랍니다.
          카카오맵을 통해 더 자세한 경로와 교통편을 확인할 수 있습니다.
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
          onClick={handleStartOver}
          className="flex items-center gap-2"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4" />
          새로운 여행 계획
        </Button>
      </div>
    </div>
  )
} 