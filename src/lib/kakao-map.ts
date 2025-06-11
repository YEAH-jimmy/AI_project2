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

// 역명 매핑 테이블 (정확한 역명으로 매핑)
const STATION_NAME_MAPPING = {
  '경주': '신경주역', // KTX는 신경주역
  '구미': '김천구미역', // KTX는 김천구미역  
  '여수': '여수엑스포역', // KTX는 여수엑스포역
  '광주광역시': '광주송정역', // KTX는 광주송정역
  '천안': '천안아산역', // KTX는 천안아산역
  '아산': '천안아산역', // KTX는 천안아산역
  '울산': '울산역', // KTX는 울산역
  '부산': '부산역', // KTX는 부산역 (신부산역 아님)
};

// 교통시설이 없는 것으로 알려진 도시들
const CITIES_WITHOUT_FACILITIES = {
  airplane: [
    '전주', '군산', '익산', '정읍', '남원', // 전라북도
    '천안', '아산', '당진', '공주', '보령', '서산', '논산', '계룡', '금산', '부여', '서천', '청양', '홍성', '예산', '태안', // 충청남도  
    '춘천', '원주', '강릉', '동해', '태백', '속초', '삼척', '홍천', '횡성', '영월', '평창', '정선', '철원', '화천', '양구', '인제', '고성', '양양', // 강원도
    '수원', '성남', '의정부', '안양', '부천', '광명', '평택', '동두천', '안산', '고양', '과천', '구리', '남양주', '오산', '시흥', '군포', '의왕', '하남', '용인', '파주', '이천', '안성', '김포', '화성', '경기광주', '양주', '포천', '여주', '연천', '가평', '양평', // 경기도 (경기광주로 구분)
    '청주', '충주', '제천', '보은', '옥천', '영동', '진천', '괴산', '음성', '단양', '증평', // 충청북도
    '포항', '경주', '김천', '안동', '구미', '영주', '영천', '상주', '문경', '경산', '군위', '의성', '청송', '영양', '영덕', '청도', '고령', '성주', '칠곡', '예천', '봉화', '울진', '울릉', // 경상북도
    '창원', '마산', '진해', '진주', '통영', '김해', '밀양', '거제', '양산', '의령', '함안', '창녕', '고성', '남해', '하동', '산청', '함양', '거창', '합천', // 경상남도  
    '순천', '나주', '광양', '담양', '곡성', '구례', '고흥', '보성', '화순', '장흥', '강진', '해남', '영암', '무안', '함평', '영광', '장성', '완도', '진도', '신안', // 전라남도
    '울산', // 울산광역시 - 공항 없음
  ],
  ktx: [
    '속초', '동해', '삼척', // 강원 동해안
    '포항', // 경북 동해안  
    '통영', '거제', '남해', '하동', // 경남 남해안
    '완도', '진도', '신안', '고흥', '보성', // 전남 남해안
    '서산', '태안', '보령', // 충남 서해안
    '군산', '남원', // 전북 내륙 (정읍은 KTX 있음)
    '제천', '단양', '영월', '정선', // 산간지역
    '춘천', '원주', // 강원도 내륙
    '진주', // 경남 내륙
    '경기광주', // 경기도 광주시 (광주광역시와 구분)
  ],
  train: [
    // 기차역이 없는 소규모 군 단위 지역들
    '울릉', '독도', '신안', '진도', '완도', '고흥',
  ],
  bus: [
    // 버스터미널이 없는 매우 작은 지역들  
    '울릉', '독도',
  ]
};

// 실제 KTX역 목록 (일부)
const ACTUAL_KTX_STATIONS = [
  '서울역', '용산역', '광명역', '천안아산역', '오송역', '대전역', '김천구미역', '동대구역', '신경주역', '울산역', '부산역',
  '익산역', '정읍역', '광주송정역', '목포역', '전주역', '순천역', '여수엑스포역',
  '평창역', '진부역', '강릉역', '동해역',
  '수서역', '지제역', '만종역', '강동역', '영주역', '봉화역', '춘양역', '안동역'
];

