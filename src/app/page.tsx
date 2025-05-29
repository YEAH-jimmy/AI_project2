'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Users, Heart, Route, Wallet, ArrowRight, Star, Clock, CheckCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// 이미지 URL 상수
const HERO_BG = 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?q=80&w=2070&auto=format&fit=crop';
const JEJU_IMG = 'https://images.unsplash.com/photo-1601555048922-64152361aef0?q=80&w=2070&auto=format&fit=crop';
const BUSAN_IMG = 'https://images.unsplash.com/photo-1578037571252-e9e38f1e5e49?q=80&w=2070&auto=format&fit=crop';
const SEOUL_IMG = 'https://images.unsplash.com/photo-1603852452378-a4e8d84324a2?q=80&w=2134&auto=format&fit=crop';

// 추천 여행지 데이터
const recommendedDestinations = [
  {
    name: '제주도',
    image: JEJU_IMG,
    description: '푸른 바다, 화산지형, 특색있는 문화가 어우러진 아름다운 섬',
    rating: 4.9,
    days: '3박 4일'
  },
  {
    name: '부산',
    image: BUSAN_IMG,
    description: '해변과 도시가 공존하는 한국 제2의 도시, 맛과 멋의 도시',
    rating: 4.7,
    days: '2박 3일'
  },
  {
    name: '서울',
    image: SEOUL_IMG,
    description: '전통과 현대가 어우러진 대한민국의 수도, 다양한 관광지',
    rating: 4.8,
    days: '2박 3일'
  }
];

