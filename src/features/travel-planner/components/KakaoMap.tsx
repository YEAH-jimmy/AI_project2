'use client'

import { useEffect, useRef, useState } from 'react'
import { loadKakaoMapScript } from '@/lib/kakao-map'
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
  className?: string
}

export function KakaoMap({ center, markers, zoom = 13, className = "" }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // 카카오맵 초기화
    const initializeMap = () => {
      try {
        const options = {
          center: new (window as any).kakao.maps.LatLng(center.lat, center.lng),
          level: zoom
        }
        
        const map = new (window as any).kakao.maps.Map(mapRef.current!, options)
        mapInstanceRef.current = map

        // 마커 추가
        markers.forEach((marker, index) => {
          const markerPosition = new (window as any).kakao.maps.LatLng(marker.lat, marker.lng)
          
          // 순서가 있는 마커의 경우 커스텀 이미지 사용
          let markerImage;
          if (marker.order && marker.day) {
            // 날짜별 색상 구분
            const dayColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
            const color = dayColors[(marker.day - 1) % dayColors.length];
            
            // 숫자가 포함된 마커 아이콘 생성 (실제로는 이미지나 CSS로 구현)
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
          }
          
          const kakaoMarker = new (window as any).kakao.maps.Marker({
            position: markerPosition,
            image: markerImage
          })

          kakaoMarker.setMap(map)

          // 인포윈도우 생성
          const infoWindow = new (window as any).kakao.maps.InfoWindow({
            content: `
              <div style="padding: 10px; min-width: 200px;">
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
      } catch (error) {
        console.error('카카오맵 초기화 오류:', error)
      }
    }

    // 카카오맵 API 로드 확인
    if ((window as any).kakao && (window as any).kakao.maps) {
      ;(window as any).kakao.maps.load(initializeMap)
    } else {
      // 스크립트 로딩이 완료되지 않은 경우 재시도
      const checkKakao = setInterval(() => {
        if ((window as any).kakao && (window as any).kakao.maps) {
          clearInterval(checkKakao)
          ;(window as any).kakao.maps.load(initializeMap)
        }
      }, 100)
      
      // 10초 후 타임아웃
      setTimeout(() => clearInterval(checkKakao), 10000)
    }
  }, [center, markers, zoom])

  return (
    <div 
      ref={mapRef} 
      className={cn("w-full h-full rounded-lg", className)}
      style={{ minHeight: '400px' }}
    />
  )
} 