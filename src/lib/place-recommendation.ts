// 장소 추천 시스템 - 네이버 + 카카오 API 조합
import { searchPlaces, KakaoPlace, calculateTravelTime, calculateSequentialTravelTimes, optimizeRouteWithTravelTime, TravelTimeInfo, formatTravelTime, formatTravelCost, recommendAccommodationNearLastPlace, AccommodationInfo, getCoordinatesByAddress } from './kakao-map'

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
  // 이동시간 관련 정보 추가
  travelTimeFromPrevious?: TravelTimeInfo
  suggestedVisitDuration?: number // 권장 방문 시간 (분)
  // 숙소 관련 정보 추가
  accommodationInfo?: {
    priceRange?: string
    amenities?: string[]
    distance?: number
    alternativeOptions?: AccommodationInfo[]
  }
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
    let successfulQueries = 0;
    
    for (const query of searchQueries) {
      try {
        console.log('검색 쿼리 실행:', query);
        const places = await searchIntegratedPlaces(query, undefined, preferences);
        
        // 각 카테고리에서 상위 평점 장소들만 선별
        const topPlaces = places
          .filter(place => place.rating && place.rating >= 3.5) // 3.5점 이상만
          .slice(0, 3); // 각 카테고리에서 상위 3개
          
        allPlaces.push(...topPlaces);
        successfulQueries++;
        console.log(`${query} 검색 완료:`, topPlaces.length, '개 고품질 결과');
      } catch (error) {
        console.error(`검색 쿼리 실패 (${query}):`, error);
        continue;
      }
    }
    
    console.log(`총 ${searchQueries.length}개 쿼리 중 ${successfulQueries}개 성공`);
    
    // API 검색이 모두 실패한 경우 샘플 데이터 반환
    if (allPlaces.length === 0) {
      console.warn('모든 API 검색 실패, 샘플 데이터로 대체');
      return generateSamplePlaces(region, limit);
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
    // 완전 실패 시 샘플 데이터 반환
    console.warn('장소 검색 완전 실패, 샘플 데이터로 대체');
    return generateSamplePlaces(region, limit);
  }
};

