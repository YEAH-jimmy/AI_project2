'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Train, Bus, Plane, ArrowRight, ArrowLeft, MapPin } from 'lucide-react'

const transportSchema = z.object({
  intercityTransport: z.enum(['airplane', 'train', 'bus', 'car']),
  localTransport: z.enum(['public', 'walk', 'bicycle', 'rental-car', 'other']),
})

type TransportFormData = z.infer<typeof transportSchema>

const intercityOptions = [
  { value: 'airplane', label: '비행기', description: '공항에서 출발/도착', icon: Plane },
  { value: 'train', label: '기차(KTX)', description: '역에서 출발/도착', icon: Train },
  { value: 'bus', label: '시외버스', description: '터미널에서 출발/도착', icon: Bus },
  { value: 'car', label: '자가용', description: '직접 운전해서 이동', icon: Car },
]

const localOptions = [
  { value: 'public', label: '대중교통', description: '지하철, 버스 등', icon: Bus },
  { value: 'walk', label: '도보', description: '걸어서 관광', icon: MapPin },
  { value: 'bicycle', label: '자전거', description: '자전거 투어', icon: Car },
  { value: 'rental-car', label: '렌트카', description: '현지 렌트카', icon: Car },
  { value: 'other', label: '기타', description: '택시, 오토바이 등', icon: Train },
]

export function TransportStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  
  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isValid }
  } = useForm<TransportFormData>({
    resolver: zodResolver(transportSchema),
    mode: 'onChange',
    defaultValues: {
      intercityTransport: planData.intercityTransport || 'airplane',
      localTransport: planData.localTransport || 'public',
    }
  })

  const intercityValue = watch('intercityTransport')
  const localValue = watch('localTransport')

  const onSubmit = (data: TransportFormData) => {
    updatePlanData({
      intercityTransport: data.intercityTransport,
      localTransport: data.localTransport,
    })
    setCurrentStep(5)
  }

  const handlePrevious = () => {
    setCurrentStep(3)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          교통수단을 선택해주세요
        </h2>
        <p className="text-gray-600">
          목적지까지의 교통수단과 현지 이동수단을 선택하면 최적의 일정을 만들어드려요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>교통수단 선택</CardTitle>
          <CardDescription>
            목적지까지의 교통수단과 현지 이동수단을 선택하면 최적의 일정을 만들어드려요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* 도시 간 교통수단 (목적지까지) */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  목적지까지 교통수단
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  선택한 교통수단에 따라 여행 시작과 끝 지점이 결정됩니다.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {intercityOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue('intercityTransport', option.value as any, { shouldValidate: true })}
                      className={`p-4 text-center border rounded-lg transition-all hover:shadow-md ${
                        intercityValue === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-full ${
                          intercityValue === option.value 
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            {option.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 현지 교통수단 (도시 내) */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  현지 이동수단
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  여행지에서 관광할 때 주로 사용할 교통수단을 선택해주세요.
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {localOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValue('localTransport', option.value as any, { shouldValidate: true })}
                      className={`p-6 text-center border rounded-lg transition-all hover:shadow-md ${
                        localValue === option.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`p-3 rounded-full ${
                          localValue === option.value 
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 mb-1">
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">
                  목적지까지: {intercityOptions.find(o => o.value === intercityValue)?.label}
                </span>
                {' • '}
                <span className="font-semibold text-gray-900">
                  현지 이동: {localOptions.find(o => o.value === localValue)?.label}
                </span>
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                이전 단계
              </Button>
              
              <Button 
                type="submit"
                className="flex items-center gap-2"
              >
                다음 단계
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          처음부터 다시 시작하기
        </Button>
      </div>
    </div>
  )
} 