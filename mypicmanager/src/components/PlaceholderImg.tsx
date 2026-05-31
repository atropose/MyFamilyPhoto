import { PALETTES } from '../lib/mockData';

interface Props {
  variant: number;
  pattern: string;
  label: string;
  isVideo?: boolean;
  className?: string;
}

export default function PlaceholderImg({ variant, pattern, label, isVideo = false, className = 'thumb-img' }: Props) {
  const [stripe, bg, accent] = PALETTES[variant % PALETTES.length];
  const patId = `p-${variant}-${pattern}-${Math.abs(label.charCodeAt(0) * 31 + variant * 17)}`;

  let patternEl: React.ReactNode;
  if (pattern === 'diag') {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(45)">
        <rect width="14" height="14" fill={bg} />
        <rect width="7" height="14" fill={stripe} />
      </pattern>
    );
  } else if (pattern === 'horiz') {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill={bg} />
        <rect width="12" height="5" fill={stripe} />
      </pattern>
    );
  } else if (pattern === 'vert') {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="12" height="12">
        <rect width="12" height="12" fill={bg} />
        <rect width="5" height="12" fill={stripe} />
      </pattern>
    );
  } else if (pattern === 'checks') {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="18" height="18">
        <rect width="18" height="18" fill={bg} />
        <rect width="9" height="9" fill={stripe} />
        <rect x="9" y="9" width="9" height="9" fill={stripe} />
      </pattern>
    );
  } else if (pattern === 'rings') {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="40" height="40">
        <rect width="40" height="40" fill={bg} />
        <circle cx="20" cy="20" r="16" fill="none" stroke={stripe} strokeWidth="3" />
        <circle cx="20" cy="20" r="8" fill="none" stroke={stripe} strokeWidth="3" />
      </pattern>
    );
  } else {
    patternEl = (
      <pattern id={patId} patternUnits="userSpaceOnUse" width="14" height="14">
        <rect width="14" height="14" fill={bg} />
        <circle cx="7" cy="7" r="3" fill={stripe} />
      </pattern>
    );
  }

  return (
    <svg className={className} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>{patternEl}</defs>
      <rect width="100" height="100" fill={`url(#${patId})`} />
      {isVideo && <rect width="100" height="100" fill="rgba(0,0,0,0.15)" />}
      <text
        x="50" y="54"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="7"
        fontWeight="700"
        fill={accent}
        letterSpacing="0.12em"
        opacity="0.85"
      >{label}</text>
    </svg>
  );
}
