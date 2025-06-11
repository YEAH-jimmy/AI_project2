import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { AccommodationInfo } from '../kakao-map'

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
  // 여행지까지 가는 교통수단
  destinationTransport?: 'airplane' | 'ktx' | 'train' | 'bus' | 'car' | 'other'
  // 도시 내 이동수단
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
  
  // Recommended accommodations
  recommendedAccommodations?: AccommodationInfo[]
  
  // Loading states
  isGenerating: boolean
  isLoadingAccommodations: boolean
  
  // Actions
  setCurrentStep: (step: number) => void
  updatePlanData: (data: Partial<TravelPlanData>) => void
  resetPlanData: () => void
  setGeneratedItinerary: (itinerary: GeneratedItinerary) => void
  setIsGenerating: (loading: boolean) => void
  setRecommendedAccommodations: (accommodations: AccommodationInfo[]) => void
  setIsLoadingAccommodations: (loading: boolean) => void
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
        isLoadingAccommodations: false,
        
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
        
        resetPlanData: () => {
          console.log('🔄 여행 계획 데이터 완전 초기화')
          set({ 
            planData: { ...initialPlanData }, 
            currentStep: 1,
            generatedItinerary: undefined,
            isGenerating: false,
            recommendedAccommodations: undefined,
            isLoadingAccommodations: false
          })
          
          // 로컬 스토리지도 클리어하여 완전 초기화
          try {
            localStorage.removeItem('travel-planner-storage')
          } catch (error) {
            console.warn('로컬 스토리지 클리어 실패:', error)
          }
        },
        
        setGeneratedItinerary: (itinerary) => 
          set({ generatedItinerary: itinerary }),
        
        setIsGenerating: (loading) => 
          set({ isGenerating: loading }),
        
        setRecommendedAccommodations: (accommodations) =>
          set({ recommendedAccommodations: accommodations }),
        
        setIsLoadingAccommodations: (loading) =>
          set({ isLoadingAccommodations: loading }),
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