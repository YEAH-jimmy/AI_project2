// 카카오 지도 API 관련 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

// API 키 설정 - 여러 백업 키 제공
const KAKAO_API_KEYS = [
  '62801e528eb39f2e251cc2d723564703', // 기본 JavaScript 키
  'b96ce35e1cd6d37f165e9b54ebc06ae8', // 백업 키 1
  'your_kakao_js_key_here' // 백업 키 2 (필요시 교체)
];

const KAKAO_REST_API_KEYS = [
  'a1ed14870e47a2cc4f918be9fb269e6a', // 기본 REST API 키
  'your_kakao_rest_key_here' // 백업 키 (필요시 교체)
];

// 사용할 API 키 선택
const KAKAO_API_KEY = KAKAO_API_KEYS[0];
const KAKAO_REST_API_KEY = KAKAO_REST_API_KEYS[0];

console.log('카카오 지도 API 설정:', {
  jsKey: KAKAO_API_KEY?.substring(0, 10) + '...',
  restKey: KAKAO_REST_API_KEY?.substring(0, 10) + '...'
});

interface KakaoPlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // longitude
  y: string; // latitude
  phone: string;
  place_url: string;
  category_group_code?: string;
  category_group_name?: string;
  distance?: string;
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

// 카카오 지도 SDK 로드
export const loadKakaoMapScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.kakao && window.kakao.maps) {
      console.log('카카오 지도 이미 로드됨');
      resolve();
      return;
    }

    // 이미 스크립트 태그가 존재하는지 확인
    const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
    if (existingScript) {
      console.log('카카오 지도 스크립트 태그가 이미 존재함');
      
      // SDK가 로드될 때까지 대기
      const checkKakaoMaps = setInterval(() => {
        if (window.kakao && window.kakao.maps) {
          clearInterval(checkKakaoMaps);
          console.log('카카오 지도 SDK 로드 완료');
          resolve();
        }
      }, 100);
      
      // 20초 타임아웃 설정
      setTimeout(() => {
        clearInterval(checkKakaoMaps);
        reject(new Error('카카오 지도 SDK 로드 타임아웃'));
      }, 20000);
      
      return;
    }

    // 새 스크립트 로드
    loadNewScript();

    function loadNewScript() {
      const script = document.createElement('script');
      script.async = true;
      script.defer = true;
      // 하드코딩된 키를 사용하여 autoload=true로 설정
      const apiKey = KAKAO_API_KEY;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer,drawing&autoload=true`;
      
      script.onload = () => {
        console.log('카카오 지도 스크립트 로드 완료');
        
        // autoload=true이므로 자동으로 초기화됨, 완료될 때까지 대기
        const waitForMaps = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(waitForMaps);
            console.log('카카오 지도 SDK 초기화 완료');
            resolve();
          }
        }, 100);
        
        // 20초 타임아웃 설정
        setTimeout(() => {
          clearInterval(waitForMaps);
          reject(new Error('카카오 지도 SDK 초기화 타임아웃'));
        }, 20000);
      };
      
      script.onerror = (e) => {
        console.error('카카오 지도 스크립트 로드 실패', e);
        reject(new Error('카카오 지도 스크립트 로드에 실패했습니다.'));
      };

      document.head.appendChild(script);
    }
  });
};

// 장소 검색 API
export const searchPlaces = async (query: string, category?: string): Promise<KakaoPlace[]> => {
  try {
    // 환경변수가 로드되지 않으면 직접 설정한 키 사용
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || KAKAO_REST_API_KEY;
    
    if (!apiKey) {
      console.error('카카오 REST API 키가 설정되지 않았습니다.');
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    console.log('장소 검색 시작:', { query, category, apiKey: apiKey.substring(0, 10) + '...' });

    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.append('query', query);
    if (category) {
      url.searchParams.append('category_group_code', category);
    }
    url.searchParams.append('size', '15');

    console.log('API 요청 URL:', url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    });

    console.log('API 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      // 구체적인 에러 메시지 제공
      if (response.status === 401) {
        throw new Error('카카오 API 인증에 실패했습니다. API 키를 확인해주세요.');
      } else if (response.status === 403) {
        throw new Error('카카오 API 접근이 거부되었습니다. 도메인 설정을 확인해주세요.');
      } else if (response.status === 429) {
        throw new Error('카카오 API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
      } else {
        throw new Error(`장소 검색에 실패했습니다. (상태: ${response.status})`);
      }
    }

    const data: KakaoSearchResponse = await response.json();
    console.log('검색 결과:', data.documents.length, '개 장소 발견');
    
    // 검색 결과에 추가 정보 보강
    const enhancedPlaces = data.documents.map(place => ({
      ...place,
      // 실제 평점 데이터가 없으므로 장소 특성을 기반으로 시뮬레이션
      simulatedRating: generateSimulatedRating(place),
      simulatedReviewCount: generateSimulatedReviewCount(place),
      popularityScore: calculatePopularityScore(place)
    }));
    
    return enhancedPlaces;
  } catch (error) {
    console.error('장소 검색 오류 상세:', error);
    
    // 네트워크 오류인 경우
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }
    
    // CORS 오류 감지
    if (error instanceof TypeError && error.message.includes('CORS')) {
      throw new Error('브라우저 보안 정책으로 인한 오류입니다. 페이지를 새로고침해보세요.');
    }
    
    // 이미 처리된 에러 메시지는 그대로 전달
    if (error instanceof Error) {
      throw error;
    }
    
    // 기타 예상치 못한 오류
    throw new Error('알 수 없는 오류가 발생했습니다. 다시 시도해주세요.');
  }
};

// 장소 특성 기반 별점 시뮬레이션
const generateSimulatedRating = (place: KakaoPlace): number => {
  let baseRating = 3.5; // 기본 별점
  
  // 카테고리별 가중치
  const categoryBonus = getCategoryRatingBonus(place.category_name);
  
  // 이름 기반 품질 점수 (체인점, 유명 브랜드 등)
  const nameBonus = getNameQualityBonus(place.place_name);
  
  // 주소 기반 점수 (강남, 명동 등 프리미엄 지역)
  const locationBonus = getLocationBonus(place.address_name);
  
  // 전화번호 여부 (정보 완성도)
  const infoBonus = place.phone ? 0.1 : 0;
  
  const finalRating = Math.min(5.0, baseRating + categoryBonus + nameBonus + locationBonus + infoBonus);
  
  // 0.1 단위로 반올림
  return Math.round(finalRating * 10) / 10;
};

// 리뷰 수 시뮬레이션
const generateSimulatedReviewCount = (place: KakaoPlace): number => {
  let baseReviewCount = 50;
  
  // 카테고리별 리뷰 수 가중치
  if (place.category_name.includes('음식점') || place.category_name.includes('카페')) {
    baseReviewCount += Math.random() * 200; // 음식점은 리뷰가 많음
  } else if (place.category_name.includes('관광')) {
    baseReviewCount += Math.random() * 150;
  } else if (place.category_name.includes('쇼핑')) {
    baseReviewCount += Math.random() * 100;
  }
  
  // 유명 지역 보너스
  if (place.address_name.includes('강남') || place.address_name.includes('명동') || place.address_name.includes('홍대')) {
    baseReviewCount *= 1.5;
  }
  
  return Math.floor(baseReviewCount);
};

// 카테고리별 별점 보너스
const getCategoryRatingBonus = (category: string): number => {
  const premiumKeywords = ['호텔', '리조트', '프리미엄', '고급', '미슐랭'];
  const goodKeywords = ['박물관', '미술관', '공원', '궁궐', '문화재'];
  
  if (premiumKeywords.some(keyword => category.includes(keyword))) {
    return 0.5;
  }
  if (goodKeywords.some(keyword => category.includes(keyword))) {
    return 0.3;
  }
  
  return 0;
};

// 이름 기반 품질 보너스
const getNameQualityBonus = (name: string): number => {
  const premiumBrands = ['롯데', '신세계', '현대', '스타벅스', '투썸', '설빙'];
  const localFamous = ['원조', '본점', '맛집', '유명'];
  
  if (premiumBrands.some(brand => name.includes(brand))) {
    return 0.3;
  }
  if (localFamous.some(keyword => name.includes(keyword))) {
    return 0.2;
  }
  
  return 0;
};

// 위치 기반 보너스
const getLocationBonus = (address: string): number => {
  const premiumAreas = ['강남구', '서초구', '용산구', '중구'];
  const popularAreas = ['명동', '홍대', '강남역', '여의도', '압구정'];
  
  if (premiumAreas.some(area => address.includes(area))) {
    return 0.2;
  }
  if (popularAreas.some(area => address.includes(area))) {
    return 0.15;
  }
  
  return 0;
};

// 인기도 점수 계산
const calculatePopularityScore = (place: KakaoPlace): number => {
  let score = 50; // 기본 점수
  
  // 카테고리별 인기도
  if (place.category_name.includes('관광')) score += 30;
  if (place.category_name.includes('음식점')) score += 25;
  if (place.category_name.includes('카페')) score += 20;
  if (place.category_name.includes('쇼핑')) score += 15;
  
  // 위치별 인기도
  if (place.address_name.includes('제주')) score += 20;
  if (place.address_name.includes('부산')) score += 15;
  if (place.address_name.includes('강남') || place.address_name.includes('명동')) score += 25;
  
  return Math.min(100, score);
};

// 주소로 좌표 검색
export const getCoordinatesByAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // 환경변수가 로드되지 않으면 직접 설정한 키 사용
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || KAKAO_REST_API_KEY;
    
    if (!apiKey) {
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    const url = new URL('https://dapi.kakao.com/v2/local/search/address.json');
    url.searchParams.append('query', address);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('주소 검색에 실패했습니다.');
    }

    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const location = data.documents[0];
      return {
        lat: parseFloat(location.y),
        lng: parseFloat(location.x),
      };
    }

    return null;
  } catch (error) {
    console.error('주소 검색 오류:', error);
    return null;
  }
};

// 거리 계산 (하버사인 공식)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

// 여행 경로 최적화 (간단한 nearest neighbor 알고리즘)
export const optimizeRoute = (
  startLocation: { lat: number; lng: number },
  destinations: Array<{ name: string; lat: number; lng: number }>,
  endLocation?: { lat: number; lng: number }
): Array<{ name: string; lat: number; lng: number }> => {
  if (destinations.length === 0) return [];
  
  const optimizedRoute: Array<{ name: string; lat: number; lng: number }> = [];
  const remaining = [...destinations];
  let currentLocation = startLocation;
  
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      remaining[0].lat,
      remaining[0].lng
    );
    
    for (let i = 1; i < remaining.length; i++) {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        remaining[i].lat,
        remaining[i].lng
      );
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = i;
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0];
    optimizedRoute.push(nearest);
    currentLocation = nearest;
  }
  
  return optimizedRoute;
};

export type { KakaoPlace, KakaoSearchResponse }; 

// 이동시간 계산 타입 정의
export interface TravelTimeInfo {
  distanceKm: number;
  durationMinutes: number;
  transportType: 'walking' | 'driving' | 'transit';
  estimatedCost?: number;
}

// 교통수단별 이동시간 계산
export const calculateTravelTime = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  transportType: 'walking' | 'driving' | 'transit' = 'driving'
): TravelTimeInfo => {
  const distanceKm = calculateDistance(fromLat, fromLng, toLat, toLng);
  
  let durationMinutes: number;
  let estimatedCost: number | undefined;
  
  switch (transportType) {
    case 'walking':
      // 도보: 평균 시속 4km/h
      durationMinutes = Math.ceil((distanceKm / 4) * 60);
      estimatedCost = 0;
      break;
    case 'driving':
      // 자동차: 시내 평균 시속 30km/h, 고속도로 80km/h
      const averageSpeed = distanceKm > 20 ? 60 : 25; // 장거리는 고속도로 고려
      durationMinutes = Math.ceil((distanceKm / averageSpeed) * 60);
      // 주차비 + 기름값 대략적 계산 (km당 500원)
      estimatedCost = Math.ceil(distanceKm * 500);
      break;
    case 'transit':
      // 대중교통: 평균 시속 25km/h (대기시간 포함)
      durationMinutes = Math.ceil((distanceKm / 25) * 60);
      // 대중교통비 계산 (기본요금 + 거리요금)
      if (distanceKm <= 10) {
        estimatedCost = 1500; // 버스/지하철 기본요금
      } else if (distanceKm <= 40) {
        estimatedCost = 2000; // 중거리
      } else {
        estimatedCost = 3000; // 장거리
      }
      break;
  }
  
  return {
    distanceKm: Math.round(distanceKm * 10) / 10, // 소수점 첫째자리까지
    durationMinutes,
    transportType,
    estimatedCost
  };
};

// 여러 장소 간의 이동시간 행렬 계산
export const calculateTravelTimeMatrix = (
  places: Array<{ name: string; lat: number; lng: number }>,
  transportType: 'walking' | 'driving' | 'transit' = 'driving'
): Array<Array<TravelTimeInfo | null>> => {
  const matrix: Array<Array<TravelTimeInfo | null>> = [];
  
  for (let i = 0; i < places.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < places.length; j++) {
      if (i === j) {
        matrix[i][j] = null; // 같은 장소
      } else {
        matrix[i][j] = calculateTravelTime(
          places[i].lat,
          places[i].lng,
          places[j].lat,
          places[j].lng,
          transportType
        );
      }
    }
  }
  
  return matrix;
};

// 순차적 이동시간 계산 (일정 순서대로)
export const calculateSequentialTravelTimes = (
  places: Array<{ name: string; lat: number; lng: number }>,
  transportType: 'walking' | 'driving' | 'transit' = 'driving'
): Array<TravelTimeInfo> => {
  const travelTimes: Array<TravelTimeInfo> = [];
  
  for (let i = 0; i < places.length - 1; i++) {
    const travelTime = calculateTravelTime(
      places[i].lat,
      places[i].lng,
      places[i + 1].lat,
      places[i + 1].lng,
      transportType
    );
    travelTimes.push(travelTime);
  }
  
  return travelTimes;
};

// 카카오맵 길찾기 API 호출 (더 정확한 이동시간)
export const getDetailedTravelTime = async (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  transportType: 'car' | 'walk' | 'transit' = 'car'
): Promise<TravelTimeInfo | null> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || KAKAO_REST_API_KEY;
    
    if (!apiKey) {
      console.warn('카카오 REST API 키가 없어 예상 이동시간을 사용합니다.');
      return calculateTravelTime(fromLat, fromLng, toLat, toLng, 
        transportType === 'car' ? 'driving' : transportType === 'walk' ? 'walking' : 'transit'
      );
    }

    let url: string;
    
    if (transportType === 'car') {
      // 자동차 길찾기 API
      url = `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${fromLng}&y=${fromLat}`;
      // 실제로는 Direction API를 사용해야 하지만, 현재는 예상값 반환
      return calculateTravelTime(fromLat, fromLng, toLat, toLng, 'driving');
    } else if (transportType === 'walk') {
      // 도보 길찾기는 직선거리 기반 계산
      return calculateTravelTime(fromLat, fromLng, toLat, toLng, 'walking');
    } else {
      // 대중교통은 예상값 사용 (복잡한 API 호출 필요)
      return calculateTravelTime(fromLat, fromLng, toLat, toLng, 'transit');
    }
  } catch (error) {
    console.error('상세 이동시간 계산 오류:', error);
    // API 실패시 예상값 반환
    return calculateTravelTime(fromLat, fromLng, toLat, toLng, 
      transportType === 'car' ? 'driving' : transportType === 'walk' ? 'walking' : 'transit'
    );
  }
};

// 이동시간을 고려한 최적 경로 계산
export const optimizeRouteWithTravelTime = (
  startLocation: { lat: number; lng: number },
  destinations: Array<{ name: string; lat: number; lng: number }>,
  transportType: 'walking' | 'driving' | 'transit' = 'driving',
  endLocation?: { lat: number; lng: number }
): {
  optimizedRoute: Array<{ name: string; lat: number; lng: number }>;
  totalTravelTime: number;
  totalDistance: number;
  travelSegments: Array<TravelTimeInfo>;
} => {
  if (destinations.length === 0) {
    return {
      optimizedRoute: [],
      totalTravelTime: 0,
      totalDistance: 0,
      travelSegments: []
    };
  }
  
  const optimizedRoute: Array<{ name: string; lat: number; lng: number }> = [];
  const travelSegments: Array<TravelTimeInfo> = [];
  const remaining = [...destinations];
  let currentLocation = startLocation;
  let totalTravelTime = 0;
  let totalDistance = 0;
  
  // 가장 가까운 다음 장소를 찾는 그리디 알고리즘 (시간 기준)
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let shortestTime = calculateTravelTime(
      currentLocation.lat,
      currentLocation.lng,
      remaining[0].lat,
      remaining[0].lng,
      transportType
    ).durationMinutes;
    
    for (let i = 1; i < remaining.length; i++) {
      const travelTime = calculateTravelTime(
        currentLocation.lat,
        currentLocation.lng,
        remaining[i].lat,
        remaining[i].lng,
        transportType
      );
      
      if (travelTime.durationMinutes < shortestTime) {
        shortestTime = travelTime.durationMinutes;
        nearestIndex = i;
      }
    }
    
    const nearest = remaining.splice(nearestIndex, 1)[0];
    const travelInfo = calculateTravelTime(
      currentLocation.lat,
      currentLocation.lng,
      nearest.lat,
      nearest.lng,
      transportType
    );
    
    optimizedRoute.push(nearest);
    travelSegments.push(travelInfo);
    totalTravelTime += travelInfo.durationMinutes;
    totalDistance += travelInfo.distanceKm;
    currentLocation = nearest;
  }
  
  // 끝 위치가 지정된 경우 마지막 이동시간 추가
  if (endLocation) {
    const finalTravel = calculateTravelTime(
      currentLocation.lat,
      currentLocation.lng,
      endLocation.lat,
      endLocation.lng,
      transportType
    );
    travelSegments.push(finalTravel);
    totalTravelTime += finalTravel.durationMinutes;
    totalDistance += finalTravel.distanceKm;
  }
  
  return {
    optimizedRoute,
    totalTravelTime,
    totalDistance,
    travelSegments
  };
};

// 이동시간 표시용 포맷팅 함수
export const formatTravelTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}분`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
  }
};