// API 실패 시 샘플 데이터 생성
const generateSamplePlaces = (region: string, limit: number): RecommendedPlace[] => {
  const samplePlaces: { [key: string]: RecommendedPlace[] } = {
    '제주도': [
      {
        id: 'sample-jeju-1',
        name: '성산일출봉',
        category: '관광명소',
        address: '제주특별자치도 서귀포시 성산읍',
        lat: 33.4583,
        lng: 126.9428,
        rating: 4.5,
        reviewCount: 1200,
        description: '제주의 대표 관광지',
        source: 'kakao'
      },
      {
        id: 'sample-jeju-2',
        name: '한라산 국립공원',
        category: '자연관광지',
        address: '제주특별자치도 제주시',
        lat: 33.3617,
        lng: 126.5292,
        rating: 4.3,
        reviewCount: 800,
        description: '제주 최고봉',
        source: 'kakao'
      }
    ],
    '부산': [
      {
        id: 'sample-busan-1',
        name: '해운대해수욕장',
        category: '관광명소',
        address: '부산광역시 해운대구',
        lat: 35.1584,
        lng: 129.1601,
        rating: 4.2,
        reviewCount: 950,
        description: '부산 대표 해수욕장',
        source: 'kakao'
      }
    ]
  };
  
  const defaultPlaces: RecommendedPlace[] = [
    {
      id: 'sample-default-1',
      name: `${region} 관광지`,
      category: '관광명소',
      address: `${region} 대표 관광지`,
      lat: 37.5665,
      lng: 126.9780,
      rating: 4.0,
      reviewCount: 100,
      description: `${region}의 인기 관광지`,
      source: 'kakao'
    }
  ];
  
  const places = samplePlaces[region] || defaultPlaces;
  return places.slice(0, limit);
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

// 여행 일정에 최적화된 장소 추천 (숙소 추천 포함)
export const generateOptimizedItinerary = async (
  destination: string,
  preferences: string[],
  days: number,
  startLocation?: { lat: number; lng: number },
  transportType: 'walking' | 'driving' | 'transit' = 'driving',
  accommodationType: string = 'hotel',
  bookedAccommodation?: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  }
): Promise<{ [day: number]: RecommendedPlace[] }> => {
  try {
    console.log('최적화된 일정 생성 시작:', { destination, preferences, days, transportType, accommodationType, bookedAccommodation });
    
    // 1. 모든 추천 장소 수집 (더 많이 가져오기)
    const allPlaces = await getPopularPlacesByRegion(destination, preferences, days * 12);
    
    if (allPlaces.length === 0) {
      throw new Error('추천 장소를 찾을 수 없습니다.');
    }
    
    // 2. 카테고리별로 분류
    const categorizedPlaces = categorizePlacesByType(allPlaces);
    
    // 3. 각 날짜별로 최적화된 일정 생성
    const itinerary: { [day: number]: RecommendedPlace[] } = {};
    const usedPlaces = new Set<string>(); // 중복 방지용
    
    for (let day = 0; day < days; day++) {
      const dayPlaces = generateDayItinerary(
        categorizedPlaces, 
        usedPlaces, 
        preferences,
        destination,
        day
      );
      
      // 4. 이동시간을 고려한 경로 최적화 적용
      const optimizedDayPlaces = optimizeDayRouteWithTravelTime(
        dayPlaces, 
        startLocation,
        transportType
      );

      // 4-1. 첫 번째 날이 아닌 경우 체크아웃을 맨 앞에 추가 (전날 숙소 정보 활용)
      if (day > 0) {
        const previousDayPlaces = itinerary[day - 1];
        if (previousDayPlaces && previousDayPlaces.length > 0) {
          // 전날 마지막에 체크인한 숙소 찾기
          const previousCheckIn = previousDayPlaces.find(place => 
            place.category === '숙소 체크인'
          );
          
          if (previousCheckIn) {
            const checkOutPlace: RecommendedPlace = {
              id: `checkout_${day - 1}_${previousCheckIn.id}`,
              name: previousCheckIn.name.replace('체크인', '체크아웃'),
              category: '숙소 체크아웃',
              address: previousCheckIn.address,
              lat: previousCheckIn.lat,
              lng: previousCheckIn.lng,
              rating: previousCheckIn.rating,
              reviewCount: previousCheckIn.reviewCount,
              description: previousCheckIn.description,
              phone: previousCheckIn.phone,
              tags: ['숙박', '체크아웃', accommodationType],
              source: 'kakao' as const,
              suggestedVisitDuration: 20, // 체크아웃 시간 20분
              accommodationInfo: previousCheckIn.accommodationInfo
            };
            
            // 하루 일정 맨 앞에 체크아웃 추가
            optimizedDayPlaces.unshift(checkOutPlace);
            console.log(`${day + 1}일차 체크아웃 추가: ${checkOutPlace.name}`);
          }
        }
      }
      
      // 5. 숙소 체크인 추가 (예약한 숙소가 있으면 우선 사용)
      if (optimizedDayPlaces.length > 0) {
        const lastPlace = optimizedDayPlaces[optimizedDayPlaces.length - 1];
        
        if (bookedAccommodation) {
          // 예약한 숙소가 있는 경우 해당 숙소 사용
          console.log(`${day + 1}일차 예약한 숙소 체크인: ${bookedAccommodation.name}`);
          
          // 예약한 숙소의 좌표가 없는 경우 좌표 조회 시도
          let accommodationLat = bookedAccommodation.lat || lastPlace.lat;
          let accommodationLng = bookedAccommodation.lng || lastPlace.lng;
          
          if (!bookedAccommodation.lat || !bookedAccommodation.lng) {
            try {
              const coordinates = await getCoordinatesByAddress(bookedAccommodation.address);
              if (coordinates) {
                accommodationLat = coordinates.lat;
                accommodationLng = coordinates.lng;
              }
            } catch (error) {
              console.warn('예약한 숙소 좌표 조회 실패, 마지막 장소 좌표 사용:', error);
            }
          }
          
          const bookedCheckInPlace: RecommendedPlace = {
            id: `checkin_${day}_booked`,
            name: `🏨 ${bookedAccommodation.name} 체크인`,
            category: '숙소 체크인',
            address: bookedAccommodation.address,
            lat: accommodationLat,
            lng: accommodationLng,
            rating: 4.5, // 예약한 숙소 기본 평점
            reviewCount: 0,
            description: '예약한 숙소',
            phone: '',
            tags: ['숙박', '체크인', accommodationType, '예약숙소'],
            source: 'kakao' as const,
            suggestedVisitDuration: 30, // 체크인 시간 30분
            accommodationInfo: {
              priceRange: '예약완료',
              amenities: ['예약된 숙소'],
              distance: 0,
              alternativeOptions: []
            }
          };
          
          // 마지막 일정 다음에 체크인 추가
          optimizedDayPlaces.push(bookedCheckInPlace);
          
        } else {
          // 예약한 숙소가 없는 경우 기존 추천 로직 사용
          try {
            console.log(`${day + 1}일차 마지막 일정 "${lastPlace.name}" 주변 숙소 검색 중...`);
            
            const accommodations = await recommendAccommodationNearLastPlace(
              {
                name: lastPlace.name,
                lat: lastPlace.lat,
                lng: lastPlace.lng
              },
              accommodationType
            );
            
            if (accommodations.length > 0) {
              // 가장 추천하는 숙소를 체크인으로 추가
              const bestAccommodation = accommodations[0];
              
              const checkInPlace: RecommendedPlace = {
                id: `checkin_${day}_${bestAccommodation.id}`,
                name: `🏨 ${bestAccommodation.name} 체크인`,
                category: '숙소 체크인',
                address: bestAccommodation.address,
                lat: bestAccommodation.lat,
                lng: bestAccommodation.lng,
                rating: bestAccommodation.rating,
                reviewCount: bestAccommodation.reviewCount,
                description: `${bestAccommodation.priceRange} | ${bestAccommodation.amenities?.slice(0, 3).join(', ')}`,
                phone: bestAccommodation.phone,
                tags: ['숙박', '체크인', accommodationType, '추천숙소'],
                source: 'kakao' as const,
                suggestedVisitDuration: 30, // 체크인 시간 30분
                // 추가 숙소 정보
                accommodationInfo: {
                  priceRange: bestAccommodation.priceRange,
                  amenities: bestAccommodation.amenities,
                  distance: bestAccommodation.distance,
                  alternativeOptions: accommodations.slice(1, 3) // 대안 숙소 2개
                }
              };
              
              // 마지막 일정 다음에 체크인 추가
              optimizedDayPlaces.push(checkInPlace);
              
              console.log(`${day + 1}일차 숙소 체크인 추가: ${bestAccommodation.name} (${bestAccommodation.distance?.toFixed(1)}km)`);
            } else {
              // 숙소를 찾지 못한 경우 기본 체크인 표시
              const fallbackCheckIn: RecommendedPlace = {
                id: `checkin_${day}_fallback`,
                name: `🏨 ${destination} 지역 숙소 체크인`,
                category: '숙소 체크인',
                address: `${destination} 중심가`,
                lat: lastPlace.lat,
                lng: lastPlace.lng,
                description: '이 지역의 숙소를 직접 검색해보세요',
                tags: ['숙박', '체크인', accommodationType],
                source: 'kakao' as const,
                suggestedVisitDuration: 30
              };
              
              optimizedDayPlaces.push(fallbackCheckIn);
              console.log(`${day + 1}일차 기본 체크인 표시`);
            }
          } catch (error) {
            console.error(`${day + 1}일차 숙소 추천 중 오류:`, error);
            
            // 오류 발생 시에도 기본 체크인 정보는 표시
            const errorCheckIn: RecommendedPlace = {
              id: `checkin_${day}_error`,
              name: `🏨 ${destination} 지역 숙소 체크인`,
              category: '숙소 체크인',
              address: `${destination} 중심가`,
              lat: lastPlace.lat,
              lng: lastPlace.lng,
              description: '숙소 정보를 불러올 수 없습니다. 직접 검색해보세요.',
              tags: ['숙박', '체크인', accommodationType],
              source: 'kakao' as const,
              suggestedVisitDuration: 30
            };
            
            optimizedDayPlaces.push(errorCheckIn);
          }
        }
      }
      
      itinerary[day] = optimizedDayPlaces;
      
      // 사용된 장소들을 기록하여 중복 방지 (숙소 체크인/체크아웃 제외)
      optimizedDayPlaces
        .filter(place => 
          !place.category.includes('숙소 체크인') && 
          !place.category.includes('숙소 체크아웃')
        )
        .forEach(place => usedPlaces.add(place.id));
    }
    
    console.log(`총 ${days}일 일정 생성 완료 (숙소 포함)`);
    return itinerary;
  } catch (error) {
    console.error('일정 생성 오류:', error);
    return {};
  }
};

