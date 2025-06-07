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
    if (!mapRef.current) return;

    console.log('카카오맵 초기화 시작', { center, markers: markers.length });

    // 디버그 정보 업데이트
    const updateDebugInfo = (info: string) => {
      console.log(info);
      setDebugInfo(prev => prev + '\n' + info);
    };

    updateDebugInfo('지도 초기화 시작...');

    // layout.tsx에서 이미 스크립트를 로드했으므로, 단순히 준비될 때까지 기다림
    const waitForKakaoMaps = (attempts = 0) => {
      const maxAttempts = 150; // 30초 (200ms * 150회)
      
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
        updateDebugInfo('카카오맵 SDK 준비 완료, 지도 초기화 시작');
        initializeMap();
      } else if (attempts < maxAttempts) {
        updateDebugInfo(`카카오맵 SDK 대기 중... (${Math.round((attempts + 1) * 0.2)}초/30초)`);
        setTimeout(() => waitForKakaoMaps(attempts + 1), 200);
      } else {
        const timeoutMsg = `카카오맵 SDK 로딩 타임아웃 (30초 경과)
        
가능한 원인:
1. API 키 오류 (현재 키: b96ce35e1cd6d37f165e9b54ebc06ae8)
2. 도메인 등록 필요 (localhost:3000)
3. 네트워크 연결 문제
4. 카카오 서버 문제

해결 방법:
- 브라우저 개발자 도구(F12)에서 콘솔 오류 확인
- 카카오 개발자 콘솔에서 API 키와 도메인 설정 확인
- 페이지 새로고침 시도`;
        setError(timeoutMsg);
        updateDebugInfo('타임아웃: ' + timeoutMsg);
        setIsLoading(false);
      }
    };

    // 지도 초기화 함수
    const initializeMap = () => {
      try {
        updateDebugInfo('카카오맵 SDK 발견, 지도 생성 시작');

        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: level || zoom
        }
        
        updateDebugInfo(`지도 생성 중... 중심점: ${center.lat}, ${center.lng}, 레벨: ${options.level}`);

        // 지도 컨테이너 크기 확인
        updateDebugInfo(`지도 컨테이너 크기: ${mapRef.current?.offsetWidth}x${mapRef.current?.offsetHeight}`);
        
        const map = new window.kakao.maps.Map(mapRef.current!, options);
        mapInstanceRef.current = map;
        updateDebugInfo('지도 생성 완료');

        // 마커 추가
        updateDebugInfo(`마커 추가 시작: ${markers.length}개`);
        markers.forEach((marker, index) => {
          const markerPosition = new window.kakao.maps.LatLng(marker.lat, marker.lng);
          
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
              `)}`;
              
              markerImage = new window.kakao.maps.MarkerImage(
                imageSrc,
                new window.kakao.maps.Size(30, 40),
                { offset: new window.kakao.maps.Point(15, 40) }
              );
            } catch (imgError) {
              console.warn('커스텀 마커 이미지 생성 실패, 기본 마커 사용:', imgError);
              markerImage = null;
            }
          }
          
          const kakaoMarker = new window.kakao.maps.Marker({
            position: markerPosition,
            image: markerImage,
            title: marker.name
          });

          kakaoMarker.setMap(map);

          // 인포윈도우 생성
          const infoWindow = new window.kakao.maps.InfoWindow({
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
          });

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(kakaoMarker, 'click', () => {
            infoWindow.open(map, kakaoMarker);
          });
        });

        // 마커들이 모두 보이도록 지도 범위 조정
        if (markers.length > 1) {
          const bounds = new window.kakao.maps.LatLngBounds();
          markers.forEach(marker => {
            bounds.extend(new window.kakao.maps.LatLng(marker.lat, marker.lng));
          });
          map.setBounds(bounds);
        }

        updateDebugInfo('지도 초기화 완료!');
        setIsLoading(false);
        setError('');
      } catch (mapError) {
        console.error('지도 생성 오류:', mapError);
        const errorMsg = '지도를 생성하는 중 오류가 발생했습니다: ' + (mapError as Error).message;
        setError(errorMsg);
        updateDebugInfo('지도 생성 오류: ' + errorMsg);
        setIsLoading(false);
      }
    };

    // 카카오맵 SDK 대기 시작
    waitForKakaoMaps();

    // cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [center, markers, zoom, level]);

  if (error) {
    return (
      <div 
        className={cn("w-full flex items-center justify-center bg-red-50 border border-red-200 rounded-lg", className)}
        style={{ height: height || '400px' }}
      >
        <div className="text-center p-4 max-w-lg">
          <div className="text-red-500 mb-3 text-2xl">🚫</div>
          <h3 className="text-red-700 font-bold text-lg mb-2">지도 로딩 실패</h3>
          <div className="text-red-600 text-sm mb-4 bg-red-100 p-3 rounded-lg text-left">
            <pre className="whitespace-pre-wrap font-sans">{error}</pre>
          </div>
          
          {/* 해결 방법 가이드 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
            <h4 className="font-medium text-yellow-800 mb-2">🔧 문제 해결 방법:</h4>
            <ol className="text-xs text-yellow-700 space-y-1 list-decimal list-inside">
              <li>브라우저 개발자 도구(F12)를 열어 콘솔 에러 확인</li>
              <li>카카오 개발자 콘솔에서 API 키와 도메인 설정 확인</li>
              <li>네트워크 연결 상태 확인</li>
              <li>브라우저 새로고침 또는 캐시 삭제</li>
            </ol>
          </div>
          
          {/* 디버그 정보 표시 */}
          <details className="text-left mb-3">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
              🔍 기술적 정보 보기 (개발자용)
            </summary>
            <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap bg-gray-100 p-3 rounded max-h-40 overflow-y-auto border">
              {debugInfo || '디버그 정보 없음'}
            </pre>
          </details>
          
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={cn("w-full flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg", className)}
        style={{ height: height || '400px' }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600">지도를 불러오는 중...</p>
          {debugInfo && (
            <details className="text-left mt-3 max-w-md">
              <summary className="text-xs text-gray-500 cursor-pointer">로딩 진행 상황 보기</summary>
              <pre className="text-xs text-gray-400 mt-1 whitespace-pre-wrap bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {debugInfo}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn("w-full rounded-lg overflow-hidden border border-gray-200", className)}
      style={{ height: height || '400px' }}
    />
  );
} 