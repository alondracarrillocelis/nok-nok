import logoNokNok from '../assets/logo_nok_nok.png';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export default function BrandLogo({
  size = 'md',
  showSubtitle = true,
  className = '',
}: BrandLogoProps) {
  const imgSize =
    size === 'sm'
      ? 'h-8 w-auto'
      : size === 'lg'
        ? 'h-20 w-auto'
        : size === 'xl'
          ? 'h-28 w-auto'
          : 'h-11 w-auto';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img src={logoNokNok} alt="NokNok logo" className={imgSize} />
      {showSubtitle ? <div /> : null}
    </div>
  );
}
