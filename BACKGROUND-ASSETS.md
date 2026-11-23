# Фоны приложения

Созданы встроенным инструментом ImageGen 23 ноября 2026 года специально для РАССВЕТ. Во время работы приложения внешние сервисы изображений не используются.

Вариант «Без изображения» сохраняет обычное оформление. Настройка находится в аккаунте → Настройки → Оформление и данные → Фон приложения. Фон применяется ко всему приложению, сохраняется в localStorage `rassvet-background-v1` и не меняет выбранную тему. Изображения разделов, карты, графики и товарные фотографии сохраняются.

Для светлой темы поверх фотографии добавляется лишь 15% цвета фона, для тёмной — 20%: изображение хорошо видно вокруг рабочего пространства. Читаемость обеспечивает отдельная подложка под содержимым с 92% цвета темы, а не плотная вуаль поверх всей картинки. Подложки применяются в личном кабинете, публичных разделах, инженерном портале и орбитальной лаборатории. Главная сохраняет фотографии первого экрана; информационные секции ниже получают собственные подложки. При входе выбранная картинка также видна в левой части формы. В матовых темах 2026 насыщенность фотографии снижена до 25%. Картинки загружаются только при выборе; в настройках используются чистые миниатюры без декоративной схемы интерфейса. Вариант без изображения сохраняет обычные поверхности темы.

| Вариант | Полный исходник | Версия приложения | Миниатюра |
| --- | --- | --- | --- |
| earth | `design/backgrounds/earth.png` | `public/assets/backgrounds/earth.webp` | `public/assets/backgrounds/earth-preview.webp` |
| nebula | `design/backgrounds/nebula.png` | `public/assets/backgrounds/nebula.webp` | `public/assets/backgrounds/nebula-preview.webp` |
| mountains | `design/backgrounds/mountains.png` | `public/assets/backgrounds/mountains.webp` | `public/assets/backgrounds/mountains-preview.webp` |
| forest | `design/backgrounds/forest.png` | `public/assets/backgrounds/forest.webp` | `public/assets/backgrounds/forest-preview.webp` |
| lunar | `design/backgrounds/lunar.png` | `public/assets/backgrounds/lunar.webp` | `public/assets/backgrounds/lunar-preview.webp` |
| saturn | `design/backgrounds/saturn.png` | `public/assets/backgrounds/saturn.webp` | `public/assets/backgrounds/saturn-preview.webp` |
| milky-way | `design/backgrounds/milky-way.png` | `public/assets/backgrounds/milky-way.webp` | `public/assets/backgrounds/milky-way-preview.webp` |
| aurora | `design/backgrounds/aurora.png` | `public/assets/backgrounds/aurora.webp` | `public/assets/backgrounds/aurora-preview.webp` |
| ocean | `design/backgrounds/ocean.png` | `public/assets/backgrounds/ocean.webp` | `public/assets/backgrounds/ocean-preview.webp` |
| dunes | `design/backgrounds/dunes.png` | `public/assets/backgrounds/dunes.webp` | `public/assets/backgrounds/dunes-preview.webp` |

Реестр: `lib/backgrounds.ts`. Стили: `app/backgrounds.css`. Поиск и выбор произвольных URL не поддерживаются: приложение использует только свои локальные изображения.

## Точные промпты

### earth

```text
Use case: photorealistic-natural
Asset type: quiet widescreen background wallpaper for a satellite internet web app. Generate a single full-bleed landscape image, 16:9. Restrained premium photographic look, soft details and ample calm areas. Will sit behind UI panels in both light and dark modes. No UI, text, logos, watermark, borders, letterboxing, collage, split screen, or people.
Scene: realistic cinematic view of Earth's curved horizon from low orbit. Thin atmospheric glow, textured white clouds and muted ocean, quiet deep charcoal space above with sparse stars. Earth occupies lower half, understated soft sunrise at far right. Calm balanced exposure, no satellite or spacecraft.
```

### nebula

