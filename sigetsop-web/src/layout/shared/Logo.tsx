import styled from "@emotion/styled";

import SigetsopLogo from "../../@core/svg/Logo";
import { themeConfig } from "../../configs";
import { useTheme } from "../../@core";

interface LogoProps {
  fontSize?: string | number;
  logoSize?: string | number;
  showText?: boolean;
}

const LogoText = styled.span<{ fontSize?: string | number }>`
  font-size: ${({ fontSize }) =>
    typeof fontSize === "number" ? `${fontSize}px` : fontSize || "inherit"};
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.15px;
  text-transform: uppercase;
  margin-inline-start: 10px;
`;

const Logo = ({ fontSize, logoSize, showText }: LogoProps) => {
  const { theme } = useTheme();
  return (
    <div className="flex items-center min-bs-[24px]">
      <SigetsopLogo logoSize={logoSize} />
      {/* <LogoText color={color}>{themeConfig.templateName}</LogoText> */}
      {showText && (
        <LogoText
          fontSize={fontSize}
          // style={{ color: theme === "dark" ? "white" : "#000000" }}
          style={{ color: theme === "dark" ? "white" : "#d0d5dd" }}
        >
          {themeConfig.templateName}
        </LogoText>
      )}
    </div>
  );
};

export default Logo;
