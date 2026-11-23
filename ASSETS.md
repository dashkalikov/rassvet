# Изображения

## Фоны оформления

Десять фонов — Земля с орбиты, туманность, лунный горизонт, кольца Сатурна, Млечный Путь, горное озеро, лес в тумане, северное сияние, океан и песчаные дюны — созданы встроенным ImageGen. В настройках можно выбрать изображение или обычный фон без картинки. Исходники, оптимизированные версии и точные промпты: [BACKGROUND-ASSETS.md](BACKGROUND-ASSETS.md).

## Логотип

Знак из четырёх расходящихся скруглённых лучей перерисован в SVG по предоставленному пользователем образцу. Синий градиент согласован с палитрой приложения: `#6aa7ff → #3478df → #285cc4`. Вектор: `public/brand/rassvet-mark.svg`, PNG с прозрачностью: `public/brand/rassvet-mark.png`, компонент: `components/BrandMark.tsx`, общая геометрия: `lib/brand-mark.ts`, иконка вкладки: `public/favicon.svg`. Предпросмотр: `design/brand-rays-blue-preview.png`. Тёплый вариант сохранён в `design/brand-rays-warm.svg` и `design/brand-rays-warm.png`. Описание: [NAVIGATION-DESIGN.md](NAVIGATION-DESIGN.md).

В тёмной теме CSS помещает знак на светлую скруглённую подложку; в светлой теме подложка скрывается. Размер знака и его внутренние отступы одинаковы в обеих темах. Иконка вкладки использует светлую подложку в любой теме браузера. Сравнение вариантов: `design/brand-blue-uniform-theme-preview.png`.

## Иконки

В интерфейсе используется единое контурное семейство Lucide. Компонент `MaterialIcon` сохраняет прежние 30 смысловых имён, но выводит локальную геометрию прямо в SVG страницы без внешнего спрайта. Размеры рядом с текстом: 20–22 px, в заголовках и карточках: 28–32 px. Стили `app/icons.css` защищают иконки от сжатия и выравнивают их в полях и кнопках. Заливка звёзд избранного сохраняется. Прежние исходники Google Material Symbols Rounded и лицензия Apache-2.0 оставлены в `public/assets/icons/`; история подготовки описана в [NAVIGATION-DESIGN.md](NAVIGATION-DESIGN.md). Внешние шрифты и Google Fonts не загружаются.

Четыре реалистичных изображения концептуальных терминалов, исходники и точные промпты описаны в [EQUIPMENT-ASSETS.md](EQUIPMENT-ASSETS.md). В каталоге используются локальные оптимизированные WebP.

Девять реалистичных изображений аксессуаров находятся в `public/assets/accessories/`. Список файлов и промпты встроенного ImageGen: [ACCESSORY-ASSETS.md](ACCESSORY-ASSETS.md).

Семь дополнительных изображений сценариев и инфраструктуры находятся в `public/assets/editorial/`: дом, путешествия, бизнес, спутник, наземная станция, установка терминала и Wi-Fi. Исходники, точные промпты встроенного ImageGen и список страниц: [EDITORIAL-ASSETS.md](EDITORIAL-ASSETS.md).

Ещё четыре изображения — распакованный комплект, специалист поддержки, учёба и северная полевая станция — описаны вместе с точными промптами встроенного ImageGen в [EDITORIAL-ASSETS-EXTRA.md](EDITORIAL-ASSETS-EXTRA.md). Их исходники сохранены в `design/editorial/`, версии для сайта — в `public/assets/editorial/`.

Распределение фотографий обновлено: сцены закреплены за разделами, миниатюры соответствуют своим страницам. Добавлены 25 отдельных сюжетов через встроенный ImageGen. Актуальная схема размещения и проверка повторов: [SECTION-IMAGES.md](SECTION-IMAGES.md). Точные промпты и пути новых файлов: [SECTION-IMAGE-PROMPTS.md](SECTION-IMAGE-PROMPTS.md). Старые документы сохраняют исходные промпты; текущее назначение определяется реестром `lib/editorial-images.ts`.

## Земля на рассвете

Создано встроенным ImageGen для этого проекта. Исходник: `public/assets/earth-dawn.png`. Оптимизированная версия, которую использует сайт: `public/assets/earth-dawn.webp`.

Промпт:

