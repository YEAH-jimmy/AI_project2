'use client'

import { useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar,
  BarChart3,
  Loader2,
  MapPin,
  Clock,
  Download,
  Share2,
  Trash2,
  Repeat,
  ArrowLeft,
  RotateCcw,
  PanelLeftOpen,
  PanelLeftClose,
  Map,
  Star,
  Navigation,
  Phone
} from 'lucide-react'
import { KakaoMap } from '../KakaoMap'
import { getPopularPlacesByRegion, RecommendedPlace, generateOptimizedItinerary } from '@/lib/place-recommendation'
import { getValidatedTransportPoint, calculateTravelTime } from '@/lib/kakao-map'

// 샘플 여행지 데이터 (실제로는 AI가 생성)
const sampleDestinations = [
  { lat: 37.5665, lng: 126.9780, name: '서울 시청', description: '서울의 중심지' },
  { lat: 37.5796, lng: 126.9770, name: '경복궁', description: '조선 왕조의 대표 궁궐' },
  { lat: 37.5665, lng: 126.9849, name: '명동', description: '쇼핑과 맛집의 거리' },
  { lat: 37.5547, lng: 126.9707, name: '남산타워', description: '서울의 랜드마크' },
]

// 시간대별 장소 정렬 함수
const sortPlacesByTimeAndType = (places: RecommendedPlace[]) => {
  const morningTypes = ['attraction', 'culture']
  const lunchTypes = ['food'] // 카페 제외
  const afternoonTypes = ['shopping', 'attraction', 'culture', 'cafe'] // 카페는 오후에만
  const dinnerTypes = ['food'] // 카페 제외
  const eveningTypes = ['attraction', 'nightlife']
  
  const categorized = {
    morning: places.filter(p => morningTypes.includes(categorizePlace(p.category))),
    lunch: places.filter(p => lunchTypes.includes(categorizePlace(p.category))),
    afternoon: places.filter(p => afternoonTypes.includes(categorizePlace(p.category))),
    dinner: places.filter(p => dinnerTypes.includes(categorizePlace(p.category))),
    evening: places.filter(p => eveningTypes.includes(categorizePlace(p.category)))
  }
  
  const result = []
  
  // 오전 (2개)
  result.push(...categorized.morning.slice(0, 2))
  // 점심 (1개)
  result.push(...categorized.lunch.slice(0, 1))
  // 오후 (3개)
  result.push(...categorized.afternoon.slice(0, 3))
  // 저녁 (1개)
  result.push(...categorized.dinner.slice(1, 2)) // 점심과 다른 식당
  // 야간 (1개)
  result.push(...categorized.evening.slice(0, 1))
  
  // 부족한 경우 남은 장소로 채우기
  const used = new Set(result.map(p => p.id))
  const remaining = places.filter(p => !used.has(p.id))
  result.push(...remaining.slice(0, 8 - result.length))
  
  return result.slice(0, 8)
}

// 시간 슬롯 생성
const generateTimeSlot = (index: number): string => {
  const timeSlots = [
    '09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30', '20:00'
  ]
  return timeSlots[index] || `${9 + index}:00`
}

// 장소 카테고리 분류
const categorizePlace = (category: string): string => {
  // 카페와 일반 음식점 구분
  if (category.includes('카페') || category.includes('커피') || category.includes('디저트')) {
    return 'cafe'
  }
  if (category.includes('음식점') || category.includes('맛집') || category.includes('한식') || category.includes('중식') || category.includes('일식') || category.includes('양식')) {
    return 'food'
  }
  if (category.includes('관광') || category.includes('명소') || category.includes('공원')) {
    return 'attraction'
  }
  if (category.includes('쇼핑') || category.includes('시장') || category.includes('백화점')) {
    return 'shopping'
  }
  if (category.includes('박물관') || category.includes('미술관') || category.includes('문화')) {
    return 'culture'
  }
  if (category.includes('숙박') || category.includes('호텔')) {
    return 'accommodation'
  }
  if (category.includes('교통') || category.includes('역') || category.includes('터미널')) {
    return 'transport'
  }
  if (category.includes('야경') || category.includes('클럽') || category.includes('바')) {
    return 'nightlife'
  }
  return 'attraction' // 기본값
}

type ResultTransportType = 'driving' | 'transit' | 'walking' | 'bicycle' | 'other';

const mapPlanTransportToResultType = (planTransport: string | undefined): ResultTransportType => {
  switch (planTransport) {
    case 'public':
      return 'transit';
    case 'rental-car':
      return 'driving';
    case 'walk':
      return 'walking';
    case 'bicycle':
      return 'bicycle';
    case 'other':
      return 'other';
    default:
      return 'driving';
  }
};