// 장소들을 타입별로 분류
const categorizePlacesByType = (places: RecommendedPlace[]) => {
  return {
    attractions: places.filter(p => 
      p.category.includes('관광') || 
      p.category.includes('명소') || 
      p.category.includes('공원') ||
      p.category.includes('박물관') ||
      p.category.includes('미술관')
    ),
    restaurants: places.filter(p => 
      p.category.includes('음식점') || 
      p.category.includes('맛집') ||
      p.category.includes('한식') ||
      p.category.includes('중식') ||
      p.category.includes('일식') ||
      p.category.includes('양식')
    ),
    cafes: places.filter(p => 
      p.category.includes('카페') || 
      p.category.includes('커피') ||
      p.category.includes('디저트')
    ),
    shopping: places.filter(p => 
      p.category.includes('쇼핑') || 
      p.category.includes('시장') ||
      p.category.includes('백화점') ||
      p.category.includes('마트')
    ),
    culture: places.filter(p => 
      p.category.includes('문화') || 
      p.category.includes('전시') ||
      p.category.includes('공연') ||
      p.category.includes('역사')
    ),
    nightlife: places.filter(p => 
      p.category.includes('야경') || 
      p.category.includes('술집') ||
      p.category.includes('바') ||
      p.category.includes('클럽')
    )
  };
};

