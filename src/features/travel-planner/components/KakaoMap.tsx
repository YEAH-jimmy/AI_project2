'use client'

import { useEffect, useRef, useState } from 'react'
import { loadKakaoMapScript } from '@/lib/kakao-map'

interface MapLocation {
  lat: number
  lng: number
  name: string
  description?: string
}

interface KakaoMapProps {
  center?: { lat: number; lng: number }
  markers?: MapLocation[]
  width?: string
  height?: string
  level?: number
  className?: string
}

export function KakaoMap({ 
  center = { lat: 37.5665, lng: 126.9780 }, // 서울 시청 기본값
  markers = [],
  width = "100%",
  height = "400px",
  level = 3,
  className = ""
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string>('')

  // 카카오 지도 초기화
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('카카오 지도 초기화 시작');
        await loadKakaoMapScript()
        
        if (!mapRef.current) {
          console.log('mapRef.current가 없음');
          return;
        }

        console.log('지도 인스턴스 생성 중...');
        const options = {
          center: new window.kakao.maps.LatLng(center.lat, center.lng),
          level: level
        }

        mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options)
        console.log('지도 인스턴스 생성 완료');
        setIsLoaded(true)
      } catch (err) {
        console.error('카카오 지도 초기화 실패:', err)
        setError('지도를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.')
      }
    }

    initMap()
  }, [center.lat, center.lng, level])

  // 마커 업데이트
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // 새 마커 추가
    markers.forEach((location, index) => {
      const markerPosition = new window.kakao.maps.LatLng(location.lat, location.lng)
      
      const marker = new window.kakao.maps.Marker({
        position: markerPosition,
        title: location.name
      })

      marker.setMap(mapInstanceRef.current)
      markersRef.current.push(marker)

      // 인포윈도우 생성
      if (location.description) {
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 150px;">
              <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${location.name}</h4>
              <p style="margin: 0; font-size: 12px; color: #666;">${location.description}</p>
            </div>
          `
        })

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          infoWindow.open(mapInstanceRef.current, marker)
        })
      }
    })

    // 마커가 있으면 모든 마커가 보이도록 지도 범위 조정
    if (markers.length > 1) {
      const bounds = new window.kakao.maps.LatLngBounds()
      markers.forEach(location => {
        bounds.extend(new window.kakao.maps.LatLng(location.lat, location.lng))
      })
      mapInstanceRef.current.setBounds(bounds)
    } else if (markers.length === 1) {
      // 마커가 하나면 해당 위치로 이동
      const moveLatLon = new window.kakao.maps.LatLng(markers[0].lat, markers[0].lng)
      mapInstanceRef.current.setCenter(moveLatLon)
    }
  }, [isLoaded, markers])

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-red-50 border border-red-300 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-red-600 p-4">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            ❌
          </div>
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-2 text-red-500">
            지도 서비스에 일시적인 문제가 있습니다.
          </p>
          <button 
            onClick={() => {
              setError('')
              setIsLoaded(false)
              // 페이지 새로고침으로 재시도
              window.location.reload()
            }}
            className="mt-3 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ width, height }}
        className="rounded-lg overflow-hidden border border-gray-200"
      />
      {!isLoaded && (
        <div 
          className="flex items-center justify-center bg-blue-50 border border-blue-300 rounded-lg absolute inset-0"
          style={{ width, height }}
        >
          <div className="text-center text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm font-medium">카카오 지도 로딩 중...</p>
            <p className="text-xs mt-1 text-blue-500">{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</p>
          </div>
        </div>
      )}
    </div>
  )
} 