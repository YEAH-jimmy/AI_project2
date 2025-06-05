// 카카오 지도 API 관련 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

// API 키 직접 설정 (용도별 구분)
const KAKAO_API_KEY = '792bf600641432ebcbd645acbd5c823e'; // JavaScript 키 (지도 표시용)
const KAKAO_REST_API_KEY = '39073343b9c1560949ca1bb5d7c2d20e'; // REST API 키 (장소 검색용)

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
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    // 하드코딩된 키를 우선 사용
    const apiKey = KAKAO_API_KEY;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log('카카오 지도 로드 완료');
        resolve();
      });
    };
    
    script.onerror = () => {
      console.error('카카오 지도 스크립트 로드 실패');
      reject(new Error('카카오 지도 스크립트 로드에 실패했습니다.'));
    };

    document.head.appendChild(script);
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