// 하루 일정 생성 (시간대별 최적화)
const generateDayItinerary = (
  categorizedPlaces: ReturnType<typeof categorizePlacesByType>,
  usedPlaces: Set<string>,
  preferences: string[],
  destination: string,
  dayIndex: number
): RecommendedPlace[] => {
  const dayPlan: RecommendedPlace[] = [];
  
  // 시간대별 계획
  const timeSlots: Array<{ type: string; category: keyof ReturnType<typeof categorizePlacesByType>; count: number }> = [
    { type: 'morning', category: 'attractions', count: 2 },
    { type: 'lunch', category: 'restaurants', count: 1 },
    { type: 'afternoon1', category: 'culture', count: 1 },
    { type: 'afternoon2', category: 'shopping', count: 1 },
    { type: 'coffee', category: 'cafes', count: 1 },
    { type: 'dinner', category: 'restaurants', count: 1 },
    { type: 'evening', category: 'nightlife', count: 1 }
  ];
  
  timeSlots.forEach(slot => {
    const availablePlaces = categorizedPlaces[slot.category]
      ?.filter((place: RecommendedPlace) => !usedPlaces.has(place.id))
      ?.sort((a: RecommendedPlace, b: RecommendedPlace) => {
        // 별점과 매칭 점수 종합
        const scoreA = (a.rating || 0) * 20 + (a.matchScore || 0);
        const scoreB = (b.rating || 0) * 20 + (b.matchScore || 0);
        return scoreB - scoreA;
      });
    
    if (availablePlaces && availablePlaces.length > 0) {
      const selectedPlaces = availablePlaces.slice(0, slot.count);
      dayPlan.push(...selectedPlaces);
    }
  });
  
  // 8개 장소로 맞추기 (부족하면 다른 카테고리에서 보충)
  if (dayPlan.length < 8) {
    const allAvailable = (Object.values(categorizedPlaces) as RecommendedPlace[][])
      .flat()
      .filter((place: RecommendedPlace) => !usedPlaces.has(place.id) && !dayPlan.find(p => p.id === place.id))
      .sort((a: RecommendedPlace, b: RecommendedPlace) => {
        const scoreA = (a.rating || 0) * 20 + (a.matchScore || 0);
        const scoreB = (b.rating || 0) * 20 + (b.matchScore || 0);
        return scoreB - scoreA;
      });
    
    const needed = 8 - dayPlan.length;
    dayPlan.push(...allAvailable.slice(0, needed));
  }
  
  return dayPlan.slice(0, 8);
};