```text
Use case: photorealistic-natural
Asset type: quiet widescreen background wallpaper for a satellite internet web app. Generate a single full-bleed landscape image, 16:9. Restrained premium photographic look, soft details and ample calm areas. Will sit behind UI panels in both light and dark modes. No UI, text, logos, watermark, borders, letterboxing, collage, split screen, or people.
Scene: an elegant distant nebula, diffuse smoky violet and muted teal interstellar clouds across a deep charcoal starfield. Fine sparse stars, very soft glow, broad dark negative space, restrained color and natural astrophotography feel. No planets, hard bright flares or large central focal object.
```

### mountains

```text
Use case: photorealistic-natural
Asset type: quiet widescreen background wallpaper for a satellite internet web app. Generate a single full-bleed landscape image, 16:9. Restrained premium photographic look, soft details and ample calm areas. Will sit behind UI panels in both light and dark modes. No UI, text, logos, watermark, borders, letterboxing, collage, split screen, or people.
Scene: peaceful mountain lake at dawn, layered distant ridgelines, fine mist drifting over still water, muted slate and evergreen tones with pale warm clouded sky. Wide natural landscape photograph, no buildings or boats, no dramatic overprocessing. Lake occupies lower half with subtle reflection.
```

### forest

```text
Use case: photorealistic-natural
Asset type: quiet widescreen background wallpaper for a satellite internet web app. Generate a single full-bleed landscape image, 16:9. Restrained premium photographic look, soft details and ample calm areas. Will sit behind UI panels in both light and dark modes. No UI, text, logos, watermark, borders, letterboxing, collage, split screen, or people.
Scene: tranquil conifer forest in rolling hills, layers of tall pines disappearing into soft morning fog. Muted evergreen and sage, delicate pale light from above, aerial wide landscape photograph, no buildings or roads. Soft textured composition and calm evenly lit atmosphere.
```


### lunar

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: a realistic conceptual view just above the Moon's surface. Gently rolling silver-grey lunar plains and small softened craters stretch into a low horizon; a small distant blue-white Earth appears high in a quiet black sky with a few faint stars. Very soft low-angle sunlight, no landing craft, astronauts or infrastructure. Broad composition, muted neutral tones.
```

### saturn

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: a realistic conceptual deep-space photograph of Saturn and its delicate broad rings, entire planet and ring system visible with generous quiet charcoal space around them. Pale creamy grey cloud bands, softly lit rings tilted diagonally, subtle shadow of planet across rings, sparse fine stars. Restrained neutral palette, quiet scientific elegance, no other planets or spacecraft.
```

### milky-way

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: elegant natural night-sky astrophotography, the Milky Way forming a subtle diagonal river of fine stars and diffuse silvery dust across a deep indigo-charcoal sky, low dark rolling hill silhouettes at bottom edge. Muted lavender-grey glow, balanced exposure, soft details, no bright celestial discs or buildings. Wide tranquil composition.
```

### aurora

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: a tranquil snow-covered northern valley at night beneath delicate muted green aurora ribbons. Low snow hills and a dark line of distant conifers, wide open sky, soft starlight, subtle reflections in a small frozen lake. Restrained sage and charcoal palette, natural long-exposure photography, no buildings or artificial lights. Soft diffuse light, no neon colors.
```

### ocean

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: peaceful open ocean with gentle rolling waves in soft overcast dawn light, distant straight horizon below centre, pale silver-grey clouded sky. Slate blue-grey water, delicate ripples and subtle distant mist, minimal premium seascape photography. No land, boats, birds, structures or dramatic storm. Soft tonal transitions and calm wide framing.
```

### dunes

```text
Use case: photorealistic-natural
Asset type: premium quiet widescreen wallpaper for a satellite internet web app, full-bleed landscape 16:9.
Style: restrained cinematic photographic realism, soft gradients and natural texture, ample calm areas suitable behind interface panels in both light and dark themes.
Constraints: one coherent image, no UI, text, logos, watermark, people, frames, borders, letterbox bars, collages or split panels. Avoid oversaturation and hard lens flares.
Scene: minimalist sweeping desert dunes photographed at dawn, elegant smooth sand ridges with finely textured wind patterns. Pale beige-grey sand, long cool slate shadows, softly luminous ivory sky. Restrained neutral color balance, broad calm negative spaces, no orange cast, people, plants or tracks. Wide understated natural landscape photography.
```
