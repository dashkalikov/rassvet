# Изображения

## Логотип

Знак из четырёх расходящихся скруглённых лучей перерисован в SVG по предоставленному пользователем образцу. Синий градиент согласован с палитрой приложения: `#6aa7ff → #3478df → #285cc4`. Вектор: `public/brand/rassvet-mark.svg`, PNG с прозрачностью: `public/brand/rassvet-mark.png`, компонент: `components/BrandMark.tsx`, общая геометрия: `lib/brand-mark.ts`, иконка вкладки: `public/favicon.svg`. Предпросмотр: `design/brand-rays-blue-preview.png`. Тёплый вариант сохранён в `design/brand-rays-warm.svg` и `design/brand-rays-warm.png`. Описание: [NAVIGATION-DESIGN.md](NAVIGATION-DESIGN.md).

В тёмной теме CSS помещает знак на светлую скруглённую подложку; в светлой теме подложка скрывается. Размер знака и его внутренние отступы одинаковы в обеих темах. Иконка вкладки использует светлую подложку в любой теме браузера. Сравнение вариантов: `design/brand-blue-uniform-theme-preview.png`.

## Иконки

В шапке, меню, карточках навигации, кабинете и переключателе темы используются локальные Google Material Symbols Rounded. 30 SVG, спрайт и лицензия Apache-2.0 находятся в `public/assets/icons/`. Остальные иконки — Lucide. Источники и подготовка описаны в [NAVIGATION-DESIGN.md](NAVIGATION-DESIGN.md). При просмотре внешние шрифты и Google Fonts не загружаются.

Четыре реалистичных изображения концептуальных терминалов, исходники и точные промпты описаны в [EQUIPMENT-ASSETS.md](EQUIPMENT-ASSETS.md). В каталоге используются локальные оптимизированные WebP.

Девять реалистичных изображений аксессуаров находятся в `public/assets/accessories/`. Список файлов и промпты встроенного ImageGen: [ACCESSORY-ASSETS.md](ACCESSORY-ASSETS.md).

Семь дополнительных изображений сценариев и инфраструктуры находятся в `public/assets/editorial/`: дом, путешествия, бизнес, спутник, наземная станция, установка терминала и Wi-Fi. Исходники, точные промпты встроенного ImageGen и список страниц: [EDITORIAL-ASSETS.md](EDITORIAL-ASSETS.md).

Ещё четыре изображения — распакованный комплект, специалист поддержки, учёба и северная полевая станция — описаны вместе с точными промптами встроенного ImageGen в [EDITORIAL-ASSETS-EXTRA.md](EDITORIAL-ASSETS-EXTRA.md). Их исходники сохранены в `design/editorial/`, версии для сайта — в `public/assets/editorial/`.

Распределение фотографий обновлено: сцены закреплены за разделами, миниатюры соответствуют своим страницам. Добавлены 25 отдельных сюжетов через встроенный ImageGen. Актуальная схема размещения и проверка повторов: [SECTION-IMAGES.md](SECTION-IMAGES.md). Точные промпты и пути новых файлов: [SECTION-IMAGE-PROMPTS.md](SECTION-IMAGE-PROMPTS.md). Старые документы сохраняют исходные промпты; текущее назначение определяется реестром `lib/editorial-images.ts`.

## Земля на рассвете

Создано встроенным ImageGen для этого проекта. Исходник: `public/assets/earth-dawn.png`. Оптимизированная версия, которую использует сайт: `public/assets/earth-dawn.webp`.

Промпт:

> Use case: ads-marketing. Asset type: cinematic website hero background, panoramic 3:2 landscape. A photorealistic view from low earth orbit at dawn, the massive gently curved horizon of Earth occupying the bottom half, natural deep cobalt blue atmosphere and detailed white clouds, nearly black navy starless space in the upper half, a restrained warm orange sunrise at the right edge of the horizon. Earth’s arc descends toward the left, bright blue sunlight grazes clouds. High contrast, premium aerospace editorial photography, subtle film grain, dramatic but physically grounded, no spacecraft, no planets besides Earth, no graphic overlays, no text, no logos. Leave dark empty negative space at upper left for website typography. Render as realistic NASA quality photography with rich blue cloud detail, not illustration.

## Фотографии

- `public/assets/home.jpg`: [Unsplash, дом среди деревьев](https://images.unsplash.com/photo-1449844908441-8829872d2607).
- `public/assets/mountains.jpg`: [Unsplash, горная вершина](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b).

Все изображения находятся в проекте и не требуют доступа к сервису при просмотре. Логотип и схема терминала созданы в SVG/CSS. SVG-карта использует географический контур России из Natural Earth; источник, локальные файлы и проекция описаны в [MAP-DATA.md](MAP-DATA.md).

Шрифт — системный Segoe UI / system-ui с системными запасными гарнитурами. Внешних запросов к Google Fonts нет. Иконки — локальные Google Material Symbols и Lucide.
