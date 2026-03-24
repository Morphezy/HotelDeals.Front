import { useState } from "react";

export function SearchButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isAuthenticated] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full px-8 py-5 text-lg font-semibold rounded-lg bg-[#005254] text-white hover:bg-[#003536] transition-colors"
    >
      {isHovered && !isAuthenticated ? "Sign in required" : "Search"}
    </button>
  );
}
