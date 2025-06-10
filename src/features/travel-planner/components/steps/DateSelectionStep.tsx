'use client'

import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, ArrowRight } from 'lucide-react'

// 당일치기 허용을 위한 유효성 검사 수정
const dateSchema = z.object({
  startDate: z.string().min(1, '출발일을 선택해주세요'),
  endDate: z.string().min(1, '도착일을 선택해주세요'),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  // 당일치기 허용: 출발일과 도착일이 같거나 도착일이 더 늦어야 함
  return start <= end
}, {
  message: '도착일은 출발일과 같거나 늦어야 합니다',
  path: ['endDate']
})

type DateFormData = z.infer<typeof dateSchema>

export function DateSelectionStep() {
  const { planData, updatePlanData, setCurrentStep } = useTravelPlannerStore()
  const [isDayTrip, setIsDayTrip] = useState(false)
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
  
  // 여행 기간 계산 - 실시간으로 업데이트
  const tripDuration = startDateValue && endDateValue 
    ? differenceInDays(new Date(endDateValue), new Date(startDateValue)) + 1
    : 0

  // 초기 당일치기 상태 설정
  useEffect(() => {
    if (planData.startDate && planData.endDate) {
      const duration = differenceInDays(planData.endDate, planData.startDate) + 1
      setIsDayTrip(duration === 1)
    }
  }, [planData.startDate, planData.endDate])

  // 당일치기 토글 처리
  const handleDayTripToggle = (checked: boolean) => {
    setIsDayTrip(checked)
    
    if (checked && startDateValue) {
      // 당일치기로 설정하면 도착일을 출발일과 같게 설정
      setValue('endDate', startDateValue, { shouldValidate: true })
      // 즉시 validation 트리거
      setTimeout(() => {
        setValue('endDate', startDateValue, { shouldValidate: true })
      }, 100)
    } else if (!checked && startDateValue) {
      // 당일치기 해제하면 기본적으로 1박 2일로 설정 (도착일이 같거나 이전인 경우만)
      const currentEndDate = new Date(endDateValue || startDateValue)
      const startDate = new Date(startDateValue)
      
      if (currentEndDate <= startDate) {
        const nextDay = format(addDays(startDate, 1), 'yyyy-MM-dd')
        setValue('endDate', nextDay, { shouldValidate: true })
      }
    }
  }

  // 출발일 변경 시 당일치기인 경우 도착일도 자동 변경
  useEffect(() => {
    if (isDayTrip && startDateValue) {
      setValue('endDate', startDateValue, { shouldValidate: true })
    }
  }, [startDateValue, isDayTrip, setValue])

  // 날짜 변경 시 당일치기 상태 자동 업데이트
  useEffect(() => {
    if (startDateValue && endDateValue) {
      const start = new Date(startDateValue)
      const end = new Date(endDateValue)
      const duration = differenceInDays(end, start) + 1
      
      // 실제 선택된 날짜가 1일이면 당일치기로 자동 설정
      if (duration === 1 && !isDayTrip) {
        setIsDayTrip(true)
      } else if (duration > 1 && isDayTrip) {
        setIsDayTrip(false)
      }
    }
  }, [startDateValue, endDateValue, isDayTrip])

  const onSubmit = (data: DateFormData) => {
    updatePlanData({
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate)
    })
    setCurrentStep(2)
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
            {/* 당일치기 체크박스 */}
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg">
              <Checkbox 
                id="dayTrip" 
                checked={isDayTrip}
                onCheckedChange={handleDayTripToggle}
              />
              <Label htmlFor="dayTrip" className="text-sm font-medium">
                당일치기 여행
              </Label>
              <span className="text-xs text-gray-500 ml-2">
                (출발일과 도착일이 같은 날)
              </span>
            </div>

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
                  disabled={isDayTrip}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-500">{errors.endDate.message}</p>
                )}
                {isDayTrip && (
                  <p className="text-xs text-gray-500">당일치기 여행에서는 출발일과 같습니다</p>
                )}
              </div>
            </div>

            {/* 실시간 여행 기간 표시 */}
            {tripDuration > 0 && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">선택한 여행 기간: {tripDuration}일</span>
                  {tripDuration === 1 && ' (당일치기)'}
                  {tripDuration === 2 && ' (1박 2일)'}
                  {tripDuration === 3 && ' (2박 3일)'}
                  {tripDuration === 4 && ' (3박 4일)'}
                  {tripDuration > 4 && ` (${tripDuration - 1}박 ${tripDuration}일)`}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {format(new Date(startDateValue), 'M월 d일', { locale: ko })} ~ {format(new Date(endDateValue), 'M월 d일', { locale: ko })}
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!isValid || tripDuration === 0}
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