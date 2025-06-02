'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { DateSelectionStep } from './steps/DateSelectionStep'
import { DestinationStep } from './steps/DestinationStep'
import { AccommodationStep } from './steps/AccommodationStep'
import { TransportStep } from './steps/TransportStep'
import { TravelersStep } from './steps/TravelersStep'
import { InterestsStep } from './steps/InterestsStep'
import { MustVisitStep } from './steps/MustVisitStep'
import { BudgetStep } from './steps/BudgetStep'
import { ResultStep } from './steps/ResultStep'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export function TravelPlannerWizard() {
  const { currentStep, setCurrentStep } = useTravelPlannerStore()
  const [loading, setLoading] = useState(false)
  
  // 단계 변경 디버깅
  useEffect(() => {
    console.log(`Current step: ${currentStep}`)
  }, [currentStep])

  // 컴포넌트 전환 시 로딩 효과
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [currentStep])

  const handleReset = () => {
    if (window.confirm('모든 입력 정보가 초기화됩니다. 계속하시겠습니까?')) {
      setCurrentStep(1)
    }
  }

  // 현재 단계에 맞는 컴포넌트 렌더링
  const renderStepComponent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )
    }

    switch (currentStep) {
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
        return <BudgetStep />
      case 9:
        return <ResultStep />
      default:
        return <DateSelectionStep />
    }
  }
  
  return (
    <div>
      {renderStepComponent()}
      
      {currentStep > 1 && currentStep < 9 && (
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