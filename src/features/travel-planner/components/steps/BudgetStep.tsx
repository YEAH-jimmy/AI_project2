'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, ArrowRight, ArrowLeft, DollarSign, Sparkles } from 'lucide-react'

const budgetSchema = z.object({
  budget: z.number().optional(),
  budgetCurrency: z.enum(['KRW', 'USD']),
})

type BudgetFormData = z.infer<typeof budgetSchema>

const budgetRanges = [
  { min: 0, max: 100000, label: '10만원 이하', description: '가성비 여행' },
  { min: 100000, max: 300000, label: '10-30만원', description: '알찬 여행' },
  { min: 300000, max: 500000, label: '30-50만원', description: '여유로운 여행' },
  { min: 500000, max: 1000000, label: '50-100만원', description: '프리미엄 여행' },
  { min: 1000000, max: 999999999, label: '100만원 이상', description: '럭셔리 여행' },
]

export function BudgetStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [selectedRange, setSelectedRange] = useState<string>('')
  const [customBudget, setCustomBudget] = useState<string>(
    planData.budget ? planData.budget.toString() : ''
  )
  
  const {
    handleSubmit,
    setValue,
    watch,
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    mode: 'onChange',
    defaultValues: {
      budget: planData.budget,
      budgetCurrency: planData.budgetCurrency || 'KRW',
    }
  })

  const currencyValue = watch('budgetCurrency')

  const handleRangeSelect = (range: typeof budgetRanges[0]) => {
    const avgBudget = Math.floor((range.min + range.max) / 2)
    setSelectedRange(range.label)
    setCustomBudget(avgBudget.toString())
    setValue('budget', avgBudget)
  }

  const handleCustomBudgetChange = (value: string) => {
    setCustomBudget(value)
    setSelectedRange('')
    const numValue = parseInt(value.replace(/,/g, ''))
    if (!isNaN(numValue)) {
      setValue('budget', numValue)
    }
  }

  const formatCurrency = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '')
    return numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleNext = () => {
    const budget = customBudget ? parseInt(customBudget.replace(/,/g, '')) : undefined
    
    updatePlanData({
      budget,
      budgetCurrency: currencyValue,
    })
    setCurrentStep(9) // 결과 페이지로
  }

  const handlePrevious = () => {
    setCurrentStep(7)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          여행 예산을 알려주세요
        </h2>
        <p className="text-gray-600">
          예산에 맞는 최적의 일정과 장소를 추천해드려요. (선택사항)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            여행 예산 설정
          </CardTitle>
          <CardDescription>
            1인 기준 총 여행 경비를 입력해주세요. 숙박, 교통, 식사, 관광이 모두 포함됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>예산 범위 선택</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {budgetRanges.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => handleRangeSelect(range)}
                  className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                    selectedRange === range.label
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {range.label}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {range.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customBudget">직접 입력</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  id="customBudget"
                  placeholder="예: 250,000"
                  value={formatCurrency(customBudget)}
                  onChange={(e) => handleCustomBudgetChange(e.target.value)}
                />
                <span className="absolute right-3 top-3 text-sm text-gray-500">
                  {currencyValue === 'KRW' ? '원' : '$'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setValue('budgetCurrency', currencyValue === 'KRW' ? 'USD' : 'KRW')}
                className="px-4"
              >
                {currencyValue === 'KRW' ? 'KRW' : 'USD'}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              예산을 입력하지 않으면 일반적인 가격대의 장소들을 추천합니다
            </p>
          </div>

          {customBudget && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold">
                  설정된 예산: {formatCurrency(customBudget)} {currencyValue === 'KRW' ? '원' : '$'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          예산 기반 최적화
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>숙소 추천</strong>: 예산에 맞는 등급의 숙소 추천</li>
          <li>• <strong>식당 선별</strong>: 가격대에 적합한 맛집 위주로 구성</li>
          <li>• <strong>교통수단</strong>: 예산 고려한 효율적인 이동 방법</li>
          <li>• <strong>활동 선택</strong>: 무료/유료 관광지 적절히 조합</li>
        </ul>
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
          onClick={handleNext}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          여행 일정 생성하기
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
} 