export function ResultStep() {
  const { planData, setCurrentStep, resetPlanData, setIsGenerating, isGenerating } = useTravelPlannerStore()
  const [generationComplete, setGenerationComplete] = useState(false)
  const [showMap, setShowMap] = useState(true) // 기본적으로 지도 표시
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true) // 왼쪽 패널 상태
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>([])
  const [optimizedItinerary, setOptimizedItinerary] = useState<{ [day: number]: RecommendedPlace[] }>({})
  const [loadingPlaces, setLoadingPlaces] = useState(false)
  const [placeSearchError, setPlaceSearchError] = useState<string | null>(null)
  const [selectedTransportType, setSelectedTransportType] = useState<ResultTransportType>(() => mapPlanTransportToResultType(planData.localTransport))
  const [isTransportMenuOpen, setIsTransportMenuOpen] = useState(false)
  const [validatedTransportPoint, setValidatedTransportPoint] = useState<string | null>(null)

  // 드롭다운 외부 클릭시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-transport-dropdown]')) {
        setIsTransportMenuOpen(false);
      }
    };

    if (isTransportMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isTransportMenuOpen]);

  // 교통시설 미리 검증
  useEffect(() => {
    const validateTransport = async () => {
      if (planData.destination && planData.destinationTransport && 
          ['airplane', 'ktx', 'train', 'bus'].includes(planData.destinationTransport)) {
        try {
          const point = await getValidatedTransportPoint(
            planData.destination, 
            planData.destinationTransport as 'airplane' | 'ktx' | 'train' | 'bus'
          );
          setValidatedTransportPoint(point);
        } catch (error) {
          console.error('교통시설 사전 검증 실패:', error);
          setValidatedTransportPoint(null);
        }
      } else {
        setValidatedTransportPoint(null);
      }
    };

    validateTransport();
  }, [planData.destination, planData.destinationTransport]);

  // 모든 마커를 포함하는 최적 지도 범위 계산
  const calculateOptimalMapBounds = (places: Array<{ lat: number; lng: number }>) => {
    if (places.length <= 1) {
      return { level: 8, center: places[0] || { lat: 37.5665, lng: 126.9780 } };
    }
    
    // 모든 마커의 경계 계산
    const lats = places.map(p => p.lat);
    const lngs = places.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // 경계에 여백 추가 (5% 패딩으로 축소)
    const latPadding = (maxLat - minLat) * 0.05; // 15%에서 5%로 축소
    const lngPadding = (maxLng - minLng) * 0.05;
    
    const paddedMinLat = minLat - latPadding;
    const paddedMaxLat = maxLat + latPadding;
    const paddedMinLng = minLng - lngPadding;
    const paddedMaxLng = maxLng + lngPadding;
    
    // 중심점 계산
    const centerLat = (paddedMinLat + paddedMaxLat) / 2;
    const centerLng = (paddedMinLng + paddedMaxLng) / 2;
    
    // 경계 범위 계산
    const latRange = paddedMaxLat - paddedMinLat;
    const lngRange = paddedMaxLng - paddedMinLng;
    const maxRange = Math.max(latRange, lngRange);
    
    // 더 확대된 줌 레벨 설정 (숫자가 낮을수록 더 확대됨)
    let level;
    if (maxRange > 0.3) level = 9;        // 매우 넓은 범위 → 적당히 축소
    else if (maxRange > 0.15) level = 8;  // 넓은 범위
    else if (maxRange > 0.08) level = 7;  // 중간 범위  
    else if (maxRange > 0.04) level = 6;  // 좁은 범위
    else if (maxRange > 0.02) level = 5;  // 매우 좁은 범위
    else if (maxRange > 0.01) level = 4;  // 근거리
    else level = 3;                       // 매우 가까운 장소들
    
    console.log(`지도 범위 최적화: 범위=${maxRange.toFixed(4)}, 레벨=${level}, 중심=(${centerLat.toFixed(4)}, ${centerLng.toFixed(4)})`);
    
    return {
      level,
      center: { lat: centerLat, lng: centerLng }
    };
  };

  // 모든 마커를 포함하는 최적 지도 설정 계산
  const mapSettings = useMemo(() => {
    // 1. 추천 장소들이 있으면 모든 마커를 포함하는 범위 계산
    const allPlaces = Object.values(optimizedItinerary).flat();
    if (allPlaces.length > 0) {
      const bounds = calculateOptimalMapBounds(allPlaces);
      console.log(`지도를 모든 추천 장소를 포함하도록 조정: 레벨=${bounds.level}`);
      return bounds;
    }
    
    // 2. 기본 추천 장소들이 있으면 사용
    if (recommendedPlaces.length > 0) {
      const bounds = calculateOptimalMapBounds(recommendedPlaces);
      console.log(`지도를 모든 추천 장소를 포함하도록 조정: 레벨=${bounds.level}`);
      return bounds;
    }
    
    // 3. 추천 장소가 없으면 기본 도시 중심점 사용
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
    
    const defaultCenter = destinations[planData.destination || ''] || { lat: 37.5665, lng: 126.9780 };
    return { level: 8, center: defaultCenter };
  }, [planData.destination, optimizedItinerary, recommendedPlaces]);

  // 개별적으로 center와 level 추출
  const mapCenter = mapSettings.center;
  const mapLevel = mapSettings.level;

  const mapMarkers = useMemo(() => {
    // 최적화된 일정이 있으면 날짜별로 순서가 있는 마커 생성
    if (Object.keys(optimizedItinerary).length > 0) {
      const markers: Array<{
        lat: number;
        lng: number;
        name: string;
        description: string;
        order?: number;
        day?: number;
      }> = [];
      
      // 각 날짜별로 순서대로 마커 추가
      Object.entries(optimizedItinerary).forEach(([dayStr, places]) => {
        const day = parseInt(dayStr);
        places.forEach((place, index) => {
          // 카테고리에 따른 아이콘 설정
          let icon = '';
          if (place.category.includes('숙소 체크인')) {
            icon = '🏨 ';
          } else if (place.category.includes('숙소 체크아웃')) {
            icon = '🛄 ';
          } else if (place.category.includes('음식점') || place.category.includes('맛집')) {
            icon = '🍽️ ';
          } else if (place.category.includes('카페')) {
            icon = '☕ ';
          } else if (place.category.includes('관광') || place.category.includes('명소')) {
            icon = '🏛️ ';
          } else if (place.category.includes('쇼핑')) {
            icon = '🛍️ ';
          } else {
            icon = '📍 ';
          }
          
          markers.push({
            lat: place.lat,
            lng: place.lng,
            name: `${day + 1}일차 ${index + 1}번: ${icon}${place.name.replace('🏨 ', '').replace('🛄 ', '')}`,
            description: `${place.rating && place.rating > 0 ? `⭐ ${place.rating}` : ''}${place.reviewCount && place.reviewCount > 0 ? ` (${place.reviewCount}명)` : ''} | ${place.category}`,
            order: index + 1,
            day: day + 1
          });
        });
      });
      
      return markers;
    }
    
    // 기본 추천 장소들이 있으면 사용 (순서 없음) - 중복 제거
    if (recommendedPlaces.length > 0) {
      // 중복 제거: 같은 이름의 장소는 한 번만 포함
      const uniquePlaces = recommendedPlaces.filter((place, index, arr) => 
        arr.findIndex(p => p.name === place.name) === index
      );
      
      return uniquePlaces.slice(0, 10).map((place, index) => ({
        lat: place.lat,
        lng: place.lng,
        name: place.name,
        description: `${place.rating && place.rating > 0 ? `⭐ ${place.rating}` : ''}${place.reviewCount && place.reviewCount > 0 ? ` (${place.reviewCount}명)` : ''} | ${place.category}`
      }));
    }
    
    // 실제로는 AI가 생성한 일정에서 마커를 만들어야 함
    
    if (planData.destination === '서울' || !planData.destination) {
      return sampleDestinations
    }

    // 다른 도시의 경우 중심점만 표시
    return [{
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      name: planData.destination || '여행지',
      description: '선택하신 여행 목적지'
    }]
  }, [optimizedItinerary, recommendedPlaces, planData.destination, mapCenter]);

  useEffect(() => {
    // AI 일정 생성 시뮬레이션
    setIsGenerating(true)
    setPlaceSearchError(null)
    
    const generateRecommendations = async () => {
      if (planData.destination && planData.interests) {
        setLoadingPlaces(true)
        try {
          console.log('장소 추천 시작:', planData.destination, planData.interests)
          
          // 여행 일수 계산
          const days = planData.startDate && planData.endDate 
            ? Math.ceil((new Date(planData.endDate).getTime() - new Date(planData.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1;
          
          console.log('계산된 여행 일수:', days)
          
          // 기본 시작 위치 계산 (순환 의존성 방지)
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
          const startLocation = destinations[planData.destination] || { lat: 37.5665, lng: 126.9780 };
          
          // 예약한 숙소 정보 준비
          const bookedAccommodation = planData.hasBookedAccommodation && planData.accommodationName && planData.accommodationLocation ? {
            name: planData.accommodationName,
            address: planData.accommodationLocation.address,
            lat: planData.accommodationLocation.lat,
            lng: planData.accommodationLocation.lng
          } : undefined;

          console.log('예약한 숙소 정보:', bookedAccommodation);

          // 필수 방문 장소 정보 준비
          const mustVisitPlaces = planData.mustVisitPlaces || [];
          console.log('필수 방문 장소:', mustVisitPlaces);

          // 최적화된 일정 생성 (숙소 타입, 예약한 숙소, 필수 방문 장소 정보 포함)
          const itinerary = await generateOptimizedItinerary(
            planData.destination,
            planData.interests,
            days,
            startLocation,
            'driving', // 기본 교통수단
            planData.accommodationType || 'hotel', // 숙소 타입 전달
            bookedAccommodation, // 예약한 숙소 정보 전달
            mustVisitPlaces // 필수 방문 장소 전달
          );
          
          console.log('생성된 일정:', itinerary)
          setOptimizedItinerary(itinerary);
          
          // 모든 추천 장소들을 평면화해서 저장 (지도 표시용)
          const allPlaces = Object.values(itinerary).flat();
          setRecommendedPlaces(allPlaces);
          
          console.log('최적화된 일정 생성 완료:', days, '일간', allPlaces.length, '개 장소');
          console.log('지도가 추천 장소들을 중심으로 자동 이동합니다.');
          setPlaceSearchError(null);
        } catch (error) {
          console.error('장소 추천 오류:', error)
          const errorMessage = error instanceof Error ? error.message : '장소 검색에 실패했습니다.'
          setPlaceSearchError(errorMessage)
          // 에러가 발생해도 빈 배열로 진행 (기본 일정 표시)
          setRecommendedPlaces([])
          setOptimizedItinerary({})
        }
        setLoadingPlaces(false)
      } else {
        console.log('필수 정보 누락:', { destination: planData.destination, interests: planData.interests })
        setPlaceSearchError('여행지 또는 관심사 정보가 없습니다.')
      }
    }
    
    // 3초 후 완료
    const timer = setTimeout(async () => {
      try {
        await generateRecommendations()
      } catch (error) {
        console.error('일정 생성 전체 오류:', error)
        setPlaceSearchError('일정 생성 중 예기치 않은 오류가 발생했습니다.')
      } finally {
        setIsGenerating(false)
        setGenerationComplete(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [setIsGenerating, planData.destination, planData.interests, planData.startDate, planData.endDate])

  const handlePrevious = () => {
    setCurrentStep(7) // 필수 방문 장소 단계로 돌아가기
  }

  const handleStartOver = () => {
    if (window.confirm('새로운 여행을 계획하시겠습니까? 현재 일정이 모두 삭제됩니다.')) {
      resetPlanData();
      // 홈페이지로 이동
      window.location.href = '/';
    }
  }

  const handleDownloadCalendar = () => {
    // TODO: 캘린더 다운로드 기능 구현
    alert('캘린더 다운로드 기능은 추후 구현 예정입니다.')
  }

  const handleShare = () => {
    // TODO: 공유 기능 구현
    alert('공유 기능은 추후 구현 예정입니다.')
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
                <BarChart3 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">AI 분석 중...</p>
                <p className="text-sm text-gray-700">
                  📍 카카오맵 기반 장소 검색<br />
                  🎯 사용자 선호도 분석<br />
                  ⭐ 장소별 평점 및 리뷰 수집<br />
                  🗺️ 최적 경로 계산<br />
                  ⏰ 시간표 최적화<br />
                  💰 예산 맞춤 조정
                </p>
                {loadingPlaces && (
                  <p className="text-xs text-blue-600 mt-2">
                    🔍 {planData.destination}의 맞춤 장소를 찾는 중...
                  </p>
                )}
                {placeSearchError && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      ⚠️ 실시간 장소 검색에 문제가 발생했습니다.<br />
                      <span className="text-yellow-600">{placeSearchError}</span><br />
                      기본 일정으로 진행합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* 에러 알림 */}
      {placeSearchError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-yellow-600">⚠️</div>
            <div className="text-sm">
              <p className="font-medium text-yellow-800">실시간 장소 검색에 문제가 발생했습니다</p>
              <p className="text-yellow-700 mt-1">{placeSearchError}</p>
              <p className="text-yellow-600 text-xs mt-1">
                아래 일정은 기본 추천 장소로 구성되었습니다. 브라우저를 새로고침하면 다시 시도할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* 여행 정보 요약 - 전체 너비 활용 */}
      <Card className="w-full">
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
                <span className="font-medium text-gray-900">
                  {planData.travelers}명
                  {planData.ageGroupCounts && Object.keys(planData.ageGroupCounts).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Object.entries(planData.ageGroupCounts)
                        .filter(([_, count]) => count > 0)
                        .map(([ageGroup, count]) => {
                          const ageLabels: { [key: string]: string } = {
                            '10s': '10대', '20s': '20대', '30s': '30대', 
                            '40s': '40대', '50s': '50대', '60+': '60대+'
                          };
                          return `${ageLabels[ageGroup] || ageGroup}: ${count}명`;
                        })
                        .join(', ')}
                    </div>
                  )}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">여행지까지:</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    {(() => {
                      const destinationTransportLabels: { [key: string]: string } = {
                        'airplane': '비행기',
                        'ktx': 'KTX', 
                        'train': '일반열차',
                        'bus': '시외버스',
                        'car': '자가용',
                        'other': '기타'
                      };
                      return destinationTransportLabels[planData.destinationTransport || 'airplane'] || '비행기';
                    })()}
                  </span>
                  {validatedTransportPoint && (
                    <div className="text-xs text-green-600 mt-1">
                      ✅ {validatedTransportPoint}
                    </div>
                  )}
                  {!validatedTransportPoint && planData.destinationTransport && 
                   ['airplane', 'ktx', 'train', 'bus'].includes(planData.destinationTransport) && (
                    <div className="text-xs text-orange-600 mt-1">
                      ⚠️ 해당 교통시설 없음
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">현지 이동:</span>
                <span className="font-medium text-gray-900">
                  {(() => {
                    const transportLabels: { [key: string]: string } = {
                      'public': '대중교통',
                      'walk': '도보',
                      'bicycle': '자전거', 
                      'rental-car': '렌트카',
                      'other': '기타'
                    };
                    return transportLabels[planData.localTransport || 'public'] || '대중교통';
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">숙소 형태:</span>
                <span className="font-medium text-gray-900">{planData.accommodationType}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼들 - 지도와 일정 위에 배치 */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-6 p-4 border border-gray-200 bg-white rounded-lg shadow-sm">
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
          <Repeat className="w-4 h-4" />
          새로운 여행 계획
        </Button>
      </div>

      {/* 일정과 지도 좌우 배치 - 전체 화면 너비 활용 */}
      <div className="relative min-h-[800px] w-full">
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

        <div className="flex gap-4 h-[800px] w-full">
          {/* 왼쪽: AI 추천 일정 */}
          <div className={`transition-all duration-300 ease-in-out ${
            isLeftPanelOpen ? 'w-1/2 opacity-100 h-full' : 'w-0 opacity-0 overflow-hidden'
          }`}>
            {isLeftPanelOpen && (
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-gray-900">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      AI 추천 일정
                    </div>
                    {/* 교통수단 선택 */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">교통수단:</span>
                      <div className="relative" data-transport-dropdown>
                        {/* 현재 선택된 교통수단 표시 버튼 */}
                        <button
                          onClick={() => setIsTransportMenuOpen(!isTransportMenuOpen)}
                          className="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200 transition-colors flex items-center gap-2"
                        >
                          {(() => {
                            const currentTransport = [
                              { type: 'driving' as const, icon: '🚗', label: '자동차' },
                              { type: 'transit' as const, icon: '🚌', label: '대중교통' },
                              { type: 'walking' as const, icon: '🚶', label: '도보' },
                              { type: 'bicycle' as const, icon: '🚴', label: '자전거' },
                              { type: 'other' as const, icon: '🚕', label: '기타' }
                            ].find(t => t.type === selectedTransportType);
                            return currentTransport ? `${currentTransport.icon} ${currentTransport.label}` : '🚗 자동차';
                          })()}
                          <span className="text-xs">▼</span>
                        </button>

                        {/* 다른 교통수단 옵션들 (드롭다운) */}
                        {isTransportMenuOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 min-w-[140px]">
                            <div className="py-1">
                              <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100">다른 교통수단</div>
                              {[
                                { type: 'driving' as const, icon: '🚗', label: '자동차' },
                                { type: 'transit' as const, icon: '🚌', label: '대중교통' },
                                { type: 'walking' as const, icon: '🚶', label: '도보' },
                                { type: 'bicycle' as const, icon: '🚴', label: '자전거' },
                                { type: 'other' as const, icon: '🚕', label: '기타' }
                              ].filter(t => t.type !== selectedTransportType).map(({ type, icon, label }) => (
                                <button
                                  key={type}
                                  onClick={() => {
                                    setSelectedTransportType(type);
                                    setIsTransportMenuOpen(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                  title={`${label}로 경로 재계산`}
                                >
                                  {icon} {label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                  <div className="space-y-6">
                    {planData.startDate && planData.endDate ? (
                      (() => {
                        try {
                          const startDate = new Date(planData.startDate);
                          const endDate = new Date(planData.endDate);
                          const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          
                          return Array.from({ length: dayCount }).map((_, dayIndex) => {
                            const currentDate = new Date(startDate.getTime() + dayIndex * 24 * 60 * 60 * 1000);
                            
                            // 여행지별 구체적인 일정 데이터
                            const getSpecificItinerary = (destination: string, day: number) => {
                              // 검증된 교통시설 정보를 가져오는 함수
                              const getTransportPoints = async (transport: string | undefined, destination: string): Promise<string | null> => {
                                if (transport === 'car' || transport === 'other') {
                                  return null; // 자가용이나 기타는 특별한 시작/끝점 없음
                                }
                                
                                const transportTypeMap: { [key: string]: 'airplane' | 'ktx' | 'train' | 'bus' } = {
                                  'airplane': 'airplane',
                                  'ktx': 'ktx',
                                  'train': 'train',
                                  'bus': 'bus'
                                };
                                
                                const transportType = transportTypeMap[transport || 'airplane'];
                                if (!transportType) return null;
                                
                                try {
                                  // 실제 존재하는 교통시설만 반환
                                  const validatedPoint = await getValidatedTransportPoint(destination, transportType);
                                  return validatedPoint;
                                } catch (error) {
                                  console.error('교통시설 검증 오류:', error);
                                  // API 오류 시에도 잘못된 정보는 표시하지 않음
                                  return null;
                                }
                              };
                              
                              // 미리 검증된 교통시설 사용
                              const transportPoint = validatedTransportPoint;
                              const isFirstDay = day === 0;
                              const isLastDay = day === dayCount - 1;
                              
                              // 최적화된 일정이 있으면 해당 사용 (우선순위 1)
                              if (optimizedItinerary && optimizedItinerary[dayIndex] && optimizedItinerary[dayIndex].length > 0) {
                                const dayPlaces = optimizedItinerary[dayIndex];
                                console.log(`${dayIndex + 1}일차 최적화된 일정 사용:`, dayPlaces.map(p => p.name));
                                
                                // 최적화된 일정을 새로운 형식으로 변환
                                let itinerary = dayPlaces.map((place, index) => ({
                                  time: place.scheduledTime || generateTimeSlot(index),
                                  activity: place.name,
                                  location: place.roadAddress || place.address,
                                  type: categorizePlace(place.category),
                                  description: place.description || place.category,
                                  rating: place.rating,
                                  reviewCount: place.reviewCount,
                                  matchScore: place.matchScore,
                                  phone: place.phone,
                                  // 새로운 형식 정보 추가
                                  timeSlot: place.timeSlot,
                                  activityType: place.activityType,
                                  scheduledTime: place.scheduledTime,
                                  orderIndex: place.orderIndex,
                                  tags: place.tags,
                                  isOptimized: true
                                }));

                                // 교통편 정보 추가 (첫날/마지막날)
                                if (transportPoint) {
                                  if (isFirstDay) {
                                    itinerary.unshift({
                                      time: '08:00',
                                      activity: `${transportPoint} 도착`,
                                      location: transportPoint,
                                      type: 'transport',
                                      description: '여행지 도착',
                                      rating: 0,
                                      reviewCount: 0,
                                      matchScore: 0,
                                      phone: '',
                                      tags: ['교통'],
                                      timeSlot: 'early_morning' as 'early_morning',
                                      activityType: 'transport' as 'transport',
                                      scheduledTime: '08:00',
                                      orderIndex: -1,
                                      isOptimized: true
                                    });
                                  } else if (isLastDay) {
                                    itinerary.push({
                                      time: '18:00',
                                      activity: `${transportPoint} 출발`,
                                      location: transportPoint,
                                      type: 'transport',
                                      description: '여행지 출발',
                                      rating: 0,
                                      reviewCount: 0,
                                      matchScore: 0,
                                      phone: '',
                                      tags: ['교통'],
                                      timeSlot: 'evening' as 'evening',
                                      activityType: 'transport' as 'transport',
                                      scheduledTime: '18:00',
                                      orderIndex: 999,
                                      isOptimized: true
                                    });
                                  }
                                }

                                // orderIndex나 scheduledTime 기준으로 정렬
                                itinerary.sort((a, b) => {
                                  if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                                    return a.orderIndex - b.orderIndex;
                                  }
                                  return a.time.localeCompare(b.time);
                                });

                                return itinerary;
                              }
                              
                              // 실제 추천된 장소가 있으면 우선 활용 (기존 로직)
                              if (recommendedPlaces.length > 0) {
                                // 이미 사용된 장소들을 추적하기 위한 Set
                                const usedPlaces = new Set<string>();
                                
                                // 모든 날짜의 사용된 장소들을 먼저 수집
                                for (let d = 0; d < dayCount; d++) {
                                  if (d < dayIndex) { // 현재 날짜 이전의 날짜들만
                                    const prevDayPlaces = recommendedPlaces.slice(d * 8, (d + 1) * 8);
                                    prevDayPlaces.forEach(place => usedPlaces.add(place.name));
                                  }
                                }
                                
                                // 현재 날짜에 사용할 장소들 선택 (중복 제거)
                                const availablePlaces = recommendedPlaces.filter(place => !usedPlaces.has(place.name));
                                const dayPlaces = availablePlaces.slice(0, 8); // 하루에 최대 8개 장소
                                
                                if (dayPlaces.length > 0) {
                                  // 시간대별로 장소 타입 배치
                                  const sortedPlaces = sortPlacesByTimeAndType(dayPlaces);
                                  
                                  let itinerary = sortedPlaces.map((place, index) => ({
                                    time: generateTimeSlot(index),
                                    activity: place.name,
                                    location: place.roadAddress || place.address,
                                    type: categorizePlace(place.category),
                                    description: place.category,
                                    rating: place.rating,
                                    reviewCount: place.reviewCount,
                                    matchScore: place.matchScore,
                                    phone: place.phone
                                  }));
                                  
                                  // 추천 장소 일정에도 교통편 추가 (숙소는 이미 추천 시스템에서 추가됨)
                                  if (transportPoint) {
                                    if (isFirstDay) {
                                      itinerary.unshift({
                                        time: '08:00',
                                        activity: `${transportPoint} 도착`,
                                        location: transportPoint,
                                        type: 'transport',
                                        description: '여행지 도착',
                                        rating: 0,
                                        reviewCount: 0,
                                        matchScore: 0,
                                        phone: ''
                                      });
                                    } else if (isLastDay) {
                                      itinerary.push({
                                        time: '18:00',
                                        activity: `${transportPoint} 출발`,
                                        location: transportPoint,
                                        type: 'transport',
                                        description: '여행지 출발',
                                        rating: 0,
                                        reviewCount: 0,
                                        matchScore: 0,
                                        phone: ''
                                      });
                                    }
                                  }
                                  
                                  // 주의: 숙소 체크인/체크아웃은 place-recommendation.ts에서 자동으로 추가되므로 
                                  // 여기서는 추가하지 않음 (중복 방지)
                                  
                                  return itinerary;
                                }
                              }
                              
                              // 추천된 장소가 부족하거나 없으면 기본 일정 사용
                              const itineraries: { [key: string]: { [key: number]: any[] } } = {
                                '속초': {
                                  0: [
                                    { time: '09:00', activity: '속초항 도착 및 체크인', location: '속초항', type: 'transport' },
                                    { time: '10:00', activity: '속초해수욕장', location: '강원도 속초시 조양동', type: 'attraction', description: '동해안 대표 해수욕장, 설악산 조망' },
                                    { time: '12:00', activity: '속초중앙시장 맛집', location: '속초중앙시장 "장칼국수"', type: 'food', description: '속초 대표 장칼국수와 순대' },
                                    { time: '14:00', activity: '설악산 국립공원', location: '설악산 신흥사', type: 'attraction', description: '권금성 케이블카, 신흥사 탐방' },
                                    { time: '16:30', activity: '속초관광수산시장', location: '속초관광수산시장', type: 'shopping', description: '신선한 해산물과 특산품' },
                                    { time: '18:00', activity: '닭강정 맛집', location: '속초 "원조 닭강정"', type: 'food', description: '속초 3대 닭강정 맛집' },
                                    { time: '20:00', activity: '속초해변 야경', location: '속초해수욕장', type: 'attraction', description: '바다 야경과 산책' }
                                  ],
                                  1: [
                                    { time: '09:00', activity: '청초호', location: '속초시 청초호반로', type: 'attraction', description: '청초호 둘레길 산책' },
                                    { time: '11:00', activity: '외옹치해변', location: '외옹치해변', type: 'attraction', description: '한적한 바다 풍경' },
                                    { time: '12:30', activity: '해산물 정식', location: '외옹치 "바다횟집"', type: 'food', description: '신선한 회와 해산물탕' },
                                    { time: '14:30', activity: '낙산해수욕장', location: '양양군 낙산해수욕장', type: 'attraction', description: '낙산사와 해변 탐방' },
                                    { time: '16:00', activity: '낙산사', location: '낙산사', type: 'attraction', description: '관음보살 기도처, 바다 전망' },
                                    { time: '18:00', activity: '양양 송이버섯 요리', location: '양양 "송이마을"', type: 'food', description: '양양 특산 송이버섯 요리' },
                                    { time: '20:00', activity: '낙산해변 일몰', location: '낙산해수욕장', type: 'attraction', description: '동해안 일몰 명소' }
                                  ]
                                },
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
                              };
                              
                              let defaultItinerary = itineraries[destination]?.[day] || (isLastDay ? [
                                // 마지막 날: 15시까지만 일정 (18시 출발 고려)
                                { time: '09:00', activity: '호텔 조식 및 체크아웃', location: '숙소', type: 'accommodation' },
                                { time: '10:30', activity: `${destination} 주요 관광지 방문`, location: destination, type: 'attraction' },
                                { time: '12:30', activity: '현지 맛집에서 점심', location: `${destination} 맛집`, type: 'food' },
                                { time: '14:00', activity: '마지막 여행지 관광 (간단히)', location: `${destination} 명소`, type: 'attraction' }
                              ] : [
                                // 일반 날짜: 기존 일정
                                { time: '09:00', activity: '호텔 조식 및 체크아웃', location: '숙소', type: 'accommodation' },
                                { time: '10:30', activity: `${destination} 주요 관광지 방문`, location: destination, type: 'attraction' },
                                { time: '12:30', activity: '현지 맛집에서 점심', location: `${destination} 맛집`, type: 'food' },
                                { time: '14:00', activity: '문화 체험 및 쇼핑', location: `${destination} 쇼핑가`, type: 'shopping' },
                                { time: '18:00', activity: '저녁 식사 및 야경 감상', location: `${destination} 야경 명소`, type: 'food' }
                              ]);
                              
                              // 기본 일정에도 교통편 및 숙소 추가
                              if (transportPoint) {
                                if (isFirstDay) {
                                  defaultItinerary.unshift({
                                    time: '08:00',
                                    activity: `${transportPoint} 도착`,
                                    location: transportPoint,
                                    type: 'transport',
                                    description: '여행지 도착'
                                  });
                                  
                                  defaultItinerary.push({
                                    time: '21:00',
                                    activity: '숙소 체크인',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크인 및 휴식'
                                  });
                                } else if (isLastDay) {
                                  defaultItinerary.unshift({
                                    time: '08:00',
                                    activity: '숙소 체크아웃',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크아웃'
                                  });
                                  
                                  defaultItinerary.push({
                                    time: '18:00',
                                    activity: `${transportPoint} 출발`,
                                    location: transportPoint,
                                    type: 'transport',
                                    description: '여행지 출발'
                                  });
                                } else {
                                  defaultItinerary.unshift({
                                    time: '08:00',
                                    activity: '숙소 체크아웃',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크아웃'
                                  });
                                  
                                  defaultItinerary.push({
                                    time: '21:00',
                                    activity: '숙소 체크인',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크인 및 휴식'
                                  });
                                }
                              } else {
                                if (isFirstDay) {
                                  defaultItinerary.push({
                                    time: '21:00',
                                    activity: '숙소 체크인',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크인 및 휴식'
                                  });
                                } else if (isLastDay) {
                                  defaultItinerary.unshift({
                                    time: '08:00',
                                    activity: '숙소 체크아웃',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크아웃'
                                  });
                                } else {
                                  defaultItinerary.unshift({
                                    time: '08:00',
                                    activity: '숙소 체크아웃',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크아웃'
                                  });
                                  
                                  defaultItinerary.push({
                                    time: '21:00',
                                    activity: '숙소 체크인',
                                    location: `${planData.destination} 숙소`,
                                    type: 'accommodation',
                                    description: '호텔/펜션 체크인 및 휴식'
                                  });
                                }
                              }
                              
                              return defaultItinerary;
                            };
                            
                            const dayItinerary = getSpecificItinerary(planData.destination || '서울', dayIndex);
                            
                            const getActivityIcon = (type: string, activityType?: string) => {
                              // 새로운 activityType 우선 적용
                              if (activityType) {
                                switch (activityType) {
                                  case 'dining': return '🍽️';
                                  case 'attraction': return '🏛️';
                                  case 'culture': return '🎭';
                                  case 'shopping': return '🛍️';
                                  case 'accommodation': return '🏨';
                                  case 'transport': return '🚗';
                                  case 'must_visit': return '⭐';
                                  default: break;
                                }
                              }
                              
                              // 기존 type 기반 아이콘 (호환성 유지)
                              switch (type) {
                                case 'food': return '🍽️';
                                case 'attraction': return '🏛️';
                                case 'shopping': return '🛍️';
                                case 'transport': return '🚗';
                                case 'accommodation': return '🏨';
                                case 'checkin': return '🏨';
                                case 'checkout': return '🛄';
                                default: return '📍';
                              }
                            };

                            const getTimeSlotLabel = (timeSlot?: string) => {
                              switch (timeSlot) {
                                case 'early_morning': return '🌅 아침';
                                case 'morning': return '🌄 오전';
                                case 'lunch': return '🍴 점심';
                                case 'afternoon': return '☀️ 오후';
                                case 'evening': return '🌆 저녁';
                                case 'night': return '🌙 밤';
                                default: return '';
                              }
                            };

                            const getTimeSlotColor = (timeSlot?: string) => {
                              switch (timeSlot) {
                                case 'early_morning': return 'bg-orange-50 border-orange-200 text-orange-700';
                                case 'morning': return 'bg-blue-50 border-blue-200 text-blue-700';
                                case 'lunch': return 'bg-green-50 border-green-200 text-green-700';
                                case 'afternoon': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
                                case 'evening': return 'bg-purple-50 border-purple-200 text-purple-700';
                                case 'night': return 'bg-indigo-50 border-indigo-200 text-indigo-700';
                                default: return 'bg-gray-50 border-gray-200 text-gray-700';
                              }
                            };

                            const getActivityTypeLabel = (activityType?: string) => {
                              switch (activityType) {
                                case 'dining': return '식사';
                                case 'attraction': return '관광';
                                case 'culture': return '문화';
                                case 'shopping': return '쇼핑';
                                case 'accommodation': return '숙박';
                                case 'transport': return '이동';
                                case 'must_visit': return '필수';
                                default: return '기타';
                              }
                            };
                            
                            return (
                              <div key={dayIndex} className="border-l-4 border-blue-500 pl-6">
                                <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                                  {format(currentDate, 'M월 d일 (EEE)', { locale: ko })}
                                </h4>
                                <div className="space-y-3">
                                  {dayItinerary.map((item, itemIndex) => (
                                    <div key={itemIndex} className="space-y-2">
                                      {/* 이동시간 정보 표시 (첫 번째가 아닌 경우이고, 이동시간이 0이 아닌 경우) */}
                                      {itemIndex > 0 && (
                                        <div className="space-y-1">
                                          {(() => {
                                            // 실제 좌표 기반 이동시간 계산
                                            const currentPlace = dayItinerary[itemIndex];
                                            const previousPlace = dayItinerary[itemIndex - 1];
                                            
                                            // 기본값 (좌표 정보가 없는 경우)
                                            let distance = 1.5;
                                            let walkingTime = 18;
                                            let drivingTime = 8;
                                            let bicycleTime = 6;
                                            let taxiCost = 4800;
                                            let drivingCost = 750;
                                            let transitCost = 1400;
                                            
                                            // 추천 장소에서 좌표 정보 활용 (optimizedItinerary 사용)
                                            const optimizedDayPlaces = optimizedItinerary[dayIndex] || [];
                                            
                                            if (optimizedDayPlaces.length > itemIndex && optimizedDayPlaces.length > itemIndex - 1) {
                                              const currentOptimizedPlace = optimizedDayPlaces[itemIndex];
                                              const previousOptimizedPlace = optimizedDayPlaces[itemIndex - 1];
                                              
                                              if (currentOptimizedPlace && previousOptimizedPlace) {
                                                const travelInfo = calculateTravelTime(
                                                  previousOptimizedPlace.lat,
                                                  previousOptimizedPlace.lng,
                                                  currentOptimizedPlace.lat,
                                                  currentOptimizedPlace.lng,
                                                  selectedTransportType === 'driving' ? 'driving' : 
                                                  selectedTransportType === 'walking' ? 'walking' : 'transit'
                                                );
                                                
                                                distance = travelInfo.distanceKm;
                                                drivingTime = travelInfo.durationMinutes;
                                                walkingTime = Math.ceil((distance / 4) * 60); // 시속 4km
                                                bicycleTime = Math.ceil((distance / 15) * 60); // 시속 15km
                                                taxiCost = Math.ceil(3800 + (distance * 1000));
                                                drivingCost = Math.ceil(distance * 500);
                                                transitCost = distance > 10 ? 2150 : 1400;
                                              }
                                            }
                                            
                                            if (selectedTransportType === 'driving') {
                                              // 자동차/자차 선택시 → 자차 정보만 표시 (단, 이동시간이 0이 아닌 경우에만)
                                              if (drivingTime > 0 && distance > 0) {
                                                return (
                                                  <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-blue-50 rounded-lg px-3 py-2">
                                                    <Navigation className="w-4 h-4 text-blue-500" />
                                                    <span>이동시간: {drivingTime}분</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>거리: {distance.toFixed(1)}km</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>예상비용: {drivingCost.toLocaleString()}원</span>
                                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">
                                                      🚗 자차
                                                    </span>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            } else if (selectedTransportType === 'transit') {
                                              // 대중교통 선택시 → 대중교통 + 도보 (이동시간이 0이 아닌 경우에만)
                                              if (drivingTime > 0 && distance > 0) {
                                                return (
                                                  <>
                                                    <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-purple-50 rounded-lg px-3 py-2">
                                                      <Navigation className="w-4 h-4 text-purple-500" />
                                                      <span>대중교통: {Math.ceil(drivingTime * 1.8)}분</span>
                                                      <span className="text-gray-400">•</span>
                                                      <span>{distance.toFixed(1)}km</span>
                                                      <span className="text-gray-400">•</span>
                                                      <span>{transitCost.toLocaleString()}원</span>
                                                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-auto">
                                                        🚌 대중교통
                                                      </span>
                                                    </div>
                                                    {/* 1km 미만일 때만 도보 정보 표시 */}
                                                    {distance < 1.0 && walkingTime > 0 && (
                                                      <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-green-50 rounded-lg px-3 py-2">
                                                        <Navigation className="w-4 h-4 text-green-500" />
                                                        <span>도보: {walkingTime}분</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span>{distance.toFixed(1)}km</span>
                                                        <span className="text-gray-400">•</span>
                                                        <span>무료</span>
                                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                                                          🚶 도보
                                                        </span>
                                                      </div>
                                                    )}
                                                  </>
                                                );
                                              }
                                              return null;
                                            } else if (selectedTransportType === 'walking') {
                                              // 도보 선택시 → 도보 정보만 표시 (이동시간이 0이 아닌 경우에만)
                                              if (walkingTime > 0 && distance > 0) {
                                                return (
                                                  <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-green-50 rounded-lg px-3 py-2">
                                                    <Navigation className="w-4 h-4 text-green-500" />
                                                    <span>이동시간: {walkingTime}분</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>거리: {distance.toFixed(1)}km</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>무료</span>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                                                      🚶 도보
                                                    </span>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            } else if (selectedTransportType === 'bicycle') {
                                              // 자전거 선택시 → 자전거 이동시간 표시 (이동시간이 0이 아닌 경우에만)
                                              if (bicycleTime > 0 && distance > 0) {
                                                return (
                                                  <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-orange-50 rounded-lg px-3 py-2">
                                                    <Navigation className="w-4 h-4 text-orange-500" />
                                                    <span>이동시간: {bicycleTime}분</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>거리: {distance.toFixed(1)}km</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>무료</span>
                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full ml-auto">
                                                      🚴 자전거
                                                    </span>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            } else {
                                              // 기타 선택시 → 택시 요금으로 표시 (이동시간이 0이 아닌 경우에만)
                                              if (drivingTime > 0 && distance > 0) {
                                                return (
                                                  <div className="flex items-center gap-2 ml-8 text-sm text-gray-500 bg-yellow-50 rounded-lg px-3 py-2">
                                                    <Navigation className="w-4 h-4 text-yellow-600" />
                                                    <span>택시: {Math.ceil(drivingTime * 0.9)}분</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>거리: {distance.toFixed(1)}km</span>
                                                    <span className="text-gray-400">•</span>
                                                    <span>요금: {taxiCost.toLocaleString()}원</span>
                                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-auto">
                                                      🚕 택시
                                                    </span>
                                                  </div>
                                                );
                                              }
                                              return null;
                                            }
                                          })()}
                                        </div>
                                      )}
                                      
                                                                             {/* 기존 활동 정보 - 새로운 형식으로 개선 */}
                                       <div className={`rounded-lg p-4 hover:shadow-md transition-all ${
                                         item.timeSlot ? getTimeSlotColor(item.timeSlot) : 'bg-gray-50 hover:bg-gray-100'
                                       } border-2`}>
                                         <div className="flex items-start gap-3">
                                           {/* 시간 및 아이콘 */}
                                           <div className="flex flex-col items-center gap-2 min-w-0">
                                             <div className="flex items-center gap-2">
                                               <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                               <span className="text-gray-700 font-medium text-sm">{item.time || item.scheduledTime}</span>
                                             </div>
                                             <span className="text-2xl">{getActivityIcon(item.type, item.activityType)}</span>
                                             {item.timeSlot && (
                                               <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                                                 {getTimeSlotLabel(item.timeSlot)}
                                               </span>
                                             )}
                                           </div>
                                           
                                           {/* 활동 정보 */}
                                           <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 mb-2 flex-wrap">
                                               <h5 className="font-semibold text-gray-900 text-base">{item.activity}</h5>
                                               
                                               {/* 활동 타입 뱃지 */}
                                               {item.activityType && (
                                                 <div className="px-2 py-1 bg-white/70 text-gray-700 text-xs rounded-full border">
                                                   {getActivityTypeLabel(item.activityType)}
                                                 </div>
                                               )}
                                               
                                               {/* 필수 방문 표시 */}
                                               {item.tags && item.tags.includes('필수방문') && (
                                                 <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                                   🌟 필수방문
                                                 </div>
                                               )}
                                               
                                               {/* 예약숙소 표시 */}
                                               {item.tags && item.tags.includes('예약숙소') && (
                                                 <div className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                   🏨 예약완료
                                                 </div>
                                               )}
                                               
                                               {/* 최적화됨 표시 */}
                                               {item.isOptimized && (
                                                 <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                   ✨ 최적화됨
                                                 </div>
                                               )}
                                             </div>
                                             
                                             {/* 위치 정보 */}
                                             <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                                               <MapPin className="w-3 h-3 flex-shrink-0" />
                                               {item.location}
                                             </p>
                                             
                                             {/* 설명 */}
                                             {item.description && (
                                               <p className="text-sm text-gray-600 mb-2 bg-white/50 rounded p-2">
                                                 {item.description}
                                               </p>
                                             )}
                                             
                                             {/* 평점 및 추가 정보 */}
                                             <div className="flex items-center gap-3 flex-wrap">
                                               {item.rating && item.rating > 0 && (
                                                 <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                                                   <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                                   <span className="text-xs text-yellow-700 font-medium">{item.rating}</span>
                                                   {item.reviewCount && item.reviewCount > 0 && (
                                                     <span className="text-xs text-yellow-600">({item.reviewCount})</span>
                                                   )}
                                                 </div>
                                               )}
                                               
                                               {item.matchScore && item.matchScore > 70 && (
                                                 <div className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                   🎯 매칭도 {Math.round(item.matchScore)}%
                                                 </div>
                                               )}
                                               
                                               {item.phone && (
                                                 <div className="text-xs text-gray-500 flex items-center gap-1">
                                                   <Phone className="w-3 h-3" />
                                                   {item.phone}
                                                 </div>
                                               )}
                                             </div>
                                             
                                             {/* 높은 평점 특별 표시 */}
                                             {item.rating && item.rating > 0 && item.rating >= 4.5 && (
                                               <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 rounded p-2">
                                                 🌟 높은 평점의 추천 장소입니다! ({item.rating}점)
                                               </div>
                                             )}
                                           </div>
                                         </div>
                                       </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        } catch (error) {
                          console.error('날짜 계산 오류:', error);
                          return (
                            <div className="text-center py-8">
                              <p className="text-gray-500">날짜 정보를 불러오는 중 오류가 발생했습니다.</p>
                              <p className="text-sm text-gray-400 mt-1">여행 기간을 다시 설정해주세요.</p>
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">여행 날짜가 설정되지 않았습니다.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 오른쪽: 카카오 지도 */}
          <div className={`transition-all duration-300 ease-in-out flex-1 h-full`}>
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
              <CardContent className="p-0 h-full">
                {showMap ? (
                  <div className="relative bg-gray-100 rounded-b-lg overflow-hidden h-full">
                    <KakaoMap
                      center={mapCenter}
                      markers={mapMarkers}
                      height="100%"
                      level={mapLevel}
                      className="w-full h-full"
                    />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded px-3 py-2 shadow-lg">
                      <p className="text-xs text-gray-700">
                        💡 지도의 마커를 클릭하면 장소명을 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-50 rounded-b-lg">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                        <Map className="w-10 h-10 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-600 mb-2">지도가 숨겨져 있습니다</h4>
                        <p className="text-sm text-gray-500">
                          상단의 '지도 보기' 버튼을 클릭하면 여행 경로를 지도에서 확인할 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  )
} 