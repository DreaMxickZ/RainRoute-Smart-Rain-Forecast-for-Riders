# RainRoute ☔🏍️

Production-ready PWA สำหรับวิเคราะห์เส้นทางและคาดการณ์ฝนตลอดเส้นทาง
เหมาะกับผู้ใช้รถจักรยานยนต์ ภาษาไทยทั้งหมด

## Tech Stack

- **Next.js 15** App Router + TypeScript
- **TailwindCSS** + **shadcn/ui** primitives
- **React Leaflet** + OpenStreetMap tiles
- **Open-Meteo API** สำหรับ Probability of Precipitation และ Rain Intensity
- **Browser Geolocation API** สำหรับติดตามตำแหน่ง real-time
- **Web Speech API** สำหรับเสียงแจ้งเตือนภาษาไทย
- **Zustand** + persist สำหรับ state / settings
- **PWA** (manifest + service worker)

## คุณสมบัติ

- หน้า **Home** พร้อมโลโก้ แผนที่ และปุ่มเริ่มนำทาง
- ระบบ GPS แบบ real-time
- เส้นทางสำเร็จรูปในไฟล์ `src/data/routes.json` (เฉวง→หน้าทอน, หน้าทอน→เฉวง, ละไม→บ่อผุด, บ่อผุด→สนามบินสมุย)
- `analyzeRainAlongRoute()` วิเคราะห์ฝนตลอดเส้นทาง
- เสียงประกาศ "อีก 15/10/5 นาทีจะพบฝน", "กำลังเข้าสู่พื้นที่ฝน", "พ้นพื้นที่ฝนแล้ว"
- **Dashboard** สรุประยะทางรวม / เวลาเดินทาง / จุดตรวจฝน / ความรุนแรง (เขียว–เหลือง–แดง)
- ติดตั้งได้บน Android (PWA installable)

## โครงสร้างโปรเจกต์

```
RainRoute/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── favicon.svg
│   ├── icon-192.svg
│   └── icon-512.svg
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Home
│   │   ├── globals.css
│   │   ├── navigate/page.tsx       # หน้านำทาง
│   │   └── dashboard/page.tsx      # Dashboard
│   ├── components/
│   │   ├── brand/Logo.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardGrid.tsx
│   │   │   ├── RainTimeline.tsx
│   │   │   └── StatsCard.tsx
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   └── AppShell.tsx
│   │   ├── map/
│   │   │   ├── MapClient.tsx
│   │   │   └── RouteMap.tsx
│   │   ├── navigation/
│   │   │   ├── RainAlertCard.tsx
│   │   │   ├── RoutePicker.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── theme/
│   │   │   ├── ThemeProvider.tsx
│   │   │   └── ThemeToggle.tsx
│   │   └── ui/                     # shadcn primitives
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── select.tsx
│   │       └── switch.tsx
│   ├── data/
│   │   └── routes.json
│   ├── hooks/
│   │   ├── useGeolocation.ts
│   │   ├── useRainAlerts.ts
│   │   ├── useRainAnalysis.ts
│   │   └── useServiceWorker.ts
│   ├── lib/
│   │   └── utils.ts                # cn()
│   ├── services/
│   │   ├── geolocation/geoService.ts
│   │   ├── routes/routeService.ts
│   │   ├── speech/speechService.ts
│   │   └── weather/
│   │       ├── rainAnalyzer.ts     # analyzeRainAlongRoute()
│   │       └── weatherService.ts
│   ├── store/
│   │   ├── navigationStore.ts
│   │   └── settingsStore.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── route.ts
│   │   └── weather.ts
│   └── utils/
│       ├── geo.ts                  # Haversine, sampling, distance
│       └── time.ts
├── components.json                 # shadcn config
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## คำสั่งติดตั้งและรัน

```bash
# ติดตั้ง dependencies
npm install

# โหมดพัฒนา
npm run dev

# build production
npm run build

# รัน production
npm start

# type-check
npm run typecheck
```

เปิด <http://localhost:3000> หลังจาก `npm run dev`

## หมายเหตุ

- **Open-Meteo** เป็น API ฟรี ไม่ต้องใช้ API Key
- **Service Worker** จะ register เฉพาะ production build (`npm run build && npm start`)
- เสียงภาษาไทยขึ้นอยู่กับ voice ที่ติดตั้งในเครื่อง — ปกติ Android/Chrome/Edge รองรับโดยตรง
- เส้นทางสามารถเพิ่มได้ที่ `src/data/routes.json`

## License

MIT
# RainRoute-Smart-Rain-Forecast-for-Riders
