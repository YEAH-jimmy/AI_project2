// 카카오 지도 API 관련 타입 정의
declare global {
  interface Window {
    kakao: any;
  }
}

// API 키 직접 설정 (임시 해결책)
const KAKAO_API_KEY = '792bf600641432ebcbd645acbd5c823e';
const KAKAO_REST_API_KEY = '792bf600641432ebcbd645acbd5c823e';

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
    // 환경변수가 로드되지 않으면 직접 설정한 키 사용
    const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || KAKAO_API_KEY;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        resolve();
      });
    };
    
    script.onerror = () => {
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
      throw new Error('카카오 REST API 키가 설정되지 않았습니다.');
    }

    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.append('query', query);
    if (category) {
      url.searchParams.append('category_group_code', category);
    }
    url.searchParams.append('size', '15');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `KakaoAK ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('장소 검색에 실패했습니다.');
    }

    const data: KakaoSearchResponse = await response.json();
    return data.documents;
  } catch (error) {
    console.error('장소 검색 오류:', error);
    return [];
  }
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