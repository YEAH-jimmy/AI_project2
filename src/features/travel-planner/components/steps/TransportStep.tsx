'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Train, Bus, Plane, ArrowRight, ArrowLeft } from 'lucide-react'

const transportSchema = z.object({
  intercityTransport: z.enum(['ktx', 'bus', 'car', 'airplane', 'other']),
  localTransport: z.enum(['public', 'walk', 'bicycle', 'rental-car', 'other']),
})

type TransportFormData = z.infer<typeof transportSchema>

const intercityOptions = [
  { value: 'ktx', label: 'KTX/기차', icon: Train, description: '빠르고 편안한 이동' },
  { value: 'bus', label: '고속버스', icon: Bus, description: '경제적인 선택' },
  { value: 'car', label: '자가용', icon: Car, description: '자유로운 여행' },
  { value: 'airplane', label: '항공기', icon: Plane, description: '장거리 빠른 이동' },
  { value: 'other', label: '기타', icon: Car, description: '기타 교통수단' },
]

const localOptions = [
  { value: 'public', label: '대중교통', description: '지하철, 버스 등' },
  { value: 'walk', label: '도보', description: '걸어서 관광' },
  { value: 'bicycle', label: '자전거', description: '자전거 투어' },
  { value: 'rental-car', label: '렌트카', description: '현지 렌트카' },
  { value: 'other', label: '기타', description: '택시, 오토바이 등' },
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
      intercityTransport: planData.intercityTransport || 'ktx',
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
          어떤 교통수단을 이용하실 건가요?
        </h2>
        <p className="text-gray-600">
          이동 수단에 따라 일정과 경로가 최적화됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 도시간 이동 수단 */}
        <Card>
          <CardHeader>
            <CardTitle>도시간 이동 수단</CardTitle>
            <CardDescription>
              목적지까지 가는 주요 교통수단을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {intercityOptions.map((option) => {
                const Icon = option.icon
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
                    <Icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium text-sm text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {option.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* 현지 이동 수단 */}
        <Card>
          <CardHeader>
            <CardTitle>현지 이동 수단</CardTitle>
            <CardDescription>
              여행지에서 관광할 때 주로 사용할 교통수단을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {localOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('localTransport', option.value as any, { shouldValidate: true })}
                  className={`p-4 text-center border rounded-lg transition-all hover:shadow-md ${
                    localValue === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            선택한 교통수단: <span className="font-semibold">
              {intercityOptions.find(o => o.value === intercityValue)?.label} → {localOptions.find(o => o.value === localValue)?.label}
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
    </div>
  )
} 