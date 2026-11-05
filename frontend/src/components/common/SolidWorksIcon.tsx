/** Cropped DS mark from the locally bundled SolidWorks wordmark for compact navigation. */
export function SolidWorksIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg">
      <image href="/brand/solidworks-logo.png" width="1600" height="1000" y="-300" />
    </svg>
  );
}
