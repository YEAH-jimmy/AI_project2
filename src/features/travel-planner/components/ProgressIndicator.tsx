'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const steps = [
  { id: 1, title: '날짜 선택', description: '여행 기간 설정' },
  { id: 2, title: '여행지 선택', description: '목적지 선택' },
  { id: 3, title: '숙소 정보', description: '숙박 위치 및 형태' },
  { id: 4, title: '이동 수단', description: '교통편 선택' },
  { id: 5, title: '인원 정보', description: '인원 수 및 연령대' },
  { id: 6, title: '관심사 선택', description: '여행 스타일 설정' },
  { id: 7, title: '필수 장소', description: '꼭 가고 싶은 곳' },
  { id: 8, title: '예산 설정', description: '여행 경비' },
]

export function ProgressIndicator() {
  const { currentStep } = useTravelPlannerStore()

  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    currentStep > step.id
                      ? "bg-green-500 border-green-500 text-white"
                      : currentStep === step.id
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      currentStep >= step.id ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 hidden lg:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 transition-all",
                    currentStep > step.id
                      ? "bg-green-500"
                      : "bg-gray-300"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Progress */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {steps[currentStep - 1]?.title}
          </h3>
          <span className="text-sm text-gray-500">
            {currentStep} / {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {steps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  )
} 