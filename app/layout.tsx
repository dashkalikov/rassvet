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
import "./operations.css";
import "./typography.css";
import "./order-experience.css";
import "./backgrounds.css";
import "./ui-refinements.css";
import "./icons.css";
import "./equipment-3d.css";
import {APPEARANCE_BOOTSTRAP} from '../lib/appearance';
import {BACKGROUND_BOOTSTRAP} from '../lib/backgrounds';
import BackgroundLayer from '../components/BackgroundLayer';

export const metadata: Metadata = {
  title: "РАССВЕТ — мир ближе, чем кажется",
  description: "Спутниковый интернет РАССВЕТ для дома, путешествий и бизнеса: тарифы, оборудование, карта покрытия и личный кабинет.",
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
      <head><script dangerouslySetInnerHTML={{__html:APPEARANCE_BOOTSTRAP+';'+BACKGROUND_BOOTSTRAP}}/></head>
      <body><BackgroundLayer/>{children}</body>
    </html>
  );
}
