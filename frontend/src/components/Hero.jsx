import { HERO_PARTICLES, STAT_CARDS, SvgIcon, cx } from "./shared.jsx";

export default function Hero({ onStart }) {
  return (
    <main className="hero-page">
      <section className="hero-section">
        <div className="hero-particles" aria-hidden="true">
          {HERO_PARTICLES.map((particle, idx) => (
            <div
              key={`${particle.cls}-${idx}`}
              className={cx("hero-particle", particle.cls)}
              style={{
                top: particle.top,
                right: particle.right,
                bottom: particle.bottom,
                left: particle.left,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
                animationDelay: particle.delay,
                "--particle-blur": particle.blur,
              }}
            />
          ))}
        </div>
        <div className="hero-copy">
          <p className="eyebrow">AI creative operations</p>
          <h1>Create Stunning Vehicle Posters with AI</h1>
          <p className="hero-subtitle">Generate localized marketing creatives for every platform in seconds.</p>
          <div className="hero-actions">
            <button type="button" className="primary-cta" onClick={onStart}>Image Generation</button>
            <button type="button" className="secondary-cta" disabled>Video Generation <span>Coming Soon</span></button>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Hero Studio stats">
        {STAT_CARDS.map(stat => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-icon"><SvgIcon icon={stat.icon} size={22} /></div>
            <div>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}


