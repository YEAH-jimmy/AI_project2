import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI 여행 플래너',
  description: 'AI가 추천하는 맞춤형 여행 일정',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* 
          카카오맵 SDK 로드 설정:
          - autoload=false: document.write 오류 방지
          - libraries: 필요한 기능 지정
          - beforeInteractive: 가능한 빠르게 로드
        */}
        <Script
          strategy="beforeInteractive"
          src="//dapi.kakao.com/v2/maps/sdk.js?appkey=b96ce35e1cd6d37f165e9b54ebc06ae8&libraries=services,clusterer,drawing&autoload=false"
          id="kakao-maps-sdk"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
