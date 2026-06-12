const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M2.5 6.5L8 2l5.5 4.5V13a1 1 0 01-1 1h-3.5v-4H7v4H3.5a1 1 0 01-1-1V6.5z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const HomeLink = ({ onClick, variant = 'header' }) => (
  <button
    type="button"
    className={`home-link home-link--${variant}`}
    onClick={onClick}
  >
    <HomeIcon />
    <span>Back to Home</span>
  </button>
);

export default HomeLink;
