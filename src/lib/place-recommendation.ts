// 장소 추천 시스템 - 네이버 + 카카오 API 조합
import { searchPlaces, KakaoPlace } from './kakao-map'

// 네이버 플레이스 API 타입 정의
interface NaverPlace {
  title: string
  link: string
  category: string
  description: string
  telephone: string
  address: string
  roadAddress: string
  mapx: string // longitude * 10000000
  mapy: string // latitude * 10000000
}

interface NaverSearchResponse {
  lastBuildDate: string
  total: number
  start: number
  display: number
  items: NaverPlace[]
}

// 통합 장소 정보 타입
export interface RecommendedPlace {
  id: string
  name: string
  category: string
  address: string
  roadAddress?: string
  lat: number
  lng: number
  rating?: number
  reviewCount?: number
  description?: string
  phone?: string
  tags?: string[]
  distance?: number
  matchScore?: number // 사용자 선호도 매칭 점수
  source: 'kakao' | 'naver' | 'combined'
}

// 사용자 선호도 기반 카테고리 매핑
const PREFERENCE_CATEGORY_MAP: { [key: string]: string[] } = {
  '맛집': ['음식점', '카페', '디저트', 'FD6', 'CE7'],
  '관광': ['관광명소', '박물관', '전시관', 'AT4', 'CT1'],
  '쇼핑': ['쇼핑몰', '백화점', '시장', 'MT1', 'CS2'],
  '자연': ['공원', '해수욕장', '산', '강', 'AT4'],
  '문화': ['박물관', '미술관', '공연장', '문화재', 'CT1', 'AC5'],
  '체험': ['체험관', '테마파크', '스포츠', 'AT4', 'AD5'],
  '휴식': ['카페', '공원', '스파', '호텔', 'CE7', 'AT4'],
  '야경': ['전망대', '다리', '타워', 'AT4'],
}

// 네이버 검색 API (클라이언트 사이드에서는 CORS 문제로 백엔드 필요)
const searchNaverPlaces = async (query: string, display: number = 5): Promise<NaverPlace[]> => {
  try {
    // 실제 구현시에는 백엔드 API를 통해 네이버 API 호출
    // 현재는 더미 데이터 반환
    return []
  } catch (error) {
    console.error('네이버 검색 오류:', error)
    return []
  }
}

// 카카오 + 네이버 통합 검색
export const searchIntegratedPlaces = async (
  query: string,
  location?: { lat: number; lng: number },
  preferences?: string[],
  radius?: number
): Promise<RecommendedPlace[]> => {
  try {
    console.log('통합 장소 검색 시작:', { query, location, preferences, radius });
    
    // 1. 카카오 검색
    let kakaoPlaces: any[] = [];
    try {
      kakaoPlaces = await searchPlaces(query);
      console.log('카카오 검색 결과:', kakaoPlaces.length, '개');
    } catch (error) {
      console.error('카카오 검색 실패:', error);
      // 카카오 검색이 실패해도 빈 배열로 계속 진행
      kakaoPlaces = [];
    }
    
    // 2. 네이버 검색 (현재는 카카오만 사용)
    // const naverPlaces = await searchNaverPlaces(query)
    
    // 3. 통합 및 정규화
    const places: RecommendedPlace[] = kakaoPlaces.map((place, index) => ({
      id: place.id || `kakao_${index}`,
      name: place.place_name,
      category: place.category_name,
      address: place.address_name,
      roadAddress: place.road_address_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      phone: place.phone,
      description: place.category_name,
      source: 'kakao' as const,
      tags: place.category_name.split(' > '),
      // 시뮬레이션된 평점과 리뷰 수 추가
      rating: (place as any).simulatedRating,
      reviewCount: (place as any).simulatedReviewCount,
      // 인기도 점수를 기본 매칭 점수로 사용
      matchScore: (place as any).popularityScore,
    }))
    
    // 4. 사용자 선호도 기반 점수 계산 및 별점 가중치 적용
    if (preferences && preferences.length > 0) {
      places.forEach(place => {
        const preferenceScore = calculatePreferenceScore(place, preferences)
        const ratingScore = (place.rating || 0) * 10 // 별점을 점수로 변환 (5점 만점 → 50점)
        const reviewScore = Math.min(20, (place.reviewCount || 0) / 10) // 리뷰 수 점수 (최대 20점)
        
        // 총 매칭 점수 = 기본 인기도 + 선호도 + 별점 + 리뷰 점수
        place.matchScore = (place.matchScore || 0) + preferenceScore + ratingScore + reviewScore
      })
      
      // 매칭 점수 기준 정렬 (별점과 인기도가 높은 순)
      places.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    } else {
      // 선호도가 없을 때는 별점과 인기도로만 정렬
      places.sort((a, b) => {
        const scoreA = ((a.rating || 0) * 20) + (a.matchScore || 0)
        const scoreB = ((b.rating || 0) * 20) + (b.matchScore || 0)
        return scoreB - scoreA
      })
    }
    
    // 5. 거리 기반 필터링
    if (location && radius) {
      return places.filter(place => {
        const distance = calculateDistance(
          location.lat, location.lng,
          place.lat, place.lng
        )
        place.distance = distance
        return distance <= radius
      })
    }
    
    console.log('통합 검색 완료:', places.length, '개 장소');
    return places
  } catch (error) {
    console.error('통합 장소 검색 오류:', error)
    // 빈 배열 대신 에러를 다시 던져서 상위에서 처리하도록 함
    throw new Error('장소 검색 중 오류가 발생했습니다. 다시 시도해주세요.')
  }
}