// 실제 일반열차역 목록 (주요역들)
const ACTUAL_TRAIN_STATIONS = [
  '서울역', '용산역', '영등포역', '안양역', '수원역', '평택역', '천안역', '조치원역', '대전역', '영동역', '김천역', '구미역', '대구역', '동대구역', '경주역', '울산역', '부산역', '부전역',
  '익산역', '정읍역', '광주역', '목포역', '전주역', '순천역', '여수역',
  '청량리역', '원주역', '제천역', '단양역', '영주역', '안동역', '태백역', '동해역', '강릉역'
];

// 모호한 지명 검증 및 명확화
export const clarifyAmbiguousDestination = (destination: string): { 
  needsClarification: boolean; 
  message?: string; 
  suggestions?: string[] 
} => {
  const dest = destination.trim().toLowerCase();
  
  // 광주만 입력한 경우
  if (dest === '광주') {
    return {
      needsClarification: true,
      message: '광주는 두 곳이 있습니다. 정확한 지역을 선택해주세요.',
      suggestions: ['광주광역시', '광주시 (경기도)']
    };
  }
  
  // 추후 다른 모호한 지명들도 추가 가능
  // 예: 김포 (김포시 vs 김포공항), 창원 (창원시 vs 구 마산/진해) 등
  
  return { needsClarification: false };
};

