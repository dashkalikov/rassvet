export default function AuthOrbit() {
  return <svg className="auth-orbit-art" viewBox="0 0 640 800" fill="none" aria-hidden="true">
    <circle className="auth-orbit-halo" cx="320" cy="520" r="192"/>
    <g className="auth-orbit-lines" strokeWidth="1.4"><circle cx="320" cy="520" r="192"/><circle cx="320" cy="520" r="138" strokeDasharray="3 9"/><ellipse cx="320" cy="520" rx="272" ry="76" transform="rotate(-29 320 520)"/><path d="M128 520h384M320 328v384" strokeDasharray="3 10"/></g>
    <g className="auth-orbit-nodes"><circle cx="82" cy="644" r="6"/><circle cx="558" cy="396" r="8"/><circle cx="320" cy="328" r="5"/></g>
    <rect className="auth-orbit-card" x="257" y="457" width="126" height="126" rx="33" strokeWidth="1.5"/>
    <g className="auth-orbit-person" strokeWidth="3" strokeLinecap="round"><circle cx="320" cy="502" r="18"/><path d="M286 552c0-19 13-30 34-30s34 11 34 30"/></g>
    <rect className="auth-orbit-card" x="123" y="348" width="64" height="64" rx="19"/>
    <path className="auth-orbit-person" d="m143 380 9 9 16-18" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect className="auth-orbit-card" x="459" y="638" width="64" height="64" rx="19"/>
    <path className="auth-orbit-person" d="M478 658h26v19h-12l-9 7v-7h-5v-19Z" strokeWidth="2" strokeLinejoin="round"/>
  </svg>;
}
