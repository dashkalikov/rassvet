import type { Metadata } from "next";
import "./globals.css";
import "./themes.css";
import "./pages.css";
import "./catalog.css";
import "./readability.css";
import "./hero.css";
import "./map.css";
import "./speedtest.css";
import "./refresh.css";
import "./imagery.css";
import "./account-settings.css";
import "./choices.css";
import "./matte-themes.css";
import {APPEARANCE_BOOTSTRAP} from '../lib/appearance';

export const metadata: Metadata = {
  title: "РАССВЕТ — мир ближе, чем кажется",
  description: "Спутниковый интернет для дома, путешествий и бизнеса. Учебная концепция оператора РАССВЕТ: тарифы, карта покрытия и личный кабинет.",
  icons: {
    icon: "/favicon.svg?v=6",
    shortcut: "/favicon.svg?v=6",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:APPEARANCE_BOOTSTRAP}}/></head>
      <body>{children}</body>
    </html>
  );
}
