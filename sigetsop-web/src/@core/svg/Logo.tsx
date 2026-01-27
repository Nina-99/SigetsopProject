import logoUrl from "../../icons/Logo.svg";

interface LogoProps {
  logoSize?: string | number;
}

export function Logo({ logoSize }: LogoProps) {
  const size = typeof logoSize === "number" ? `${logoSize}px` : logoSize;
  return (
    <img
      src={logoUrl}
      alt="Logo"
      style={{ width: size, height: size }}
    />
  );
}

export default Logo;
