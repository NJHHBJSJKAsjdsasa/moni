// atlas-ui/react/static/js/Icons/UniverseIcon.jsx

const UniverseIcon = ({ size = 24, color = "currentColor", className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48" className={className} style={{ color }}>
      <rect width="48" height="48" fill="none" />
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="m30 27l-6 17m-6-17l6 17m-6-17h12m11 7l-11-7m11-13L30 27m11-13l-17 3m6 10l-6-10m0-13v13M7 14l17 3m-6 10l6-10m-6 10L7 14m11 13L7 34m34.32-20L24 4L6.68 14v20L24 44l17.32-10z" />
    </svg>
  );
};

export default UniverseIcon;
