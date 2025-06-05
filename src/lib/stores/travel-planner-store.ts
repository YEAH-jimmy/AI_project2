import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface TravelPlanData {
  destination?: string
  startDate?: Date
  endDate?: Date
  accommodationType?: 'hotel' | 'airbnb' | 'guesthouse' | 'resort' | 'other'
  accommodationLocation?: {
    address: string
    lat?: number
    lng?: number
  }
  accommodationName?: string
  hasBookedAccommodation?: boolean
  localTransport?: 'public' | 'walk' | 'bicycle' | 'rental-car' | 'other'
  travelers?: number
  ageGroups?: string[]
  ageGroupCounts?: { [key: string]: number }
  interests?: string[]
  mustVisitPlaces?: string[]
  budget?: number
  totalBudget?: number
  budgetCurrency?: 'KRW' | 'USD'
  additionalRequests?: string
}

export interface Attraction {
  name: string
  description: string
  type: string
  lat: number
  lng: number
  address?: string
  rating?: number
  image?: string
  tags?: string[]
  openingHours?: string
  visitDuration?: number // minutes
}

export interface DayPlan {
  date: Date
  attractions: Attraction[]
  meals?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  transport?: string
  notes?: string
}

export interface GeneratedItinerary {
  summary: string
  days: DayPlan[]
  totalDistance?: number
  estimatedCost?: number
}

interface TravelPlannerState {
  // Current step in the wizard
  currentStep: number
  
  // Form data
  planData: TravelPlanData
  
  // Generated itinerary
  generatedItinerary?: GeneratedItinerary
  
  // Loading states
  isGenerating: boolean
  
  // Actions
  setCurrentStep: (step: number) => void
  updatePlanData: (data: Partial<TravelPlanData>) => void
  resetPlanData: () => void
  setGeneratedItinerary: (itinerary: GeneratedItinerary) => void
  setIsGenerating: (loading: boolean) => void
}

const initialPlanData: TravelPlanData = {
  travelers: 1,
  ageGroups: [],
  interests: [],
  mustVisitPlaces: [],
  budgetCurrency: 'KRW'
}

// Date 객체 직렬화/역직렬화 핸들러
const dateReviver = (key: string, value: any) => {
  // startDate와 endDate 속성이고, 날짜 형식 문자열이면 Date 객체로 변환
  const dateKeys = ['startDate', 'endDate'];
  if (dateKeys.includes(key) && typeof value === 'string') {
    return new Date(value);
  }
  return value;
};

export const useTravelPlannerStore = create<TravelPlannerState>()(
  devtools(
    persist(
      (set, get) => ({
        currentStep: 1,
        planData: initialPlanData,
        isGenerating: false,
        
        setCurrentStep: (step) => {
          // 현재 단계를 로깅
          console.log(`Moving to step: ${step} from: ${get().currentStep}`);
          set({ currentStep: step });
        },
        
        updatePlanData: (data) => {
          // 데이터 업데이트를 로깅
          console.log('Updating plan data with:', data);
          set((state) => ({
            planData: { ...state.planData, ...data }
          }));
          // 업데이트 후 상태 로깅
          console.log('Updated plan data:', get().planData);
        },
        
        resetPlanData: () => 
          set({ 
            planData: initialPlanData, 
            currentStep: 1,
            generatedItinerary: undefined
          }),
        
        setGeneratedItinerary: (itinerary) => 
          set({ generatedItinerary: itinerary }),
        
        setIsGenerating: (loading) => 
          set({ isGenerating: loading }),
      }),
      {
        name: 'travel-planner-storage',
        // 저장 시 Date 객체 처리
        serialize: (state) => {
          return JSON.stringify(state);
        },
        // 로딩 시 Date 객체 복원
        deserialize: (str) => {
          return JSON.parse(str, dateReviver);
        },
      }
    ),
    {
      name: 'travel-planner-store',
    }
  )
) 