// 이동시간을 고려한 하루 경로 최적화
const optimizeDayRouteWithTravelTime = (
  places: RecommendedPlace[], 
  startLocation?: { lat: number; lng: number },
  transportType: 'walking' | 'driving' | 'transit' = 'driving'
): RecommendedPlace[] => {
  if (places.length <= 1) return places;
  
  // 시작점 설정 (첫 번째 장소나 지정된 시작점)
  const routeStartLocation = startLocation || { lat: places[0].lat, lng: places[0].lng };
  
  // 장소들을 좌표 정보로 변환
  const destinationsForRoute = places.map(place => ({
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    originalPlace: place
  }));
  
  // 이동시간을 고려한 최적 경로 계산
  const optimizationResult = optimizeRouteWithTravelTime(
    routeStartLocation,
    destinationsForRoute,
    transportType
  );
  
  // 최적화된 순서로 장소들을 재배열하고 이동시간 정보 추가
  const optimizedPlaces: RecommendedPlace[] = optimizationResult.optimizedRoute.map((routePlace, index) => {
    const originalPlace = destinationsForRoute.find(d => d.name === routePlace.name)?.originalPlace;
    if (!originalPlace) return null;
    
    // 이동시간 정보 추가
    const travelTimeFromPrevious = index < optimizationResult.travelSegments.length 
      ? optimizationResult.travelSegments[index] 
      : undefined;
    
    // 장소별 권장 방문 시간 설정
    const suggestedVisitDuration = getSuggestedVisitDuration(originalPlace.category);
    
    return {
      ...originalPlace,
      travelTimeFromPrevious,
      suggestedVisitDuration
    };
  }).filter(Boolean) as RecommendedPlace[];
  
  console.log(`경로 최적화 완료: 총 이동시간 ${formatTravelTime(optimizationResult.totalTravelTime)}, 총 거리 ${optimizationResult.totalDistance.toFixed(1)}km`);
  
  return optimizedPlaces;
};

// 장소 카테고리별 권장 방문 시간 (분)
const getSuggestedVisitDuration = (category: string): number => {
  if (category.includes('박물관') || category.includes('미술관')) {
    return 90; // 1시간 30분
  }
  if (category.includes('관광') || category.includes('명소') || category.includes('공원')) {
    return 60; // 1시간
  }
  if (category.includes('음식점') || category.includes('맛집')) {
    return 90; // 1시간 30분 (식사 시간)
  }
  if (category.includes('카페') || category.includes('디저트')) {
    return 45; // 45분
  }
  if (category.includes('쇼핑') || category.includes('시장') || category.includes('백화점')) {
    return 120; // 2시간
  }
  if (category.includes('문화') || category.includes('전시')) {
    return 75; // 1시간 15분
  }
  if (category.includes('체험') || category.includes('테마파크')) {
    return 180; // 3시간
  }
  
  return 60; // 기본값: 1시간
};

// 일정의 총 소요시간 계산
export const calculateItineraryTotalTime = (
  dayPlaces: RecommendedPlace[],
  includeVisitTime: boolean = true
): {
  totalTravelTime: number;
  totalVisitTime: number;
  totalTime: number;
  formattedTotalTime: string;
} => {
  let totalTravelTime = 0;
  let totalVisitTime = 0;
  
  dayPlaces.forEach(place => {
    // 이동시간 합산
    if (place.travelTimeFromPrevious) {
      totalTravelTime += place.travelTimeFromPrevious.durationMinutes;
    }
    
    // 방문시간 합산
    if (includeVisitTime && place.suggestedVisitDuration) {
      totalVisitTime += place.suggestedVisitDuration;
    }
  });
  
  const totalTime = totalTravelTime + totalVisitTime;
  
  return {
    totalTravelTime,
    totalVisitTime,
    totalTime,
    formattedTotalTime: formatTravelTime(totalTime)
  };
};

// 일정의 예상 비용 계산
export const calculateItineraryCost = (
  dayPlaces: RecommendedPlace[]
): {
  totalTravelCost: number;
  formattedTotalCost: string;
  costByTransport: { [key: string]: number };
} => {
  let totalTravelCost = 0;
  const costByTransport: { [key: string]: number } = {};
  
  dayPlaces.forEach(place => {
    if (place.travelTimeFromPrevious?.estimatedCost) {
      const cost = place.travelTimeFromPrevious.estimatedCost;
      const transport = place.travelTimeFromPrevious.transportType;
      
      totalTravelCost += cost;
      costByTransport[transport] = (costByTransport[transport] || 0) + cost;
    }
  });
  
  return {
    totalTravelCost,
    formattedTotalCost: formatTravelCost(totalTravelCost),
    costByTransport
  };
}; 