import { useEffect, useState, useRef } from 'react';
import { useSiteSettings } from '@/lib/contexts/SiteSettingsContext';

export default function LoadingScreen({ onFinish }) {
  const siteSettings  = useSiteSettings();
  const siteName      = siteSettings.siteName  || 'Maxo';
  const siteTagline   = siteSettings.tagline   || "Locations d’exception";
  const siteInitial   = siteName.charAt(0).toUpperCase();
  const [phase, setPhase] = useState(0); // 0: enter, 1: logo, 2: exit
  const canvasRef = useRef(null);

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create floating particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4 - 0.2,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.02;
        const currentOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse));

        // Wrap around
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        gradient.addColorStop(0, `hsla(38, 65%, 50%, ${currentOpacity})`);
        gradient.addColorStop(1, `hsla(38, 65%, 50%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = `hsla(38, 65%, 60%, ${currentOpacity * 1.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Phase timing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onFinish?.(), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-all duration-700 ease-in-out ${
        phase === 2 ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ opacity: phase === 2 ? 0 : 0.8, transition: 'opacity 0.7s' }}
      />

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="loading-glow-1 absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.07] blur-[120px]" />
        <div className="loading-glow-2 absolute left-[40%] top-[35%] h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.09] blur-[90px]" />
        <div className="loading-glow-3 absolute right-[30%] bottom-[30%] h-[250px] w-[250px] rounded-full bg-accent/[0.05] blur-[80px]" />
      </div>

      {/* Geometric lines */}
      <svg className="absolute inset-0 z-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="0" y1="50%" x2="100%" y2="50%"
          stroke="hsl(var(--accent))"
          strokeWidth="0.5"
          className={`transition-all duration-1000 delay-500 ${phase >= 1 ? 'opacity-[0.06]' : 'opacity-0'}`}
        />
        <line
          x1="50%" y1="0" x2="50%" y2="100%"
          stroke="hsl(var(--accent))"
          strokeWidth="0.5"
          className={`transition-all duration-1000 delay-600 ${phase >= 1 ? 'opacity-[0.06]' : 'opacity-0'}`}
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo icon with orbiting elements */}
        <div
          className={`transition-all duration-900 ease-out ${
            phase >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          <div className="relative">
            {/* Outer orbit ring */}
            <div className="absolute -inset-8">
              <svg className="h-full w-full loading-spin-slow" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="0.5"
                  strokeDasharray="8 20"
                  opacity="0.2"
                />
              </svg>
            </div>

            {/* Inner spinning ring with dash animation */}
            <div className="absolute -inset-5">
              <svg className="h-full w-full loading-spin" viewBox="0 0 96 96">
                <circle
                  cx="48" cy="48" r="42"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="1.5"
                  strokeDasharray="40 90 20 90"
                  strokeLinecap="round"
                  opacity="0.35"
                  className="loading-dash"
                />
              </svg>
            </div>

            {/* Reverse spinning ring */}
            <div className="absolute -inset-3">
              <svg className="h-full w-full loading-spin-reverse" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r="36"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="15 60"
                  strokeLinecap="round"
                  opacity="0.2"
                />
              </svg>
            </div>

            {/* Logo box with pulse glow */}
            <div className="relative">
              <div className="loading-logo-glow absolute -inset-2 rounded-2xl bg-accent/20 blur-xl" />
              <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-primary shadow-2xl shadow-primary/30 loading-logo-breathe">
                <span className="font-display text-4xl font-bold text-primary-foreground">{siteInitial}</span>
              </div>
            </div>

            {/* Orbiting dots */}
            <div className="absolute -inset-6 loading-spin-slow">
              <div className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent/50 shadow-sm shadow-accent/30" />
            </div>
            <div className="absolute -inset-10 loading-spin-orbit">
              <div className="absolute left-1/2 bottom-0 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/40" />
            </div>
          </div>
        </div>

        {/* Brand name with letter stagger */}
        <div
          className={`transition-all duration-700 delay-300 ease-out ${
            phase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            {siteName.split('').map((letter, i) => (
              <span
                key={i}
                className="inline-block loading-letter-float"
                style={{ animationDelay: `${i * 0.08 + 0.5}s` }}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>

        {/* Animated segmented bar */}
        <div
          className={`transition-all duration-500 delay-500 ease-out ${
            phase >= 1 ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
        >
          <div className="flex items-center gap-1">
            <div className="h-[2px] w-12 overflow-hidden rounded-full bg-border">
              <div className="loading-bar-segment h-full w-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ animationDelay: '0s' }} />
            </div>
            <div className="h-[2px] w-24 overflow-hidden rounded-full bg-border">
              <div className="loading-bar h-full w-full rounded-full bg-gradient-to-r from-primary via-accent to-primary" />
            </div>
            <div className="h-[2px] w-12 overflow-hidden rounded-full bg-border">
              <div className="loading-bar-segment h-full w-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>

        {/* Tagline with typing feel */}
        <p
          className={`text-sm tracking-widest uppercase text-muted-foreground transition-all duration-600 delay-700 ease-out ${
            phase >= 1 ? 'translate-y-0 opacity-100 tracking-widest' : 'translate-y-3 opacity-0 tracking-normal'
          }`}
        >
          {siteTagline}
        </p>
      </div>

      {/* Animated corner accents */}
      <div className={`absolute left-6 top-6 transition-all duration-700 delay-400 ${phase >= 1 ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 -translate-x-2 -translate-y-2'}`}>
        <div className="absolute left-0 top-0 h-[2px] w-8 bg-gradient-to-r from-accent/50 to-transparent loading-corner-pulse" />
        <div className="absolute left-0 top-0 h-8 w-[2px] bg-gradient-to-b from-accent/50 to-transparent loading-corner-pulse" />
      </div>
      <div className={`absolute right-6 top-6 transition-all duration-700 delay-500 ${phase >= 1 ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-2 -translate-y-2'}`}>
        <div className="absolute right-0 top-0 h-[2px] w-8 bg-gradient-to-l from-accent/50 to-transparent loading-corner-pulse" />
        <div className="absolute right-0 top-0 h-8 w-[2px] bg-gradient-to-b from-accent/50 to-transparent loading-corner-pulse" />
      </div>
      <div className={`absolute bottom-6 left-6 transition-all duration-700 delay-600 ${phase >= 1 ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 -translate-x-2 translate-y-2'}`}>
        <div className="absolute bottom-0 left-0 h-[2px] w-8 bg-gradient-to-r from-accent/50 to-transparent loading-corner-pulse" />
        <div className="absolute bottom-0 left-0 h-8 w-[2px] bg-gradient-to-t from-accent/50 to-transparent loading-corner-pulse" />
      </div>
      <div className={`absolute bottom-6 right-6 transition-all duration-700 delay-700 ${phase >= 1 ? 'opacity-100 translate-x-0 translate-y-0' : 'opacity-0 translate-x-2 translate-y-2'}`}>
        <div className="absolute bottom-0 right-0 h-[2px] w-8 bg-gradient-to-l from-accent/50 to-transparent loading-corner-pulse" />
        <div className="absolute bottom-0 right-0 h-8 w-[2px] bg-gradient-to-t from-accent/50 to-transparent loading-corner-pulse" />
      </div>
    </div>
  );
}