// 교통시설 존재 여부 검증
export const validateTransportFacility = async (
  destination: string,
  transportType: 'airplane' | 'ktx' | 'train' | 'bus'
): Promise<TransportValidationResult> => {
  try {
    // 먼저 모호한 지명인지 확인
    const clarification = clarifyAmbiguousDestination(destination);
    if (clarification.needsClarification) {
      return {
        isValid: false,
        message: clarification.message || '지역명을 명확히 입력해주세요.'
      };
    }
    
    // 지명 정규화 (경기도 광주는 "경기광주"로 처리)
    let normalizedDestination = destination.trim();
    if (normalizedDestination.includes('광주시') && normalizedDestination.includes('경기')) {
      normalizedDestination = '경기광주';
    } else if (normalizedDestination === '광주시' && !normalizedDestination.includes('광역')) {
      normalizedDestination = '경기광주'; // 단순히 "광주시"라고 하면 경기도로 간주
    }
    
    // 먼저 알려진 예외 도시들을 확인
    const citiesWithoutFacility = CITIES_WITHOUT_FACILITIES[transportType] || [];
    const destinationLower = normalizedDestination.toLowerCase();
    
    // 정확한 매칭과 부분 매칭 모두 확인
    const hasNoFacility = citiesWithoutFacility.some(city => {
      const cityLower = city.toLowerCase();
      return destinationLower === cityLower || 
             destinationLower.includes(cityLower) || 
             cityLower.includes(destinationLower);
    });
    
    if (hasNoFacility) {
      console.log(`🚫 ${normalizedDestination}는 ${getTransportTypeName(transportType)}이 없는 것으로 알려진 지역입니다.`);
      
      // 대안 검색
      const alternatives = await findAlternativeTransport(normalizedDestination, transportType);
      
      return {
        isValid: false,
        alternatives,
        message: `❌ ${normalizedDestination}에는 ${getTransportTypeName(transportType)}이(가) 없습니다.`
      };
    }

    const keywords = TRANSPORT_KEYWORDS[transportType];
    
    // 역명 매핑 적용 (특히 KTX의 경우)
    let searchDestination = normalizedDestination;
    if (transportType === 'ktx' && STATION_NAME_MAPPING[normalizedDestination]) {
      searchDestination = STATION_NAME_MAPPING[normalizedDestination];
      console.log(`🔄 역명 매핑: ${normalizedDestination} → ${searchDestination}`);
    }
    
    // 광주광역시의 특별 처리
    if (normalizedDestination === '광주광역시' || normalizedDestination === '광주') {
      if (transportType === 'airplane') {
        searchDestination = '광주공항';
      } else if (transportType === 'bus') {
        searchDestination = '광주 유스퀘어';
      } else if (transportType === 'train') {
        searchDestination = '광주역';
      }
    }
    
    const searchQuery = `${searchDestination} ${keywords[0]}`;
    
    console.log(`🔍 교통시설 검증: ${searchQuery}`);
    
    // 카카오 API로 해당 교통시설 검색
    const searchResults = await searchPlaces(searchQuery);
    
    // 검색 결과 필터링 (더 정확한 매칭)
    const validFacilities = searchResults.filter(place => {
      const placeName = place.place_name.toLowerCase();
      const address = place.address_name.toLowerCase();
      const destinationLower = normalizedDestination.toLowerCase();
      
      // 목적지 이름이 포함되어야 함 (광주 특별 처리)
      let hasDestination;
      if (normalizedDestination === '광주광역시') {
        hasDestination = (placeName.includes('광주') || address.includes('광주')) &&
                        !address.includes('경기') && // 경기도 광주 제외
                        !address.includes('경기도');
      } else if (normalizedDestination === '경기광주') {
        hasDestination = address.includes('경기') && (placeName.includes('광주') || address.includes('광주'));
      } else {
        hasDestination = placeName.includes(destinationLower) || address.includes(destinationLower);
      }
      
      // 교통시설 키워드가 포함되어야 함
      const hasTransportKeyword = keywords.some(keyword => 
        placeName.includes(keyword.toLowerCase())
      );
      
      // 추가 검증: 실제로 유효한 교통시설인지 확인
      const isValidFacility = (() => {
        if (transportType === 'airplane') {
          // 공항의 경우 더 엄격한 검증
          return placeName.includes('공항') && 
                 !placeName.includes('도로') && 
                 !placeName.includes('아파트') &&
                 !placeName.includes('마트') &&
                 !placeName.includes('병원') &&
                 !placeName.includes('주차장') &&
                 !placeName.includes('카페') &&
                 !placeName.includes('식당');
        } else if (transportType === 'ktx') {
          // KTX의 경우 역이 포함되어야 하고 부적절한 시설은 제외
          const isValidStation = (placeName.includes('역') || placeName.includes('KTX')) &&
                 !placeName.includes('아파트') &&
                 !placeName.includes('마트') &&
                 !placeName.includes('병원') &&
                 !placeName.includes('주차장') &&
                 !placeName.includes('카페') &&
                 !placeName.includes('식당') &&
                 !placeName.includes('빌딩') &&
                 !placeName.includes('오피스텔') &&
                 !placeName.includes('펜션') &&
                 !placeName.includes('호텔') &&
                 !placeName.includes('모텔') &&
                 !placeName.includes('상가') &&
                 !placeName.includes('쇼핑') &&
                 !placeName.includes('세권') &&
                 !placeName.includes('타워') &&
                 !placeName.includes('센터') &&
                 !placeName.includes('프라자') &&
                 !placeName.includes('마트') &&
                 !placeName.includes('점포') &&
                 !placeName.includes('상점');
          
          // 실제 KTX역 목록과 비교
          const matchesActualStation = ACTUAL_KTX_STATIONS.some(station => 
            placeName.includes(station.toLowerCase()) || 
            (destinationLower === '전주' && placeName.includes('전주역')) ||
            (destinationLower === '경주' && placeName.includes('신경주역')) ||
            (destinationLower === '구미' && placeName.includes('김천구미역')) ||
            (destinationLower === '여수' && placeName.includes('여수엑스포역')) ||
            (destinationLower === '광주광역시' && placeName.includes('광주송정역')) ||
            (destinationLower === '천안' && placeName.includes('천안아산역')) ||
            (destinationLower === '아산' && placeName.includes('천안아산역'))
          );
          
          return isValidStation && matchesActualStation;
        } else if (transportType === 'train') {
          // 일반열차의 경우
          const isValidStation = placeName.includes('역') &&
                 !placeName.includes('아파트') &&
                 !placeName.includes('마트') &&
                 !placeName.includes('병원') &&
                 !placeName.includes('주차장') &&
                 !placeName.includes('카페') &&
                 !placeName.includes('식당') &&
                 !placeName.includes('빌딩') &&
                 !placeName.includes('오피스텔') &&
                 !placeName.includes('펜션') &&
                 !placeName.includes('호텔') &&
                 !placeName.includes('모텔') &&
                 !placeName.includes('상가') &&
                 !placeName.includes('쇼핑') &&
                 !placeName.includes('세권') &&
                 !placeName.includes('타워') &&
                 !placeName.includes('센터') &&
                 !placeName.includes('프라자') &&
                 !placeName.includes('점포') &&
                 !placeName.includes('상점');
          
          // 실제 기차역 목록과 비교
          const matchesActualStation = ACTUAL_TRAIN_STATIONS.some(station => 
            placeName.includes(station.toLowerCase())
          );
          
          return isValidStation && matchesActualStation;
        } else if (transportType === 'bus') {
          // 버스터미널의 경우 (유스퀘어 등 복합시설 포함)
          return (placeName.includes('터미널') || placeName.includes('유스퀘어') || placeName.includes('유스케어')) &&
                 !placeName.includes('아파트') &&
                 !placeName.includes('마트') &&
                 !placeName.includes('병원') &&
                 !placeName.includes('주차장') &&
                 !placeName.includes('카페') &&
                 !placeName.includes('식당') &&
                 !placeName.includes('빌딩') &&
                 !placeName.includes('오피스텔') &&
                 !placeName.includes('펜션') &&
                 !placeName.includes('호텔') &&
                 !placeName.includes('모텔') &&
                 !placeName.includes('상가') &&
                 !placeName.includes('쇼핑') &&
                 !placeName.includes('세권') &&
                 !placeName.includes('타워') &&
                 !placeName.includes('센터') &&
                 !placeName.includes('프라자') &&
                 !placeName.includes('점포') &&
                 !placeName.includes('상점');
        }
        return true;
      })();
      
      return hasDestination && hasTransportKeyword && isValidFacility;
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

// 숙소 검색 관련 인터페이스 및 함수들
export interface AccommodationInfo {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  phone?: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  amenities?: string[];
  distance?: number; // 기준점으로부터의 거리 (km)
}

// 숙소 타입별 검색 키워드
const accommodationKeywords: { [key: string]: string[] } = {
  'hotel': ['호텔', '비즈니스호텔', '관광호텔'],
  'airbnb': ['펜션', '민박', '게스트하우스', '에어비앤비'],
  'guesthouse': ['게스트하우스', '민박', '청년여관'],
  'resort': ['리조트', '콘도', '리조트호텔'],
  'other': ['모텔', '여관', '펜션', '민박']
};

/**
 * 특정 위치 주변의 숙소를 검색합니다
 * @param lat 위도
 * @param lng 경도  
 * @param accommodationType 숙소 타입
 * @param radius 검색 반경 (km, 기본값: 10km)
 * @returns 숙소 목록
 */
export const searchAccommodationsNearby = async (
  lat: number,
  lng: number,
  accommodationType: string = 'hotel',
  radius: number = 10
): Promise<AccommodationInfo[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || KAKAO_REST_API_KEY;
    
    if (!apiKey) {
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    console.log(`숙소 검색 시작: 위치=(${lat}, ${lng}), 타입=${accommodationType}, 반경=${radius}km`);

    const keywords = accommodationKeywords[accommodationType] || accommodationKeywords['hotel'];
    const allAccommodations: AccommodationInfo[] = [];

    // 각 키워드로 검색하여 결과 수집
    for (const keyword of keywords) {
      try {
        const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
        url.searchParams.append('query', keyword);
        url.searchParams.append('category_group_code', 'AD5'); // 숙박 시설
        url.searchParams.append('x', lng.toString());
        url.searchParams.append('y', lat.toString());
        url.searchParams.append('radius', (radius * 1000).toString()); // m 단위로 변환
        url.searchParams.append('size', '15');
        url.searchParams.append('sort', 'distance'); // 거리순 정렬

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `KakaoAK ${apiKey}`,
          },
        });

        if (!response.ok) {
          console.warn(`숙소 검색 실패 (${keyword}):`, response.status);
          continue;
        }

        const data: KakaoSearchResponse = await response.json();
        
        // 결과를 AccommodationInfo 형태로 변환
        const accommodations = data.documents.map(place => {
          const distance = place.distance ? parseFloat(place.distance) / 1000 : 0; // km 변환
          
          return {
            id: place.id,
            name: place.place_name,
            address: place.address_name,
            lat: parseFloat(place.y),
            lng: parseFloat(place.x),
            category: place.category_name,
            phone: place.phone,
            url: place.place_url,
            rating: generateSimulatedRating(place),
            reviewCount: generateSimulatedReviewCount(place),
            priceRange: generatePriceRange(place, accommodationType),
            amenities: generateAmenities(place, accommodationType),
            distance: distance
          };
        });

        allAccommodations.push(...accommodations);
        
        console.log(`${keyword} 검색 결과: ${accommodations.length}개`);
        
      } catch (error) {
        console.warn(`${keyword} 검색 중 오류:`, error);
        continue;
      }
    }

    // 중복 제거 (같은 이름과 주소)
    const uniqueAccommodations = allAccommodations.filter((accommodation, index, arr) =>
      arr.findIndex(a => a.name === accommodation.name && a.address === accommodation.address) === index
    );

    // 거리순 정렬 후 상위 10개 선택
    const sortedAccommodations = uniqueAccommodations
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 10);

    console.log(`총 ${sortedAccommodations.length}개 숙소 검색 완료`);
    
    return sortedAccommodations;
    
  } catch (error) {
    console.error('숙소 검색 중 오류:', error);
    return [];
  }
};

