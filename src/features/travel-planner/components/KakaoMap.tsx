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

export function KakaoMap({ center, markers, zoom = 13, height = "400px", level, className = "" }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  useEffect(() => {
    if (!mapRef.current) return

    console.log('카카오맵 초기화 시작', { center, markers: markers.length });

    // 디버그 정보 업데이트
    const updateDebugInfo = (info: string) => {
      console.log(info);
      setDebugInfo(prev => prev + '\n' + info);
    };

    // 카카오맵 초기화 함수
    const initializeMap = () => {
      try {
        updateDebugInfo('지도 초기화 시작...');
        
        if (!(window as any).kakao || !(window as any).kakao.maps) {
          throw new Error('카카오맵 API를 찾을 수 없습니다.');
        }

        updateDebugInfo('카카오맵 API 발견');

        const options = {
          center: new (window as any).kakao.maps.LatLng(center.lat, center.lng),
          level: level || zoom
        }
        
        updateDebugInfo(`지도 생성 중... 중심점: ${center.lat}, ${center.lng}, 레벨: ${options.level}`);
        const map = new (window as any).kakao.maps.Map(mapRef.current!, options)
        mapInstanceRef.current = map
        updateDebugInfo('지도 생성 완료');

        // 마커 추가
        updateDebugInfo(`마커 추가 시작: ${markers.length}개`);
        markers.forEach((marker, index) => {
          const markerPosition = new (window as any).kakao.maps.LatLng(marker.lat, marker.lng)
          
          // 순서가 있는 마커의 경우 커스텀 이미지 사용
          let markerImage = null;
          if (marker.order && marker.day) {
            try {
              // 날짜별 색상 구분
              const dayColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
              const color = dayColors[(marker.day - 1) % dayColors.length];
              
              // 숫자가 포함된 마커 아이콘 생성
              const imageSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
                <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
                  <circle cx="15" cy="15" r="10" fill="white"/>
                  <text x="15" y="20" text-anchor="middle" font-family="Arial" font-size="12" font-weight="bold" fill="${color}">${marker.order}</text>
                </svg>
              `)}`
              
              markerImage = new (window as any).kakao.maps.MarkerImage(
                imageSrc,
                new (window as any).kakao.maps.Size(30, 40),
                { offset: new (window as any).kakao.maps.Point(15, 40) }
              )
            } catch (imgError) {
              console.warn('커스텀 마커 이미지 생성 실패, 기본 마커 사용:', imgError);
              markerImage = null;
            }
          }
          
          const kakaoMarker = new (window as any).kakao.maps.Marker({
            position: markerPosition,
            image: markerImage,
            title: marker.name
          })

          kakaoMarker.setMap(map)

          // 인포윈도우 생성
          const infoWindow = new (window as any).kakao.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px; max-width: 300px;">
                <h4 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">
                  ${marker.name}
                </h4>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ${marker.description}
                </p>
                ${marker.order && marker.day ? `
                  <div style="margin-top: 5px; font-size: 11px; color: #999;">
                    ${marker.day}일차 ${marker.order}번째 방문지
                  </div>
                ` : ''}
              </div>
            `,
            removable: true
          })

          // 마커 클릭 이벤트
          ;(window as any).kakao.maps.event.addListener(kakaoMarker, 'click', () => {
            infoWindow.open(map, kakaoMarker)
          })
        })

        // 마커들이 모두 보이도록 지도 범위 조정
        if (markers.length > 1) {
          const bounds = new (window as any).kakao.maps.LatLngBounds()
          markers.forEach(marker => {
            bounds.extend(new (window as any).kakao.maps.LatLng(marker.lat, marker.lng))
          })
          map.setBounds(bounds)
        }

        updateDebugInfo('지도 초기화 완료!');
        setIsLoading(false);
        setError('');
      } catch (error) {
        console.error('카카오맵 초기화 오류:', error)
        const errorMsg = '지도를 불러오는 중 오류가 발생했습니다: ' + (error as Error).message;
        setError(errorMsg);
        updateDebugInfo('오류: ' + errorMsg);
        setIsLoading(false);
      }
    }

    // 카카오맵 API가 로드될 때까지 대기
    const waitForKakaoMaps = (attempts = 0) => {
      const maxAttempts = 50; // 5초 대기로 단축
      
      updateDebugInfo(`대기 중... (${attempts + 1}/${maxAttempts})`);
      
      // 윈도우 객체와 카카오 API 상태 체크
      const hasWindow = typeof window !== 'undefined';
      const hasKakao = hasWindow && !!(window as any).kakao;
      const hasMaps = hasKakao && !!(window as any).kakao.maps;
      
      updateDebugInfo(`상태 체크 - Window: ${hasWindow}, Kakao: ${hasKakao}, Maps: ${hasMaps}`);
      
      if (hasKakao && hasMaps) {
        updateDebugInfo('카카오맵 API 준비 완료');
        try {
          // kakao.maps.load 사용하지 않고 바로 초기화 시도
          if ((window as any).kakao.maps.Map) {
            updateDebugInfo('Map 클래스 발견, 바로 초기화');
            initializeMap();
          } else {
            updateDebugInfo('Map 클래스 로딩 대기');
            (window as any).kakao.maps.load(() => {
              updateDebugInfo('카카오맵 라이브러리 로드 완료');
              initializeMap();
            });
          }
        } catch (loadError) {
          console.error('카카오맵 로드 중 오류:', loadError);
          updateDebugInfo('로드 오류, 직접 초기화 시도');
          // 이미 로드된 경우 바로 초기화 시도
          initializeMap();
        }
      } else if (attempts < maxAttempts) {
        setTimeout(() => waitForKakaoMaps(attempts + 1), 100);
      } else {
        console.error('카카오맵 API 로딩 타임아웃');
        const timeoutMsg = '카카오맵 API를 불러올 수 없습니다. API 키 또는 네트워크를 확인해주세요.';
        setError(timeoutMsg);
        updateDebugInfo('타임아웃: ' + timeoutMsg);
        setIsLoading(false);
      }
    };

    waitForKakaoMaps();

    // cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [center, markers, zoom, level])

  if (error) {
    return (
      <div 
        className={cn("w-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg", className)}
        style={{ height: height || '400px' }}
      >
        <div className="text-center p-4 max-w-lg">
          <div className="text-red-500 mb-2">🚫</div>
          <p className="text-red-700 font-medium mb-1">지도 로딩 실패</p>
          <p className="text-red-600 text-sm mb-2">{error}</p>
          
          {/* 디버그 정보 표시 */}
          <details className="text-left mb-3">
            <summary className="text-xs text-gray-500 cursor-pointer">디버그 정보</summary>
            <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
              {debugInfo}
            </pre>
          </details>
          
          <div className="space-y-2">
            <button 
              onClick={() => {
                setError('');
                setIsLoading(true);
                setDebugInfo('');
              }} 
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 mr-2"
            >
              다시 시도
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div 
        className={cn("w-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg", className)}
        style={{ height: height || '400px' }}
      >
        <div className="text-center max-w-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-700 font-medium">카카오 지도 로딩 중...</p>
          <p className="text-blue-600 text-sm">API 키 확인 및 지도 초기화 중...</p>
          
          {/* 디버그 정보 표시 */}
          {debugInfo && (
            <details className="text-left mt-3">
              <summary className="text-xs text-blue-500 cursor-pointer">진행 상황</summary>
              <pre className="text-xs text-blue-400 mt-1 whitespace-pre-wrap bg-blue-100 p-2 rounded max-h-32 overflow-y-auto">
                {debugInfo}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={mapRef} 
      className={cn("w-full rounded-lg border", className)}
      style={{ height: height || '400px', minHeight: height || '400px' }}
    />
  )
} 