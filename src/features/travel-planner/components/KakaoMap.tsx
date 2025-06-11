'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface MapMarker {
  lat: number
  lng: number
  name: string
  description: string
  order?: number
  day?: number
}

interface KakaoMapProps {
  center: { lat: number; lng: number }
  markers: MapMarker[]
  zoom?: number
  height?: string
  level?: number
  className?: string
}

// 날짜별 색상 팔레트
const DAY_COLORS = [
  '#2563eb', // 파랑
  '#e11d48', // 핑크
  '#059669', // 초록
  '#f59e42', // 주황
  '#a21caf', // 보라
  '#64748b', // slate
  '#facc15', // 노랑
];

// 숫자 마커 이미지 생성 함수 (복원)
function createNumberMarkerImage(number: number, color: string = '#2563eb'): string {
  const size = 36;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2-2, 0, 2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), size/2, size/2);
  return canvas.toDataURL();
}

// 이름에서 'N일차 N번:' 패턴 제거 함수
function cleanPlaceName(name: string) {
  return name.replace(/^\d+일차\s*\d+번:\s*/, '').trim();
}

export function KakaoMap({ center, markers, zoom = 13, height = "400px", level, className = "" }: KakaoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [markerMode, setMarkerMode] = useState<'simple' | 'detail'>('simple');

  useEffect(() => {
    if (!mapContainerRef.current) {
      setDebugInfo('❌ mapContainerRef.current 없음');
      return;
    }
    setDebugInfo('✅ mapContainerRef.current 있음, 지도 초기화 시도');
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
        // 지도 초기화
        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: level || zoom || 13,
        });
        mapInstanceRef.current = map;
        setIsLoading(false);
        setError('');
        setDebugInfo('✅ 지도 생성 성공');

        // 기존 오버레이/마커/이벤트 초기화
        // (카카오맵은 자동으로 클린업, 리액트 리렌더마다 새로 그림)

        // 날짜별 그룹핑
        const dayGroups: Record<number, MapMarker[]> = {};
        markers.forEach((m) => {
          if (m.day && m.order) {
            if (!dayGroups[m.day]) dayGroups[m.day] = [];
            dayGroups[m.day].push(m);
          }
        });

        const overlays: any[] = [];
        const infoWindows: any[] = [];
        let lastOpenInfo: any = null;
        let lastOpenIdx: string | null = null;

        Object.entries(dayGroups).forEach(([dayStr, dayMarkers]) => {
          const day = Number(dayStr);
          const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
          // 1. 중복 제거 (좌표+이름 기준)
          const uniqueMarkersMap = new Map();
          dayMarkers.forEach((m) => {
            const key = `${m.name}_${m.lat}_${m.lng}`;
            if (!uniqueMarkersMap.has(key)) {
              uniqueMarkersMap.set(key, m);
            }
          });
          const uniqueMarkers = Array.from(uniqueMarkersMap.values());
          // 2. order 기준 정렬
          const sortedMarkers = uniqueMarkers
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          // 3. index(1부터) 부여 (markerIndex)
          const indexedMarkers = sortedMarkers.map((m, idx) => ({
            ...m,
            markerIndex: idx + 1,
          }));
          // 4. path도 indexedMarkers 기준
          const path = indexedMarkers.map((m) => new window.kakao.maps.LatLng(m.lat, m.lng));
          if (path.length > 1) {
            const polyline = new window.kakao.maps.Polyline({
              path,
              strokeWeight: 5,
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeStyle: 'solid',
              map,
            });
            overlays.push(polyline);
          }
          // 5. 마커도 indexedMarkers 기준으로 생성, markerIndex로 번호 표시
          // 출발점(markerIndex가 1인 마커)
          indexedMarkers.forEach((markerData) => {
            const position = new window.kakao.maps.LatLng(markerData.lat, markerData.lng);
            const isStart = markerData.markerIndex === 1;
            const markerImageUrl = createNumberMarkerImage(day, color);
            const marker = new window.kakao.maps.Marker({
              position,
              map,
              image: new window.kakao.maps.MarkerImage(
                markerImageUrl,
                new window.kakao.maps.Size(36, 36)
              ),
            });
            const cleanName = cleanPlaceName(markerData.name);
            const infoWindow = new window.kakao.maps.InfoWindow({
              content:
                markerMode === 'simple'
                  ? `
                    <div style=\"padding: 12px 16px; min-width: 120px; max-width: 320px; font-size: 15px; line-height: 1.5; word-break: break-all; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: flex-start;\">
                      <div style=\"font-weight: 600; color: #222;\">${day}일차: ${cleanName}</div>
                    </div>
                  `
                  : `
                    <div style=\"padding: 16px 18px; min-width: 220px; max-width: 400px; font-size: 16px; line-height: 1.6; word-break: break-all; background: white; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: flex-start;\">
                      <h4 style=\"margin: 0 0 10px 0; color: #222; font-size: 18px; font-weight: bold;\">${day}일차: ${cleanName}</h4>
                      <p style=\"margin: 0 0 6px 0; color: #666; font-size: 15px;\">${markerData.description ?? ''}</p>
                    </div>
                  `,
              zIndex: 10,
            });
            infoWindows.push(infoWindow);
            // Marker 클릭 이벤트 등록
            window.kakao.maps.event.addListener(marker, 'click', () => {
              if (lastOpenInfo && lastOpenIdx === `${day}-${markerData.markerIndex}`) {
                lastOpenInfo.close();
                lastOpenInfo = null;
                lastOpenIdx = null;
              } else {
                infoWindows.forEach((iw) => iw.close());
                infoWindow.open(map, marker);
                lastOpenInfo = infoWindow;
                lastOpenIdx = `${day}-${markerData.markerIndex}`;
              }
            });
          });
        });
        window.kakao.maps.event.addListener(map, 'click', () => {
          infoWindows.forEach((iw) => iw.close());
          lastOpenInfo = null;
          lastOpenIdx = null;
        });
      } catch (e) {
        setError('지도 생성 실패: ' + e);
        setIsLoading(false);
      }
    };
    checkSDKAndInit();
  }, [center, markers, zoom, level, markerMode]);

  return (
    <div className={cn("border rounded-lg overflow-hidden relative", className)} style={{ height: height === '100%' ? '100%' : height }}>
      {/* 마커 클릭 모드 토글 버튼 */}
      <div className="absolute top-3 right-3 z-50 flex gap-2 bg-white/90 rounded shadow px-2 py-1">
        <button
          className={`px-3 py-1 rounded font-semibold text-sm transition-colors ${markerMode === 'simple' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setMarkerMode('simple')}
        >
          장소명만 보기
        </button>
        <button
          className={`px-3 py-1 rounded font-semibold text-sm transition-colors ${markerMode === 'detail' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setMarkerMode('detail')}
        >
          상세 정보 보기
        </button>
      </div>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && <div>카카오맵 로딩 중...</div>}
      {error && <div>{error}</div>}
      <div className="text-xs text-gray-400">{debugInfo}</div>
      <div className="text-xs text-blue-600 px-2 pb-2">숫자 마커(원형)를 클릭하면 {markerMode === 'simple' ? '장소명만' : '상세 정보'}를 확인할 수 있습니다. 지도 아무 곳이나 클릭하면 정보창이 닫힙니다.</div>
    </div>
  );
} 