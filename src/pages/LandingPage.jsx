import PageBackground from '../components/PageBackground';
import usePersonas from '../hooks/usePersonas';

const STEPS = [
  {
    title: 'Present your decision',
    detail: 'Describe any life choice — career, finance, education, or relationships.'
  },
  {
    title: 'Hear six perspectives',
    detail: 'Six AI advisors respond in parallel, each from a completely different lens.'
  },
  {
    title: 'Receive one verdict',
    detail: 'A Moderator synthesizes every view into a single, balanced recommendation.'
  }
];

const LandingPage = ({ onStart }) => {
  const { personas } = usePersonas();

  return (
    <div className="landing">
      <PageBackground />

      <section className="landing-hero">
        <div className="landing-wrap landing-hero__frame landing-frame">
          <p className="landing-hero__eyebrow">AI-powered executive counsel</p>
          <h1 className="landing-project-title">Personal Board of Directors</h1>
          <p className="landing-hero__tagline">
            Six perspectives. One clear path forward.
          </p>
          <p className="landing-hero__lead">
            Making important life decisions is hard — most people either overthink alone
            or get one-sided advice. Personal Board of Directors gives everyone access
            to a panel of six AI advisors, each reasoning from a distinct point of view,
            so you can see the full picture before you act.
          </p>

          <div className="landing-hero__actions">
            <button type="button" className="landing-btn" onClick={onStart}>
              Start Board Session
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      <div className="landing-rule" aria-hidden />

      <section className="landing-block" aria-labelledby="how-heading">
        <div className="landing-wrap landing-frame">
          <p className="landing-overline">Process</p>
          <h2 id="how-heading" className="landing-heading">How it works</h2>

          <ol className="landing-flow">
            {STEPS.map((step, i) => (
              <li key={step.title} className="landing-flow__item">
                <span className="landing-flow__index">{String(i + 1).padStart(2, '0')}</span>
                <div className="landing-flow__content">
                  <h3 className="landing-flow__title">{step.title}</h3>
                  <p className="landing-flow__detail">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="landing-rule" aria-hidden />

      <section className="landing-block" aria-labelledby="board-heading">
        <div className="landing-wrap landing-frame">
          <p className="landing-overline">The panel</p>
          <h2 id="board-heading" className="landing-heading">Your board of advisors</h2>
          <p className="landing-intro">
            Each advisor evaluates your situation through a different professional lens.
          </p>

          <ul className="landing-roster">
            {personas.map((p) => (
              <li key={p.id} className={`landing-roster__row landing-roster__row--${p.id}`}>
                <span className="landing-roster__marker" aria-hidden />
                <div className="landing-roster__primary">
                  <span className="landing-roster__name">The {p.name}</span>
                  <span className="landing-roster__role">{p.title}</span>
                </div>
                <p className="landing-roster__lens">{p.lens}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-close">
        <div className="landing-wrap">
          <div className="landing-close__frame landing-frame">
            <h2 className="landing-close__title">Ready to convene your board?</h2>
            <p className="landing-close__text">
              Present your decision and receive independent counsel from all six advisors,
              followed by a single moderated recommendation.
            </p>

            <div className="landing-close__actions">
              <button type="button" className="landing-btn" onClick={onStart}>
                Start Communicating
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer__frame landing-frame">
          <p>Personal Board of Directors — balanced counsel for life&apos;s biggest decisions</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
