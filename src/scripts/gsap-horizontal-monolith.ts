import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let initialized = false;

export const initMonolithScroll = (): void => {
  if (initialized || typeof window === 'undefined') return;

  const root = document.querySelector<HTMLElement>('[data-story-root]');
  const track = root?.querySelector<HTMLElement>('[data-story-track]');
  const panels = track?.querySelectorAll<HTMLElement>('[data-story-panel]');
  const frostLayer = root?.querySelector<HTMLElement>('[data-frost-layer]');
  const monolith = root?.querySelector<HTMLElement>('[data-monolith]');

  if (!root || !track || !panels || panels.length < 2) return;

  initialized = true;
  gsap.registerPlugin(ScrollTrigger);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    if (frostLayer) frostLayer.style.opacity = '0.52';
    if (monolith) monolith.style.setProperty('--morph', '0.5');
    return;
  }

  const panelCount = panels.length;
  const endDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

  gsap.to(track, {
    x: () => -endDistance(),
    ease: 'none',
    scrollTrigger: {
      id: 'monolith-horizontal-track',
      trigger: root,
      start: 'top top',
      end: () => `+=${endDistance() + window.innerHeight * 1.2}`,
      scrub: 0.75,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        root.style.setProperty('--story-progress', self.progress.toFixed(4));

        if (frostLayer) {
          const fadeIn = gsap.utils.clamp(0, 1, (self.progress - 0.22) / 0.36);
          frostLayer.style.opacity = String(fadeIn);
          frostLayer.style.transform = `translateY(${(1 - fadeIn) * 18}px)`;
        }

        if (monolith) {
          const phase = gsap.utils.clamp(0, 1, self.progress * (panelCount - 1));
          monolith.style.setProperty('--scroll-morph', phase.toFixed(3));
        }
      }
    }
  });

  if (monolith) {
    const onMove = (event: MouseEvent) => {
      const bounds = monolith.getBoundingClientRect();
      const x = gsap.utils.clamp(0, 1, (event.clientX - bounds.left) / bounds.width);
      const y = gsap.utils.clamp(0, 1, (event.clientY - bounds.top) / bounds.height);
      const mix = gsap.utils.clamp(0, 1, x * 0.7 + (1 - y) * 0.3);
      monolith.style.setProperty('--mx', `${x}`);
      monolith.style.setProperty('--my', `${y}`);
      monolith.style.setProperty('--morph', mix.toFixed(3));
    };

    const onLeave = () => {
      monolith.style.setProperty('--mx', '0.5');
      monolith.style.setProperty('--my', '0.5');
      monolith.style.setProperty('--morph', monolith.style.getPropertyValue('--scroll-morph') || '0.5');
    };

    monolith.addEventListener('mousemove', onMove);
    monolith.addEventListener('mouseleave', onLeave);

    window.addEventListener('pagehide', () => {
      monolith.removeEventListener('mousemove', onMove);
      monolith.removeEventListener('mouseleave', onLeave);
    });
  }
};
