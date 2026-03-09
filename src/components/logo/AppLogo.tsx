import React from "react";

interface AppLogoProps {
  size?: string; // Ej: h-8, h-10, h-12
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({
  size = "h-10",
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Logo Light */}
      <img
        src="/images/logo/logo50A-white.svg"
        alt="Logo"
        className={`${size} w-auto object-contain transition-opacity duration-300 ease-in-out dark:opacity-0 opacity-100`}
      />

      {/* Logo Dark */}
      <img
        src="/images/logo/logo50A-dark.svg"
        alt="Logo"
        className={`${size} w-auto object-contain absolute top-0 left-0 transition-opacity duration-300 ease-in-out opacity-0 dark:opacity-100`}
      />
    </div>
  );
};

export default AppLogo;