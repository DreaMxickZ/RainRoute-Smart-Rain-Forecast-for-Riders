"use client";

import Link from "next/link";
import { ArrowRight, CloudRain, Navigation, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/brand/Logo";
import { RouteMap } from "@/components/map/RouteMap";
import { routeService } from "@/services/routes/routeService";

const FEATURES = [
  {
    icon: <Navigation className="h-5 w-5" />,
    title: "เส้นทางสำเร็จรูป",
    body: "เลือกจากเส้นทางที่ใช้บ่อยในจังหวัด ไม่ต้องตั้งค่า",
  },
  {
    icon: <CloudRain className="h-5 w-5" />,
    title: "วิเคราะห์ฝนตลอดเส้นทาง",
    body: "ดึงข้อมูลจาก Open-Meteo และบอกจุดที่จะเจอฝน",
  },
  {
    icon: <Volume2 className="h-5 w-5" />,
    title: "แจ้งเตือนด้วยเสียง",
    body: "อ่านออกเสียงล่วงหน้า 15 / 10 / 5 นาทีก่อนเจอฝน",
  },
];

export default function HomePage() {
  const sampleRoute = routeService.list()[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-3xl border-2 bg-gradient-to-br from-sky-500/15 via-background to-indigo-500/10 p-6 sm:p-10">
        <div className="flex flex-col items-start gap-6">
          <Logo size={64} />
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              ไปไหนวันนี้...
              <br />
              <span className="text-primary">เจอฝนไหม?</span>
            </h1>
            <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
              รู้ก่อน เปียกที่ไหน กี่โมง — แอปสำหรับไรเดอร์โดยเฉพาะ
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="2xl" className="w-full gap-3 sm:w-auto">
              <Link href="/navigate">
                เริ่มนำทาง <ArrowRight className="h-6 w-6" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full border-2 sm:w-auto">
              <Link href="/dashboard">ดู Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="h-[280px] sm:h-[360px]">
        <RouteMap route={sampleRoute} position={null} analysis={null} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="space-y-2 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                {f.icon}
              </span>
              <div className="font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.body}</div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
