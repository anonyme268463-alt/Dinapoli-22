(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealObserver = reduced ? null : new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); } });
  }, { threshold: .12 });

  document.querySelectorAll('.order-mode,.section-heading,.restaurant>div,footer').forEach((node) => {
    node.classList.add('reveal');
    if (revealObserver) revealObserver.observe(node); else node.classList.add('visible');
  });

  if (!reduced) document.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--mx', `${event.clientX / innerWidth * 100}%`);
    document.documentElement.style.setProperty('--my', `${event.clientY / innerHeight * 100}%`);
  }, { passive: true });

  window.animateProductCards = () => {
    document.querySelectorAll('.product').forEach((card, index) => {
      card.style.setProperty('--delay', `${Math.min(index, 12) * 45}ms`);
      requestAnimationFrame(() => card.classList.add('in-view'));
    });
  };

  window.celebrateOrder = () => {
    if (reduced) return;
    const colors = ['#e43c2f','#f5c451','#56bd80','#ffffff'];
    for (let i = 0; i < 42; i += 1) {
      const bit = document.createElement('i');
      bit.className = 'confetti';
      bit.style.left = `${Math.random() * 100}%`;
      bit.style.background = colors[i % colors.length];
      bit.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
      bit.style.setProperty('--fall', `${1.8 + Math.random() * 1.8}s`);
      bit.style.animationDelay = `${Math.random() * .4}s`;
      document.body.appendChild(bit);
      setTimeout(() => bit.remove(), 4000);
    }
  };

  setTimeout(() => window.animateProductCards?.(), 30);
})();
