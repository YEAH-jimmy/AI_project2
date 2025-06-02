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
  Map,
  PanelLeftClose,
  PanelLeftOpen
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
  const [showMap, setShowMap] = useState(true) // 기본적으로 지도 표시
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true) // 왼쪽 패널 상태

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
      {/* 여행 정보 요약 */}
      <Card className="max-w-4xl mx-auto">
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

      {/* 일정과 지도 좌우 배치 - 전체 화면 너비 활용 */}
      <div className="relative min-h-[800px]">
        {/* 토글 버튼 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {isLeftPanelOpen ? (
            <>
              <PanelLeftClose className="w-4 h-4 mr-2" />
              일정 숨기기
            </>
          ) : (
            <>
              <PanelLeftOpen className="w-4 h-4 mr-2" />
              일정 보기
            </>
          )}
        </Button>

        <div className={`grid gap-6 transition-all duration-300 h-[800px] ${
          isLeftPanelOpen ? 'lg:grid-cols-12' : 'lg:grid-cols-1'
        }`}>
          {/* 왼쪽: AI 추천 일정 */}
          {isLeftPanelOpen && (
            <div className="lg:col-span-5">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5" />
                    AI 추천 일정
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                  <div className="space-y-6">
                    {planData.startDate && planData.endDate && (
                      Array.from({ 
                        length: Math.ceil((new Date(planData.endDate).getTime() - new Date(planData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 
                      }).map((_, dayIndex) => {
                        const currentDate = new Date(new Date(planData.startDate!).getTime() + dayIndex * 24 * 60 * 60 * 1000)
                        
                        // 여행지별 구체적인 일정 데이터
                        const getSpecificItinerary = (destination: string, day: number) => {
                          const itineraries: { [key: string]: { [key: number]: any[] } } = {
                            '제주도': {
                              0: [
                                { time: '09:00', activity: '제주공항 도착 및 렌터카 픽업', location: '제주국제공항', type: 'transport' },
                                { time: '10:30', activity: '성산일출봉', location: '서귀포시 성산읍', type: 'attraction', description: '유네스코 세계자연유산, 화산분화구' },
                                { time: '12:30', activity: '성산포 맛집 점심', location: '성산일출봉 맛집 "일출봉횟집"', type: 'food', description: '신선한 제주 해산물 정식' },
                                { time: '14:00', activity: '우도 페리 이용', location: '성산포항 → 우도', type: 'transport' },
                                { time: '15:00', activity: '우도 관광 (땅콩아이스크림, 해안도로)', location: '우도', type: 'attraction' },
                                { time: '17:00', activity: '제주시내 이동 및 체크인', location: '제주시내 숙소', type: 'accommodation' },
                                { time: '19:00', activity: '제주 흑돼지 맛집 저녁', location: '돈사돈 제주본점', type: 'food', description: '제주 대표 흑돼지 구이' }
                              ],
                              1: [
                                { time: '09:00', activity: '한라산 국립공원', location: '어리목 탐방로', type: 'attraction', description: '한라산 등반 (어리목 → 윗세오름)' },
                                { time: '12:00', activity: '산채정식 점심', location: '어리목 주변 "산채원"', type: 'food', description: '제주 산나물 정식' },
                                { time: '14:00', activity: '제주 신화월드', location: '서귀포시 안덕면', type: 'attraction', description: '테마파크 및 쇼핑' },
                                { time: '16:30', activity: '중문관광단지 해변산책', location: '중문색달해수욕장', type: 'attraction' },
                                { time: '18:00', activity: '해산물 뷔페 저녁', location: '중문 "더클리프"', type: 'food', description: '오션뷰 해산물 뷔페' },
                                { time: '20:00', activity: '제주 야시장 구경', location: '동문시장 야시장', type: 'shopping', description: '제주 특산품 쇼핑' }
                              ]
                            },
                            '부산': {
                              0: [
                                { time: '09:00', activity: 'KTX 부산역 도착', location: '부산역', type: 'transport' },
                                { time: '10:00', activity: '감천문화마을', location: '사하구 감천동', type: 'attraction', description: '부산의 마추픽추, 알록달록한 골목길' },
                                { time: '12:00', activity: '토성동 맛집 점심', location: '토성동 "할매국수"', type: 'food', description: '부산 대표 밀면' },
                                { time: '14:00', activity: '송도해상케이블카', location: '서구 송도해수욕장', type: 'attraction', description: '바다 위를 가로지르는 케이블카' },
                                { time: '16:00', activity: '국제시장 & 부평깡통시장', location: '중구 국제시장', type: 'shopping', description: '부산 전통시장 탐방' },
                                { time: '18:00', activity: '자갈치시장 해산물 저녁', location: '자갈치시장 2층 식당가', type: 'food', description: '신선한 회와 해산물탕' },
                                { time: '20:00', activity: '부산항대교 야경', location: '영도대교', type: 'attraction', description: '부산 야경 명소' }
                              ],
                              1: [
                                { time: '09:00', activity: '해동 용궁사', location: '기장군 기장읍', type: 'attraction', description: '바다 위에 지어진 아름다운 사찰' },
                                { time: '11:00', activity: '해운대해수욕장', location: '해운대구', type: 'attraction', description: '부산 대표 해수욕장' },
                                { time: '12:30', activity: '해운대 맛집 점심', location: '해운대 "금수복국"', type: 'food', description: '부산식 복어요리 전문점' },
                                { time: '14:30', activity: '달맞이길 & 청사포', location: '해운대구 달맞이길', type: 'attraction', description: '해안 드라이브 코스' },
                                { time: '16:00', activity: '광안리해수욕장', location: '수영구 광안동', type: 'attraction', description: '광안대교 뷰가 아름다운 해변' },
                                { time: '18:00', activity: '광안리 회센터 저녁', location: '광안리 회센터', type: 'food', description: '광안대교 야경을 보며 즐기는 회' },
                                { time: '20:30', activity: '광안대교 야경 감상', location: '광안리해수욕장', type: 'attraction' }
                              ]
                            },
                            '서울': {
                              0: [
                                { time: '09:00', activity: '경복궁 관람', location: '종로구 사직로', type: 'attraction', description: '조선왕조 대표 궁궐, 수문장 교대식' },
                                { time: '11:00', activity: '북촌한옥마을', location: '종로구 계동', type: 'attraction', description: '전통 한옥이 보존된 마을' },
                                { time: '12:30', activity: '인사동 맛집 점심', location: '인사동 "진주회관"', type: 'food', description: '전통 한정식' },
                                { time: '14:00', activity: '명동 쇼핑', location: '중구 명동', type: 'shopping', description: '한국 대표 쇼핑거리' },
                                { time: '16:00', activity: 'N서울타워', location: '용산구 남산공원길', type: 'attraction', description: '서울 랜드마크, 서울 전경 조망' },
                                { time: '18:00', activity: '남산골한옥마을 저녁', location: '중구 필동', type: 'food', description: '전통 한식당가' },
                                { time: '20:00', activity: '청계천 야경산책', location: '중구 청계천로', type: 'attraction', description: '도심 속 하천 산책로' }
                              ],
                              1: [
                                { time: '09:00', activity: '창덕궁 & 후원', location: '종로구 율곡로', type: 'attraction', description: '유네스코 세계문화유산' },
                                { time: '11:30', activity: '홍대 거리', location: '마포구 홍익로', type: 'attraction', description: '젊음의 거리, 거리공연' },
                                { time: '12:30', activity: '홍대 맛집 점심', location: '홍대 "노가리골목"', type: 'food', description: '다양한 포장마차 음식' },
                                { time: '14:30', activity: '한강공원 (여의도)', location: '영등포구 여의동로', type: 'attraction', description: '한강 자전거 라이딩' },
                                { time: '16:30', activity: '63빌딩 전망대', location: '영등포구 63로', type: 'attraction', description: '한강과 서울 시내 전망' },
                                { time: '18:30', activity: '강남역 맛집 저녁', location: '강남역 "본죽&비빔밥"', type: 'food', description: '한국식 퓨전 요리' },
                                { time: '20:30', activity: '반포무지개다리 분수쇼', location: '서초구 반포한강공원', type: 'attraction', description: '음악 분수 쇼' }
                              ]
                            }
                          }
                          
                          return itineraries[destination]?.[day] || [
                            { time: '09:00', activity: '호텔 조식 및 체크아웃', location: '숙소', type: 'accommodation' },
                            { time: '10:30', activity: `${destination} 주요 관광지 방문`, location: destination, type: 'attraction' },
                            { time: '12:30', activity: '현지 맛집에서 점심', location: `${destination} 맛집`, type: 'food' },
                            { time: '14:00', activity: '문화 체험 및 쇼핑', location: `${destination} 쇼핑가`, type: 'shopping' },
                            { time: '18:00', activity: '저녁 식사 및 야경 감상', location: `${destination} 야경 명소`, type: 'food' }
                          ]
                        }
                        
                        const dayItinerary = getSpecificItinerary(planData.destination || '서울', dayIndex)
                        
                        const getActivityIcon = (type: string) => {
                          switch (type) {
                            case 'food': return '🍽️'
                            case 'attraction': return '🏛️'
                            case 'shopping': return '🛍️'
                            case 'transport': return '🚗'
                            case 'accommodation': return '🏨'
                            default: return '📍'
                          }
                        }
                        
                        return (
                          <div key={dayIndex} className="border-l-4 border-blue-500 pl-6">
                            <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                              {format(currentDate, 'M월 d일 (EEE)', { locale: ko })}
                            </h4>
                            <div className="space-y-3">
                              {dayItinerary.map((item, itemIndex) => (
                                <div key={itemIndex} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-start gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                      <span className="text-gray-700 font-medium">{item.time}</span>
                                      <span className="text-lg">{getActivityIcon(item.type)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-gray-900 mb-1">{item.activity}</h5>
                                      <p className="text-sm text-gray-600 mb-1">📍 {item.location}</p>
                                      {item.description && (
                                        <p className="text-sm text-gray-500">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 오른쪽: 카카오 지도 */}
          <div className={`${isLeftPanelOpen ? 'lg:col-span-7' : 'lg:col-span-1'}`}>
            <Card className="h-full">
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
              </CardHeader>
              <CardContent className="p-0">
                {showMap ? (
                  <div className="relative bg-gray-100">
                    <KakaoMap
                      center={getMapCenter()}
                      markers={getDestinationMarkers()}
                      height="720px"
                      level={5}
                      className="w-full"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded px-3 py-2 shadow-lg">
                      <p className="text-xs text-gray-700">
                        💡 지도의 마커를 클릭하면 더 자세한 정보를 볼 수 있습니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[720px] flex items-center justify-center bg-gray-50">
                    <div className="text-center text-gray-500">
                      <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="font-medium">지도가 숨겨져 있습니다</p>
                      <p className="text-sm mt-1">위의 "지도 보기" 버튼을 클릭하여 지도를 표시하세요</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
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