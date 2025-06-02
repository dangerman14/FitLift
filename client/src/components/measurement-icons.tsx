// Custom SVG icons for body measurements that actually represent the body parts

export const ChestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C8.5 2 6 4.5 6 8v4c0 .5.5 1 1 1h10c.5 0 1-.5 1-1V8c0-3.5-2.5-6-6-6zm-4 8V8c0-2.2 1.8-4 4-4s4 1.8 4 4v2H8z" 
          opacity="0.7"/>
    <circle cx="9" cy="7" r="1" />
    <circle cx="15" cy="7" r="1" />
    <path d="M7 12v6c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2v-6H7z" opacity="0.5"/>
  </svg>
);

export const ShoulderIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2c-2 0-4 1-5 3l-3 3c-.5.5-.5 1.5 0 2l3 3c1 2 3 3 5 3s4-1 5-3l3-3c.5-.5.5-1.5 0-2l-3-3c-1-2-3-3-5-3z" 
          opacity="0.7"/>
    <circle cx="6" cy="8" r="2" opacity="0.8"/>
    <circle cx="18" cy="8" r="2" opacity="0.8"/>
  </svg>
);

export const WaistIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8 6h8c1.1 0 2 .9 2 2v2c0 .5-.2 1-.6 1.4L16 13l1.4 1.6c.4.4.6.9.6 1.4v2c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-2c0-.5.2-1 .6-1.4L8 13l-1.4-1.6C6.2 11 6 10.5 6 10V8c0-1.1.9-2 2-2z" 
          opacity="0.7"/>
    <path d="M9 10h6l-1 2H10l-1-2z" opacity="0.9"/>
  </svg>
);

export const AbdomenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <ellipse cx="12" cy="14" rx="6" ry="8" opacity="0.7"/>
    <rect x="10" y="8" width="4" height="2" rx="1" opacity="0.8"/>
    <rect x="10" y="12" width="4" height="2" rx="1" opacity="0.8"/>
    <rect x="10" y="16" width="4" height="2" rx="1" opacity="0.8"/>
  </svg>
);

export const HipIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M7 10h10c1.1 0 2 .9 2 2v4c0 2.2-1.8 4-4 4h-6c-2.2 0-4-1.8-4-4v-4c0-1.1.9-2 2-2z" 
          opacity="0.7"/>
    <circle cx="9" cy="16" r="1.5" opacity="0.9"/>
    <circle cx="15" cy="16" r="1.5" opacity="0.9"/>
  </svg>
);

export const BicepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M8 4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H8z" 
          opacity="0.5"/>
    <ellipse cx="9" cy="10" rx="3" ry="4" opacity="0.8"/>
    <circle cx="9" cy="8" r="2" opacity="0.9"/>
  </svg>
);

export const ThighIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M9 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H9z" 
          opacity="0.5"/>
    <ellipse cx="12" cy="12" rx="4" ry="8" opacity="0.7"/>
    <ellipse cx="12" cy="10" rx="3" ry="3" opacity="0.8"/>
  </svg>
);

export const BodyFatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C8.5 2 6 4.5 6 8v8c0 3.5 2.5 6 6 6s6-2.5 6-6V8c0-3.5-2.5-6-6-6z" 
          opacity="0.6"/>
    <circle cx="12" cy="12" r="6" opacity="0.4"/>
    <circle cx="12" cy="12" r="3" opacity="0.6"/>
    <text x="12" y="14" textAnchor="middle" fontSize="8" opacity="0.9">%</text>
  </svg>
);