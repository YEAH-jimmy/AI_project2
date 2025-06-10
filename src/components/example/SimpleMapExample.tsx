'use client'

import { SimpleKakaoMap } from '@/components/SimpleKakaoMap'

export function SimpleMapExample() {
  // 예제 마커 데이터 (서울 주요 관광지)
  const exampleMarkers = [
    {
      lat: 37.5665,
      lng: 126.9780,
      name: '서울시청',
    },
    {
      lat: 37.5758,
      lng: 126.9768,
      name: '경복궁',
    },
    {
      lat: 37.5701,
      lng: 126.9822,
      name: '명동성당',
    },
    {
      lat: 37.5547,
      lng: 126.9707,
      name: '남산타워',
    },
    {
      lat: 37.5662,
      lng: 126.9844,
      name: '동대문 디자인 플라자',
    },
  ];

  // 지도 중심점 (서울시청)
  const mapCenter = {
    lat: 37.5665,
    lng: 126.9780,
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">간단한 지도 예제</h2>
      <p className="text-gray-600 mb-6">
        마커를 클릭하면 장소명만 간단하게 표시됩니다.
      </p>
      
      <SimpleKakaoMap
        center={mapCenter}
        markers={exampleMarkers}
        zoom={12}
        height="500px"
        className="shadow-lg"
      />
      
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">사용 방법:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 빨간 마커를 클릭하면 장소명이 표시됩니다</li>
          <li>• 다른 마커를 클릭하면 이전 정보창은 자동으로 닫힙니다</li>
          <li>• 지도의 빈 공간을 클릭하면 모든 정보창이 닫힙니다</li>
          <li>• 같은 마커를 다시 클릭하면 정보창이 토글됩니다</li>
        </ul>
      </div>
    </div>
  );
} 