> Use case: ads-marketing. Asset type: cinematic website hero background, panoramic 3:2 landscape. A photorealistic view from low earth orbit at dawn, the massive gently curved horizon of Earth occupying the bottom half, natural deep cobalt blue atmosphere and detailed white clouds, nearly black navy starless space in the upper half, a restrained warm orange sunrise at the right edge of the horizon. Earth’s arc descends toward the left, bright blue sunlight grazes clouds. High contrast, premium aerospace editorial photography, subtle film grain, dramatic but physically grounded, no spacecraft, no planets besides Earth, no graphic overlays, no text, no logos. Leave dark empty negative space at upper left for website typography. Render as realistic NASA quality photography with rich blue cloud detail, not illustration.

## Инженерный портал

Три иллюстрации созданы встроенным ImageGen и сохранены в `public/assets/engineering/` в формате WebP.

`orbit-hero.webp` — спутник над Землёй для главной страницы.

> Create a realistic cinematic editorial photograph for the wide landscape hero of a modern satellite telemetry dashboard, 3:2 landscape. View from low Earth orbit looking down at the Earth's curved limb, white cloud patterns and deep blue oceans across the lower right, delicate Arctic nightfall and a pale icy blue atmospheric rim sweeping across from mid-right to lower-left. On the upper-right quadrant one small realistic low Earth orbit communications satellite, metallic rectangular bus and wide deep-blue solar array wings, seen from above at a slight 3/4 angle, no motion blur. Have the upper left and left third largely dark empty outer space for a white text overlay; very restrained low saturation in charcoal, indigo and ice blue, quiet fine grain and plausible optical lighting. Avoid orange/pink, neon, infographic annotations, vector lines, any letters, numbers, logo, labels, map text, fake panels, or typography. Composition should survive a 3:1 wide crop with subject centered vertically, satellite appreciably to the right. High-quality credible orbital observation photography.

`ground-station.webp` — наземная антенна для карточки метрик.

> Landscape 3:2 realistic editorial photograph for a small dark technology operations portal card, depicting a modern satellite ground station during blue hour. One medium white parabolic antenna, cold charcoal foreground, technical access walkway and a thin slate horizon; geographically plausible isolated Nordic terrain. High legibility in a small thumbnail, striking dish silhouette, restrained neutral blue-gray palette, no text, no branding, no graphics, no orange, no people. Center the dish, occupy 65% of frame height, photographic lighting.

`subscriber-terminal.webp` — абонентский терминал для карточки подписок.

> Landscape 3:2 realistic editorial photograph for an engineering dashboard card about satellite broadband subscriptions. A compact white flat rectangular satellite internet terminal installed on a low metal mount beside the upper roof of a quiet modern rural cabin, medium close shot of terminal, soft misty pine forest behind, subdued gray and clean neutral lighting, slightly warm wood in background only, technical product photography, no text or marks, no people, no drawn elements. Main object clearly visible in tiny square crop, center composition.

## Объёмные модели оборудования

Четыре модели терминалов Mini, Standard, Pro и Mobility создаются локально в `lib/equipment-terminal.ts` и `lib/equipment-geometry.ts`. Геометрия повторяет внешний вид изображений каталога: литая трёхлучевая опора Standard, складная рамка Mini, монтажная база с шарнирами Pro и низкие опоры Mobility. Добавлены фаски, крепёж, прорези, уплотнения, радиаторы и герметичные разъёмы. Для металла и лицевой панели используются физические материалы и локально генерируемые микротекстуры. Падающие тени и плоскость под моделями отключены. Это визуализации внешнего вида каталога, а не производственные CAD-модели. Для отрисовки используется [Three.js](https://threejs.org/) с лицензией MIT; библиотека включена в локальную сборку. 3D-просмотр не загружает модели, текстуры или окружение с внешних серверов.

## Фотографии сайта

- `public/assets/home.jpg`: [Unsplash, дом среди деревьев](https://images.unsplash.com/photo-1449844908441-8829872d2607).
- `public/assets/mountains.jpg`: [Unsplash, горная вершина](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b).

Все изображения находятся в проекте и не требуют доступа к сервису при просмотре. Логотип и схема терминала созданы в SVG/CSS. SVG-карта использует географический контур России из Natural Earth; источник, локальные файлы и проекция описаны в [MAP-DATA.md](MAP-DATA.md).

Шрифт — системный Segoe UI / system-ui с системными запасными гарнитурами. Внешних запросов к Google Fonts нет. Иконки — локальные Google Material Symbols и Lucide.
