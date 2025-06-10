'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SimpleMapMarker {
  lat: number
  lng: number
  name: string
}

interface SimpleKakaoMapProps {
  center: { lat: number; lng: number }
  markers: SimpleMapMarker[]
  zoom?: number
  height?: string
  className?: string
}

export function SimpleKakaoMap({ 
  center, 
  markers, 
  zoom = 13, 
  height = "400px", 
  className = "" 
}: SimpleKakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    const checkSDKAndInit = () => {
      attempts++;
      if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps || !window.kakao.maps.Map) {
        if (attempts < maxAttempts) {
          setTimeout(checkSDKAndInit, 500);
        } else {
          setError('카카오맵 SDK 로드 실패');
          setIsLoading(false);
        }
        return;
      }

      try {
        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: zoom,
        });
        
        mapInstanceRef.current = map;
        setIsLoading(false);
        setError('');

        const infoWindows: any[] = [];
        let lastOpenInfo: any = null;

        // 마커 생성 및 클릭 이벤트 설정
        markers.forEach((markerData) => {
          const position = new window.kakao.maps.LatLng(markerData.lat, markerData.lng);
          
          // 기본 마커 생성
          const marker = new window.kakao.maps.Marker({
            position,
            map,
          });

          // 간단한 정보창 생성 (장소명만 표시)
          const infoWindow = new window.kakao.maps.InfoWindow({
            content: `
              <div style="padding: 6px 10px; font-size: 13px; line-height: 1.3; color: #333; background: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); white-space: nowrap;">
                ${markerData.name}
              </div>
            `,
            zIndex: 10,
          });

          infoWindows.push(infoWindow);

          // 마커 클릭 이벤트 - 토글 방식
          window.kakao.maps.event.addListener(marker, 'click', () => {
            // 현재 열려있는 정보창이 이 마커의 정보창이면 닫기
            if (lastOpenInfo === infoWindow) {
              infoWindow.close();
              lastOpenInfo = null;
            } else {
              // 다른 정보창들 모두 닫기
              infoWindows.forEach((iw) => iw.close());
              // 현재 마커의 정보창 열기
              infoWindow.open(map, marker);
              lastOpenInfo = infoWindow;
            }
          });
        });

        // 지도 클릭 시 모든 정보창 닫기
        window.kakao.maps.event.addListener(map, 'click', () => {
          infoWindows.forEach((iw) => iw.close());
          lastOpenInfo = null;
        });

      } catch (e) {
        setError('지도 생성 실패: ' + String(e));
        setIsLoading(false);
      }
    };

    checkSDKAndInit();
  }, [center, markers, zoom]);

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)} style={{ height: height === '100%' ? '100%' : height }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">지도 로딩 중...</div>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center h-full">
          <div className="text-red-500">{error}</div>
        </div>
      )}
      <div className="text-xs text-blue-600 px-2 pb-2">
        📍 마커를 클릭하면 장소명이 표시됩니다. 지도를 클릭하면 정보창이 닫힙니다.
      </div>
    </div>
  );
} 