/**
 * 마지막 일정 장소 주변의 숙소를 추천합니다
 * @param lastPlace 마지막 일정 장소
 * @param accommodationType 숙소 타입
 * @returns 추천 숙소 목록
 */
export const recommendAccommodationNearLastPlace = async (
  lastPlace: { name: string; lat: number; lng: number },
  accommodationType: string = 'hotel'
): Promise<AccommodationInfo[]> => {
  console.log(`마지막 일정 "${lastPlace.name}" 주변 숙소 추천 시작`);
  
  const accommodations = await searchAccommodationsNearby(
    lastPlace.lat,
    lastPlace.lng,
    accommodationType,
    5 // 5km 반경으로 축소하여 더 가까운 숙소 추천
  );

  // 평점과 거리를 고려한 추천 점수 계산
  const scoredAccommodations = accommodations.map(acc => ({
    ...acc,
    recommendationScore: calculateAccommodationScore(acc)
  })).sort((a, b) => b.recommendationScore - a.recommendationScore);

  return scoredAccommodations.slice(0, 5); // 상위 5개 추천
};

// 숙소 추천 점수 계산
const calculateAccommodationScore = (accommodation: AccommodationInfo): number => {
  let score = 0;
  
  // 평점 점수 (40%)
  if (accommodation.rating) {
    score += (accommodation.rating / 5) * 40;
  }
  
  // 거리 점수 (30%) - 가까울수록 높은 점수
  if (accommodation.distance !== undefined) {
    const distanceScore = Math.max(0, 30 - (accommodation.distance * 6)); // 5km 이내에서 최대 점수
    score += distanceScore;
  }
  
  // 리뷰 수 점수 (20%)
  if (accommodation.reviewCount) {
    const reviewScore = Math.min(20, accommodation.reviewCount / 50 * 20); // 최대 20점
    score += reviewScore;
  }
  
  // 카테고리 보너스 (10%)
  if (accommodation.category?.includes('호텔') || accommodation.category?.includes('리조트')) {
    score += 10;
  } else if (accommodation.category?.includes('펜션') || accommodation.category?.includes('게스트')) {
    score += 7;
  }
  
  return Math.round(score * 10) / 10;
};

