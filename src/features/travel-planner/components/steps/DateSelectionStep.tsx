'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays, differenceInDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useTravelPlannerStore } from '@/lib/stores/travel-planner-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, ArrowRight } from 'lucide-react'

const dateSchema = z.object({
  startDate: z.string().min(1, '출발일을 선택해주세요'),
  endDate: z.string().min(1, '도착일을 선택해주세요'),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: '도착일은 출발일보다 늦어야 합니다',
  path: ['endDate']
})

type DateFormData = z.infer<typeof dateSchema>

export function DateSelectionStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<DateFormData>({
    resolver: zodResolver(dateSchema),
    mode: 'onChange',
    defaultValues: {
      startDate: planData.startDate ? format(planData.startDate, 'yyyy-MM-dd') : '',
      endDate: planData.endDate ? format(planData.endDate, 'yyyy-MM-dd') : '',
    }
  })

  const startDateValue = watch('startDate')
  const endDateValue = watch('endDate')
  
  const tripDuration = startDateValue && endDateValue 
    ? differenceInDays(new Date(endDateValue), new Date(startDateValue)) + 1
    : 0

  const onSubmit = (data: DateFormData) => {
    updatePlanData({
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    })
    setCurrentStep(2)
  }

  const handleQuickSelect = (days: number) => {
    const today = new Date()
    const startDate = format(today, 'yyyy-MM-dd')
    const endDate = format(addDays(today, days - 1), 'yyyy-MM-dd')
    
    // Manual update since we can't use setValue with register
    const startInput = document.getElementById('startDate') as HTMLInputElement
    const endInput = document.getElementById('endDate') as HTMLInputElement
    
    if (startInput && endInput) {
      startInput.value = startDate
      endInput.value = endDate
      startInput.dispatchEvent(new Event('input', { bubbles: true }))
      endInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          여행 날짜를 선택해주세요
        </h2>
        <p className="text-gray-600">
          언제 여행을 떠나실 예정인가요?
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            여행 기간 설정
          </CardTitle>
          <CardDescription>
            여행 출발일과 도착일을 선택하시면 자동으로 일정을 계산해드립니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">출발일</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className={errors.startDate ? 'border-red-500' : ''}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">도착일</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  min={startDateValue || format(new Date(), 'yyyy-MM-dd')}
                  className={errors.endDate ? 'border-red-500' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {tripDuration > 0 && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">
                  선택한 여행 기간: <span className="font-semibold">{tripDuration}일</span>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label>빠른 선택</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { days: 1, label: '당일치기' },
                  { days: 2, label: '1박 2일' },
                  { days: 3, label: '2박 3일' },
                  { days: 4, label: '3박 4일' },
                ].map((option) => (
                  <Button
                    key={option.days}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSelect(option.days)}
                    className="text-sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!isValid}
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
  )
} 