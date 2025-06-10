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
  destinationTransport: z.enum(['airplane', 'ktx', 'train', 'bus', 'car', 'other']),
  localTransport: z.enum(['public', 'walk', 'bicycle', 'rental-car', 'other']),
})

type TransportFormData = z.infer<typeof transportSchema>

const destinationOptions = [
  { value: 'airplane', label: '비행기', description: '국내/국제선 항공편', icon: Plane },
  { value: 'ktx', label: 'KTX', description: '고속철도', icon: Train },
  { value: 'train', label: '일반열차', description: '무궁화호, 새마을호', icon: Train },
  { value: 'bus', label: '시외버스', description: '고속/시외버스', icon: Bus },
  { value: 'car', label: '자가용', description: '개인 차량', icon: Car },
  { value: 'other', label: '기타', description: '선박, 기타 교통편', icon: Car },
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
      destinationTransport: planData.destinationTransport || 'airplane',
      localTransport: planData.localTransport || 'public',
    }
  })

  const destinationValue = watch('destinationTransport')
  const localValue = watch('localTransport')

  const onSubmit = (data: TransportFormData) => {
    updatePlanData({
      destinationTransport: data.destinationTransport,
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
          여행지까지 가는 교통편과 현지 이동수단에 따라 일정이 최적화됩니다.
        </p>
      </div>

      <div className="space-y-6">
        {/* 여행지까지 가는 교통수단 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              여행지까지 가는 교통수단
            </CardTitle>
            <CardDescription>
              출발지에서 {planData.destination || '여행지'}까지 어떻게 이동하시나요?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {destinationOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('destinationTransport', option.value as any, { shouldValidate: true })}
                    className={`p-4 text-center border rounded-lg transition-all hover:shadow-md ${
                      destinationValue === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`p-2 rounded-full ${
                        destinationValue === option.value 
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
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
          </CardContent>
        </Card>

        {/* 현지 이동수단 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              현지 이동수단
            </CardTitle>
            <CardDescription>
              {planData.destination || '여행지'}에서 관광할 때 주로 사용할 교통수단을 선택해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {localOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
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
                      <div className="flex flex-col items-center space-y-2">
                        <div className={`p-2 rounded-full ${
                          localValue === option.value 
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">
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

              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-900">선택한 교통수단</span>
                </p>
                <div className="space-y-1">
                  <p className="text-sm">
                    🚁 여행지까지: <span className="font-medium text-blue-700">
                      {destinationOptions.find(o => o.value === destinationValue)?.label}
                    </span>
                  </p>
                  <p className="text-sm">
                    🏙️ 현지 이동: <span className="font-medium text-green-700">
                      {localOptions.find(o => o.value === localValue)?.label}
                    </span>
                  </p>
                </div>
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
      </div>

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