// 이동비용 포맷팅 함수
export const formatTravelCost = (cost: number): string => {
  return `${cost.toLocaleString()}원`;
};

// 교통시설 검증 및 대안 제안 기능
export interface TransportFacility {
  name: string;
  address: string;
  lat: number;
  lng: number;
  exists: boolean;
  distance?: number; // km
}

export interface TransportValidationResult {
  isValid: boolean;
  facility?: TransportFacility;
  alternatives?: TransportFacility[];
  message: string;
}

// 교통수단별 검색 키워드 매핑
const TRANSPORT_KEYWORDS = {
  airplane: ['공항', '항공'],
  ktx: ['KTX', 'ktx역', '고속철도'],
  train: ['역', '기차역', '철도역'],
  bus: ['터미널', '버스터미널', '시외버스']
};

// 교통시설 존재 여부 검증
export const validateTransportFacility = async (
  destination: string,
  transportType: 'airplane' | 'ktx' | 'train' | 'bus'
): Promise<TransportValidationResult> => {
  try {
    const keywords = TRANSPORT_KEYWORDS[transportType];
    const searchQuery = `${destination} ${keywords[0]}`;
    
    console.log(`🔍 교통시설 검증: ${searchQuery}`);
    
    // 카카오 API로 해당 교통시설 검색
    const searchResults = await searchPlaces(searchQuery);
    
    // 검색 결과 필터링 (더 정확한 매칭)
    const validFacilities = searchResults.filter(place => {
      const placeName = place.place_name.toLowerCase();
      const address = place.address_name.toLowerCase();
      const destinationLower = destination.toLowerCase();
      
      // 목적지 이름이 포함되어야 함
      const hasDestination = placeName.includes(destinationLower) || address.includes(destinationLower);
      
      // 교통시설 키워드가 포함되어야 함
      const hasTransportKeyword = keywords.some(keyword => 
        placeName.includes(keyword.toLowerCase())
      );
      
      return hasDestination && hasTransportKeyword;
    });
    
    if (validFacilities.length > 0) {
      // 가장 적합한 시설 선택 (첫 번째 결과)
      const facility = validFacilities[0];
      return {
        isValid: true,
        facility: {
          name: facility.place_name,
          address: facility.address_name,
          lat: parseFloat(facility.y),
          lng: parseFloat(facility.x),
          exists: true
        },
        message: `✅ ${facility.place_name}을(를) 이용할 수 있습니다.`
      };
    } else {
      // 해당 교통시설이 없는 경우 대안 검색
      const alternatives = await findAlternativeTransport(destination, transportType);
      
      return {
        isValid: false,
        alternatives,
        message: `❌ ${destination}에는 ${getTransportTypeName(transportType)}이(가) 없습니다.`
      };
    }
  } catch (error) {
    console.error('교통시설 검증 오류:', error);
    return {
      isValid: false,
      message: '교통시설 정보를 확인할 수 없습니다. 다시 시도해주세요.'
    };
  }
};

