/**
 * MediaOverlay — shows an icon badge on top-right of a grid cell
 * to indicate Carousel (stacked layers) or Reel (play button).
 */
export default function MediaOverlay({ type }) {
  if (type === 'image') return null;

  return (
    <div className="absolute top-1.5 right-1.5 z-10 drop-shadow-sm">
      {type === 'carousel' ? <CarouselIcon /> : <ReelIcon />}
    </div>
  );
}

function CarouselIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Carousel"
    >
      <rect x="2" y="6" width="14" height="14" rx="2" fill="white" />
      <rect
        x="6"
        y="2"
        width="14"
        height="14"
        rx="2"
        stroke="white"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

function ReelIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Reel"
    >
      <polygon points="5,3 19,12 5,21" fill="white" />
    </svg>
  );
}
