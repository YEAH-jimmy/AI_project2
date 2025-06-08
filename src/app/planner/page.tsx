'use client';

import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TravelPlannerWizard } from '@/features/travel-planner/components/TravelPlannerWizard'
import { ProgressIndicator } from '@/features/travel-planner/components/ProgressIndicator'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'

export default function PlannerPage() {
  const { currentStep } = useTravelPlannerStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 네비게이션 - 전체 화면 너비 활용 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 왼쪽: 뒤로가기 버튼 */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">뒤로</span>
              </Button>
            </div>

            {/* 중앙: 페이지 제목 */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                여행 플래너
              </h1>
            </div>

            {/* 오른쪽: 홈 버튼 */}
            <div className="flex items-center">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">홈으로</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 프로그레스 표시기 */}
      <div className="bg-white border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <ProgressIndicator />
        </div>
      </div>

      {/* 메인 컨텐츠 - 전체 화면 너비 활용 */}
      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-none">
            <TravelPlannerWizard />
          </div>
        </div>
      </main>
    </div>
  )
}