// 선호도 기반 점수 계산
const calculatePreferenceScore = (place: RecommendedPlace, preferences: string[]): number => {
  let score = 0
  const placeCategory = place.category.toLowerCase()
  const placeTags = place.tags || []
  
  preferences.forEach(preference => {
    const categories = PREFERENCE_CATEGORY_MAP[preference] || []
    
    // 카테고리 매칭 점수
    categories.forEach(category => {
      if (placeCategory.includes(category.toLowerCase())) {
        score += 10
      }
    })
    
    // 태그 매칭 점수
    placeTags.forEach(tag => {
      if (categories.some(cat => tag.toLowerCase().includes(cat.toLowerCase()))) {
        score += 5
      }
    })
    
    // 이름 매칭 점수
    if (place.name.toLowerCase().includes(preference.toLowerCase())) {
      score += 15
    }
  })
  
  return score
}

// 거리 계산 (하버사인 공식)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return distance
}

// 지역별 인기 장소 추천
export const getPopularPlacesByRegion = async (
  region: string,
  preferences?: string[],
  limit: number = 10
): Promise<RecommendedPlace[]> => {
  try {
    console.log('지역별 인기 장소 검색 시작:', { region, preferences, limit });
    
    // 더 구체적이고 다양한 검색 쿼리
    const searchQueries = [
      `${region} 맛집`,
      `${region} 관광지`,
      `${region} 카페`,
      `${region} 쇼핑`,
      `${region} 박물관`,
      `${region} 공원`,
      `${region} 명소`,
      `${region} 체험`,
      // 지역별 특화 검색어 추가
      ...getRegionSpecificQueries(region)
    ];
    
    const allPlaces: RecommendedPlace[] = [];
    
    for (const query of searchQueries) {
      try {
        console.log('검색 쿼리 실행:', query);
        const places = await searchIntegratedPlaces(query, undefined, preferences);
        
        // 각 카테고리에서 상위 평점 장소들만 선별
        const topPlaces = places
          .filter(place => place.rating && place.rating >= 3.5) // 3.5점 이상만
          .slice(0, 3); // 각 카테고리에서 상위 3개
          
        allPlaces.push(...topPlaces);
        console.log(`${query} 검색 완료:`, topPlaces.length, '개 고품질 결과');
      } catch (error) {
        console.error(`검색 쿼리 실패 (${query}):`, error);
        continue;
      }
    }
    
    // 중복 제거 (이름과 주소 기준)
    const uniquePlaces = allPlaces.filter((place, index, self) => 
      index === self.findIndex(p => 
        p.name === place.name || 
        (p.address === place.address && p.address !== '')
      )
    );
    
    console.log('최종 결과:', uniquePlaces.length, '개 고유 장소');
    
    // 별점과 매칭 점수를 종합한 최종 점수로 정렬
    const finalSorted = uniquePlaces
      .map(place => ({
        ...place,
        finalScore: (place.rating || 0) * 20 + (place.matchScore || 0) + (place.reviewCount || 0) / 10
      }))
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);
      
    return finalSorted;
      
  } catch (error) {
    console.error('인기 장소 검색 오류:', error);
    throw new Error('인기 장소를 검색하는 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
};

// 지역별 특화 검색어
const getRegionSpecificQueries = (region: string): string[] => {
  const regionQueries: { [key: string]: string[] } = {
    '제주도': ['제주 한라산', '제주 성산일출봉', '제주 우도', '제주 중문', '제주 협재해수욕장'],
    '부산': ['부산 해운대', '부산 광안리', '부산 감천문화마을', '부산 자갈치시장', '부산 태종대'],
    '서울': ['서울 강남', '서울 명동', '서울 홍대', '서울 인사동', '서울 경복궁'],
    '속초': ['속초 설악산', '속초 해수욕장', '속초 시장', '속초 케이블카', '속초 낙산사'],
    '강릉': ['강릉 안목해변', '강릉 정동진', '강릉 오죽헌', '강릉 커피거리', '강릉 경포대'],
    '전주': ['전주 한옥마을', '전주 비빔밥', '전주 객리단길', '전주 한지', '전주 풍남문'],
    '경주': ['경주 불국사', '경주 석굴암', '경주 첨성대', '경주 안압지', '경주 대릉원'],
    '여수': ['여수 밤바다', '여수 엑스포', '여수 오동도', '여수 향일암', '여수 케이블카']
  };
  
  return regionQueries[region] || [`${region} 유명한곳`, `${region} 인기장소`];
};

// 여행 일정에 최적화된 장소 추천
export const generateOptimizedItinerary = async (
  destination: string,
  preferences: string[],
  days: number,
  startLocation?: { lat: number; lng: number }
): Promise<{ [day: number]: RecommendedPlace[] }> => {
  try {
    const itinerary: { [day: number]: RecommendedPlace[] } = {}
    
    // 각 날짜별로 추천 장소 생성
    for (let day = 0; day < days; day++) {
      const places = await getPopularPlacesByRegion(destination, preferences, 8)
      
      // 하루에 적절한 수의 장소 선택 (6-8개)
      const dailyPlaces = places.slice(day * 6, (day + 1) * 6)
      
      // 시간대별 최적화 (오전: 관광, 점심: 맛집, 오후: 체험, 저녁: 맛집)
      const optimizedPlaces = optimizeDailySchedule(dailyPlaces)
      
      itinerary[day] = optimizedPlaces
    }
    
    return itinerary
  } catch (error) {
    console.error('일정 생성 오류:', error)
    return {}
  }
}

// 하루 일정 최적화
const optimizeDailySchedule = (places: RecommendedPlace[]): RecommendedPlace[] => {
  // 시간대별 카테고리 우선순위
  const morningCategories = ['관광명소', '박물관', '공원']
  const lunchCategories = ['음식점', '맛집']
  const afternoonCategories = ['쇼핑몰', '체험', '카페']
  const eveningCategories = ['음식점', '맛집', '야경']
  
  const schedule: RecommendedPlace[] = []
  
  // 오전 장소 선택
  const morningPlace = places.find(p => 
    morningCategories.some(cat => p.category.includes(cat))
  )
  if (morningPlace) schedule.push(morningPlace)
  
  // 점심 장소 선택
  const lunchPlace = places.find(p => 
    lunchCategories.some(cat => p.category.includes(cat)) && 
    !schedule.includes(p)
  )
  if (lunchPlace) schedule.push(lunchPlace)
  
  // 오후 장소 선택
  const afternoonPlace = places.find(p => 
    afternoonCategories.some(cat => p.category.includes(cat)) && 
    !schedule.includes(p)
  )
  if (afternoonPlace) schedule.push(afternoonPlace)
  
  // 저녁 장소 선택
  const eveningPlace = places.find(p => 
    eveningCategories.some(cat => p.category.includes(cat)) && 
    !schedule.includes(p)
  )
  if (eveningPlace) schedule.push(eveningPlace)
  
  // 남은 장소들로 채우기
  const remainingPlaces = places.filter(p => !schedule.includes(p))
  schedule.push(...remainingPlaces.slice(0, 4))
  
  return schedule
} 