'use client';
import {useBackground} from '../lib/use-background';

export default function BackgroundLayer() {
 // Keep other tabs in sync even when account settings are closed. Markup stays SSR-stable.
 useBackground();
 return <div className="app-background" aria-hidden="true"/>;
}