// 가격대 시뮬레이션 (사용하지 않음 - 하드코딩된 데이터이므로 제거)
const generatePriceRange = (place: KakaoPlace, accommodationType: string): string => {
  return ''; // 빈 문자열 반환
};

// 편의시설 시뮬레이션
const generateAmenities = (place: KakaoPlace, accommodationType: string): string[] => {
  const baseAmenities = ['무료 Wi-Fi', '24시간 프런트', '주차장'];
  
  const typeSpecificAmenities: { [key: string]: string[] } = {
    'hotel': ['룸서비스', '피트니스센터', '비즈니스센터', '레스토랑', '라운지'],
    'resort': ['수영장', '스파', '사우나', '골프장', '테니스장', '키즈클럽'],
    'guesthouse': ['공용주방', '세탁시설', '라운지', '짐보관서비스'],
    'airbnb': ['주방시설', '세탁기', '건조기', 'Netflix', '셀프체크인'],
    'other': ['온천', '바베큐시설', '픽업서비스', '자전거대여']
  };
  
  const specificAmenities = typeSpecificAmenities[accommodationType] || typeSpecificAmenities['hotel'];
  const randomCount = Math.floor(Math.random() * 4) + 2; // 2-5개
  const shuffled = [...baseAmenities, ...specificAmenities].sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, randomCount);
}; 