// 대안 교통시설 검색
const findAlternativeTransport = async (
  destination: string,
  originalTransportType: 'airplane' | 'ktx' | 'train' | 'bus'
): Promise<TransportFacility[]> => {
  try {
    const alternatives: TransportFacility[] = [];
    
    // 목적지 좌표 얻기
    const destinationCoords = await getCoordinatesByAddress(destination);
    if (!destinationCoords) return alternatives;
    
    // 다른 교통수단들 검색
    const alternativeTypes = ['airplane', 'ktx', 'train', 'bus'].filter(
      type => type !== originalTransportType
    ) as Array<'airplane' | 'ktx' | 'train' | 'bus'>;
    
    for (const transportType of alternativeTypes) {
      const keywords = TRANSPORT_KEYWORDS[transportType];
      
      // 반경 50km 내에서 검색
      const searchResults = await searchPlaces(keywords[0]);
      
      const nearbyFacilities = searchResults
        .map(place => {
          const distance = calculateDistance(
            destinationCoords.lat,
            destinationCoords.lng,
            parseFloat(place.y),
            parseFloat(place.x)
          );
          
          return {
            name: place.place_name,
            address: place.address_name,
            lat: parseFloat(place.y),
            lng: parseFloat(place.x),
            exists: true,
            distance
          };
        })
        .filter(facility => facility.distance <= 100) // 100km 이내
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2); // 가장 가까운 2개만
      
      alternatives.push(...nearbyFacilities);
    }
    
    return alternatives.slice(0, 3); // 최대 3개 대안
  } catch (error) {
    console.error('대안 교통시설 검색 오류:', error);
    return [];
  }
};

// 교통수단 타입 이름 변환
const getTransportTypeName = (transportType: string): string => {
  const names: { [key: string]: string } = {
    airplane: '공항',
    ktx: 'KTX역',
    train: '기차역',
    bus: '버스터미널'
  };
  return names[transportType] || transportType;
};

// 검증된 교통시설 정보 가져오기
export const getValidatedTransportPoint = async (
  destination: string,
  transportType: 'airplane' | 'ktx' | 'train' | 'bus'
): Promise<string | null> => {
  const validation = await validateTransportFacility(destination, transportType);
  
  if (validation.isValid && validation.facility) {
    return validation.facility.name;
  }
  
  return null;
}; 