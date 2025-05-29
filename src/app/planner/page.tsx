'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { TravelPlannerWizard } from '@/features/travel-planner/components/TravelPlannerWizard'
import { ProgressIndicator } from '@/features/travel-planner/components/ProgressIndicator'
import { Card } from '@/components/ui/card'
import { MapPin, ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function TravelPlannerPage() {
  const { currentStep } = useTravelPlannerStore()
  
  // 페이지 진입시 스크롤을 상단으로 이동
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
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
      
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            AI 여행 플래너
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            단계별로 정보를 입력하시면 AI가 맞춤형 여행 일정을 생성해드립니다.
            정보를 상세히 입력할수록 더 정확한 일정이 만들어집니다.
          </p>
        </div>
        
        <Card className="border border-gray-200 shadow-lg rounded-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <ProgressIndicator />
            <div className="mt-8">
              <TravelPlannerWizard />
            </div>
          </div>
        </Card>
        
        {/* 도움말 */}
        {currentStep < 9 && (
          <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-800 mb-2">도움말</h3>
            <p className="text-sm text-blue-700">
              • 언제든지 이전 단계로 돌아가 정보를 수정할 수 있습니다.<br />
              • 모든 정보는 저장되며, 페이지를 나갔다가 돌아와도 이어서 작성할 수 있습니다.<br />
              • 최종 일정이 마음에 들지 않으면 정보를 수정하고 다시 생성할 수 있습니다.
            </p>
          </div>
        )}
      </div>
      
      {/* 푸터 */}
      <footer className="mt-auto py-6 border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2024 여행 플래너 | 카카오맵 API 기반</p>
        </div>
      </footer>
    </div>
  )
} 