// 사용자 리뷰 데이터
const reviews = [
  {
    name: '김지훈',
    content: '여행 계획 세우는 것이 항상 힘들었는데, 이 서비스 덕분에 한 시간 만에 완벽한 제주도 여행 계획을 세울 수 있었어요. 특히 날씨에 맞게 일정을 추천해준 것이 좋았습니다.',
    rating: 5,
    destination: '제주도',
    date: '2023년 12월'
  },
  {
    name: '이미영',
    content: '가족 여행 계획을 짜는데 정말 유용했어요. 아이들을 위한 장소도 추천해주고, 이동 경로도 최적화되어 편안한 여행을 할 수 있었습니다.',
    rating: 5,
    destination: '부산',
    date: '2023년 11월'
  },
  {
    name: '박준혁',
    content: '친구들과의 여행을 위해 사용했는데, 취향을 반영한 맛집 추천이 정말 좋았어요. 시간 절약도 되고 모두가 만족한 여행이었습니다.',
    rating: 4,
    destination: '강릉',
    date: '2024년 1월'
  }
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('features');

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* 네비게이션 바 */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <MapPin className={`h-8 w-8 ${isScrolled ? 'text-blue-600' : 'text-white'}`} />
                <span className={`ml-2 font-bold text-xl ${isScrolled ? 'text-gray-800' : 'text-white'}`}>
                  여행 플래너
                </span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                <a href="#features" className={`${isScrolled ? 'text-gray-600' : 'text-white'} hover:text-blue-500 transition-colors`}>기능</a>
                <a href="#destinations" className={`${isScrolled ? 'text-gray-600' : 'text-white'} hover:text-blue-500 transition-colors`}>추천 여행지</a>
                <a href="#how-it-works" className={`${isScrolled ? 'text-gray-600' : 'text-white'} hover:text-blue-500 transition-colors`}>이용 방법</a>
                <a href="#reviews" className={`${isScrolled ? 'text-gray-600' : 'text-white'} hover:text-blue-500 transition-colors`}>리뷰</a>
              </div>
            </div>
            <div>
              <Link href="/planner">
                <Button variant={isScrolled ? "default" : "outline"} className={isScrolled ? "" : "border-white text-white hover:bg-white hover:text-blue-600"}>
                  여행 계획 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="relative h-screen">
        <div className="absolute inset-0 z-0">
          <div className="relative w-full h-full">
            <Image 
              src={HERO_BG}
              alt="한국의 아름다운 풍경" 
              fill
              style={{objectFit: 'cover'}}
              quality={90}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 to-black/50" />
          </div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center h-full text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="block">AI가 만드는</span>
              <span className="text-blue-300">완벽한 여행 계획</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto">
              여행지, 날짜, 관심사를 입력하면 AI가 자동으로 최적의 여행 일정과 경로를 구성해드립니다.
              더 이상 복잡한 여행 계획에 시간을 낭비하지 마세요.
            </p>
            <div className="space-x-4">
              <Link href="/planner">
                <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                  무료로 시작하기
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-700">
                  이용 방법 알아보기
                </Button>
              </a>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center">
          <a href="#features" className="animate-bounce bg-white p-2 w-10 h-10 ring-1 ring-slate-200 shadow-lg rounded-full flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-blue-600 -rotate-90" />
          </a>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 우리 서비스를 선택해야 할까요?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI 기술로 완성되는 맞춤형 여행 계획과 함께 특별한 경험을 만들어보세요.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-xl transition-shadow border-t-4 border-t-blue-500">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">시간 절약</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  몇 분 만에 완성되는 맞춤형 여행 일정으로 계획 시간을 대폭 단축하세요.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow border-t-4 border-t-green-500">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">비용 효율성</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  예산에 맞는 최적의 일정으로 불필요한 비용을 줄이고 알찬 여행을 만들어보세요.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow border-t-4 border-t-purple-500">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">맞춤형 추천</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  개인 취향과 관심사를 반영한 맞춤형 추천으로 더욱 만족스러운 여행을 경험하세요.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-xl transition-shadow border-t-4 border-t-orange-500">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Route className="w-8 h-8 text-orange-600" />
                </div>
                <CardTitle className="text-xl">최적 경로</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  이동 시간을 최소화하는 효율적인 경로 설계로 더 많은 장소를 여유롭게 관광하세요.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* 추천 여행지 섹션 */}
      <section id="destinations" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              추천 여행지
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AI가 추천하는 인기 여행지를 살펴보고 여행 계획을 시작해보세요.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recommendedDestinations.map((destination, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105">
                <div className="relative h-64 w-full">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    style={{objectFit: 'cover'}}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-2xl font-bold">{destination.name}</h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1">{destination.rating}</span>
                      </div>
                      <span className="mx-2">•</span>
                      <span>{destination.days} 추천</span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">{destination.description}</p>
                  <Link href={`/planner?destination=${destination.name}`}>
                    <Button className="w-full">
                      <MapPin className="w-4 h-4 mr-2" />
                      이곳으로 여행 계획하기
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              이렇게 쉽게 만들어져요
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              단 몇 분이면 완벽한 여행 계획이 완성됩니다.
            </p>
          </div>
          
          <div className="relative">
            {/* 연결선 */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-blue-100 -translate-y-1/2 z-0"></div>
            
            {/* 단계 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <MapPin className="w-10 h-10 text-blue-600" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">여행지 선택</h3>
                <p className="text-gray-600 text-center">
                  가고 싶은 도시나 지역을 선택하세요. 인기 여행지 추천도 제공해드립니다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="w-10 h-10 text-green-600" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">정보 입력</h3>
                <p className="text-gray-600 text-center">
                  여행 날짜, 인원, 관심사, 예산 등 간단한 정보를 알려주세요.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <Sparkles className="w-10 h-10 text-purple-600" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">AI 분석</h3>
                <p className="text-gray-600 text-center">
                  AI가 최적의 일정, 맛집, 관광지를 분석하고 최적의 경로를 계산합니다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="relative">
                  <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-10 h-10 text-orange-600" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">일정 완성</h3>
                <p className="text-gray-600 text-center">
                  완성된 일정을 확인하고 지도에서 경로를 확인하세요. 원하는 대로 수정도 가능합니다.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-16">
            <Link href="/planner">
              <Button size="lg" className="text-lg px-8 py-6">
                지금 바로 시작하기
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* 사용자 리뷰 섹션 */}
      <section id="reviews" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              사용자 리뷰
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              실제 사용자들의 소중한 경험을 확인하세요.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{review.name}</CardTitle>
                      <CardDescription>{review.destination} • {review.date}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">"{review.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            지금 바로 여행 계획을 시작해보세요
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            무료로 이용할 수 있으며, 몇 분 안에 완벽한 여행 일정이 완성됩니다.
            더 이상 여행 계획으로 고민하지 마세요.
          </p>
          <Link href="/planner">
            <Button size="lg" variant="secondary" className="text-lg px-10 py-6 bg-white text-blue-700 hover:bg-blue-50">
              무료로 시작하기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
      
      {/* 푸터 */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MapPin className="h-6 w-6 text-blue-400" />
                <span className="ml-2 font-bold text-xl">여행 플래너</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI 기술을 활용한 맞춤형 여행 계획 서비스로,
                누구나 쉽고 빠르게 최적의 여행 일정을 만들 수 있습니다.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">주요 기능</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">이용 방법</a></li>
                <li><a href="#destinations" className="hover:text-blue-400 transition-colors">추천 여행지</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">이용약관</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">고객지원</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">자주 묻는 질문</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">문의하기</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">피드백</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">개인정보처리방침</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">팔로우</h3>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                최신 소식과 여행 팁을 소셜 미디어에서 확인하세요.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p>© 2024 여행 플래너. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
