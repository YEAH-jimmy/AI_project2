'use client'

import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { match } from 'ts-pattern'
import { DateSelectionStep } from './steps/DateSelectionStep'
import { DestinationStep } from './steps/DestinationStep'
import { AccommodationStep } from './steps/AccommodationStep'
import { TransportStep } from './steps/TransportStep'
import { TravelersStep } from './steps/TravelersStep'
import { InterestsStep } from './steps/InterestsStep'
import { MustVisitStep } from './steps/MustVisitStep'
import { BudgetStep } from './steps/BudgetStep'
import { ResultStep } from './steps/ResultStep'

export function TravelPlannerWizard() {
  const { currentStep } = useTravelPlannerStore()

  return (
    <div className="w-full">
      {match(currentStep)
        .with(1, () => <DateSelectionStep />)
        .with(2, () => <DestinationStep />)
        .with(3, () => <AccommodationStep />)
        .with(4, () => <TransportStep />)
        .with(5, () => <TravelersStep />)
        .with(6, () => <InterestsStep />)
        .with(7, () => <MustVisitStep />)
        .with(8, () => <BudgetStep />)
        .with(9, () => <ResultStep />)
        .otherwise(() => <DateSelectionStep />)
      }
    </div>
  )
} 