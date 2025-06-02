'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { TravelPlannerWizard } from '@/features/travel-planner/components/TravelPlannerWizard'
import { ProgressIndicator } from '@/features/travel-planner/components/ProgressIndicator'
import { Card } from '@/components/ui/card'
import { MapPin, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function TravelPlannerPage() {
  const { currentStep } = useTravelPlannerStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true)
  
  // 페이지 진입시 스크롤을 상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Zustand persist hydration 처리
  useEffect(() => {
    useTravelPlannerStore.persist.rehydrate()
  }, [])
  
  // hydration 완료 후에만 실제 상태 표시
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  // hydration이 완료되지 않았으면 첫 번째 단계로 표시
  const displayStep = isHydrated ? currentStep : 1
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <MapPin className="h-6 w-6 text-blue-600" />
                <span className="ml-2 font-bold text-xl text-gray-900">여행 플래너</span>
              </Link>
            </div>
            <div>
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  <span>홈으로</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* 메인 컨텐츠 - 결과 단계에서는 전체 화면 활용 */}
      <div className={`mx-auto px-4 py-8 sm:px-6 lg:px-8 ${
        displayStep === 9 ? 'max-w-none' : 'max-w-6xl'
      }`}>
        {displayStep === 9 ? (
          // 결과 단계: 전체 화면 활용
          <div className="space-y-6">
            <TravelPlannerWizard />
          </div>
        ) : (
          // 일반 단계: 카드 형태
          <>
            <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden">
              <div className="p-6 md:p-8">
                {displayStep < 9 && <ProgressIndicator />}
                <div className="mt-8">
                  <TravelPlannerWizard />
                </div>
              </div>
            </Card>
            
            {/* 도움말 */}
            {displayStep < 9 && (
              <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-2">도움말</h3>
                <p className="text-sm text-blue-700">
                  • 언제든지 이전 단계로 돌아가 정보를 수정할 수 있습니다.<br />
                  • 모든 정보는 저장되며, 페이지를 나갔다가 돌아와도 이어서 작성할 수 있습니다.<br />
                  • 최종 일정이 마음에 들지 않으면 정보를 수정하고 다시 생성할 수 있습니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 푸터 */}
      <footer className="mt-auto py-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 여행 플래너 | 카카오맵 API 기반</p>
        </div>
      </footer>
    </div>
  )
} 