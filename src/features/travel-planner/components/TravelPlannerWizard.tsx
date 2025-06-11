'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { DateSelectionStep } from './steps/DateSelectionStep'
import { DestinationStep } from './steps/DestinationStep'
import { AccommodationStep } from './steps/AccommodationStep'
import { TransportStep } from './steps/TransportStep'
import { TravelersStep } from './steps/TravelersStep'
import { InterestsStep } from './steps/InterestsStep'
import { MustVisitStep } from './steps/MustVisitStep'
import { ResultStep } from './steps/ResultStep'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export function TravelPlannerWizard() {
  const { currentStep, setCurrentStep, resetPlanData, updatePlanData } = useTravelPlannerStore()
  const [loading, setLoading] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const searchParams = useSearchParams()
  
  // hydration 완료 후에만 실제 상태 표시
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // URL 파라미터로 추천 여행지가 전달된 경우 처리
  useEffect(() => {
    if (isHydrated) {
      const destination = searchParams.get('destination')
      const reset = searchParams.get('reset')
      
      if (reset === 'true') {
        console.log('🔄 완전히 새로 시작')
        resetPlanData()
        // URL 파라미터 제거
        window.history.replaceState({}, '', '/planner')
      } else if (destination) {
        console.log(`🎯 추천 여행지 선택됨: ${destination}`)
        // 상태를 완전히 초기화한 후 여행지 설정
        resetPlanData()
        // 약간의 딜레이 후 여행지 설정 (초기화가 완료된 후)
        setTimeout(() => {
          updatePlanData({ destination })
          setCurrentStep(2) // 여행지 선택 단계로 이동
          // URL에서 destination 파라미터 제거
          window.history.replaceState({}, '', '/planner')
        }, 100)
      }
    }
  }, [isHydrated, searchParams, resetPlanData, updatePlanData, setCurrentStep])
  
  // hydration이 완료되지 않았으면 첫 번째 단계로 표시
  const displayStep = isHydrated ? currentStep : 1
  
  // 단계 변경 디버깅
  useEffect(() => {
    if (isHydrated) {
      console.log(`🎯 Current step: ${displayStep}`)
      console.log(`🗺️ KakaoMap will render in step 8-9 (ResultStep)`)
    }
  }, [displayStep, isHydrated])

  // 컴포넌트 전환 시 로딩 효과
  useEffect(() => {
    if (isHydrated) {
      setLoading(true)
      const timer = setTimeout(() => {
        setLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [displayStep, isHydrated])

  const handleReset = () => {
    if (window.confirm('모든 입력 정보가 초기화됩니다. 계속하시겠습니까?')) {
      resetPlanData()
      setCurrentStep(1)
      // URL 파라미터도 제거
      window.history.replaceState({}, '', '/planner')
    }
  }

  // 현재 단계에 맞는 컴포넌트 렌더링
  const renderStepComponent = () => {
    if (!isHydrated || loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )
    }

    switch (displayStep) {
      case 1:
        return <DateSelectionStep />
      case 2:
        return <DestinationStep />
      case 3:
        return <AccommodationStep />
      case 4:
        return <TransportStep />
      case 5:
        return <TravelersStep />
      case 6:
        return <InterestsStep />
      case 7:
        return <MustVisitStep />
      case 8:
      case 9:
        return <ResultStep />
      default:
        return <DateSelectionStep />
    }
  }
  
  return (
    <div>
      {renderStepComponent()}
      
      {isHydrated && displayStep > 1 && displayStep < 8 && (
        <div className="mt-8 text-center">
          <Button 
            variant="link" 
            onClick={handleReset}
            className="text-gray-500 text-sm"
          >
            처음부터 다시 시작하기
          </Button>
        </div>
      )}
    </div>
  )
} 