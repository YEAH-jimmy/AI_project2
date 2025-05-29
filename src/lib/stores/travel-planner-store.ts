import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface TravelPlanData {
  // 1단계: 날짜 선택
  startDate?: Date
  endDate?: Date
  
  // 2단계: 여행지 선택
  destination?: string
  destinationPlaceId?: string
  destinationCoordinates?: {
    lat: number
    lng: number
  }
  
  // 3단계: 숙소 정보
  accommodationLocation?: {
    address: string
    lat: number
    lng: number
  }
  accommodationType?: 'hotel' | 'airbnb' | 'guesthouse' | 'resort' | 'other'
  
  // 4단계: 이동 수단
  intercityTransport?: 'ktx' | 'bus' | 'car' | 'airplane' | 'other'
  localTransport?: 'public' | 'walk' | 'bicycle' | 'rental-car' | 'other'
  
  // 5단계: 인원 및 연령
  travelers: number
  ageGroups: string[]
  
  // 6단계: 관심사
  interests: string[]
  
  // 7단계: 필수 방문 장소
  mustVisitPlaces: Array<{
    name: string
    placeId?: string
    address?: string
    lat?: number
    lng?: number
  }>
  
  // 8단계: 예산
  budget?: number
  budgetCurrency?: 'KRW' | 'USD'
}

export interface GeneratedItinerary {
  id: string
  title: string
  days: Array<{
    date: Date
    activities: Array<{
      time: string
      title: string
      description: string
      location: {
        name: string
        address: string
        lat: number
        lng: number
      }
      duration: number // in minutes
      cost?: number
      type: 'attraction' | 'restaurant' | 'accommodation' | 'transport' | 'activity'
    }>
  }>
  totalCost?: number
  weatherInfo?: any
  generatedAt: Date
  // 카카오맵 관련 정보
  mapInfo?: {
    center: { lat: number; lng: number }
    markers: Array<{
      lat: number
      lng: number
      name: string
      description?: string
    }>
    optimizedRoute?: Array<{
      lat: number
      lng: number
      name: string
    }>
  }
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

export const useTravelPlannerStore = create<TravelPlannerState>()(
  devtools(
    persist(
      (set, get) => ({
        currentStep: 1,
        planData: initialPlanData,
        isGenerating: false,
        
        setCurrentStep: (step) => set({ currentStep: step }),
        
        updatePlanData: (data) => 
          set((state) => ({
            planData: { ...state.planData, ...data }
          })),
        
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
      }
    ),
    {
      name: 'travel-planner-store',
    }
  )
) 