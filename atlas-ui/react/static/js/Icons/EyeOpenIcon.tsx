// atlas-ui/react/static/js/Icons/EyeOpenIcon.tsx

import React from "react";

const EyeOpenIcon: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 16 16" className={className}>
      <path fill="currentColor" fillRule="evenodd" d="M1.87 8.515L1.641 8l.229-.515a6.708 6.708 0 0 1 12.26 0l.228.515l-.229.515a6.708 6.708 0 0 1-12.259 0M.5 6.876l-.26.585a1.33 1.33 0 0 0 0 1.079l.26.584a8.208 8.208 0 0 0 15 0l.26-.584a1.33 1.33 0 0 0 0-1.08l-.26-.584a8.208 8.208 0 0 0-15 0M9.5 8a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0M11 8a3 3 0 1 1-6 0a3 3 0 0 1 6 0" clipRule="evenodd" strokeWidth="0.5" stroke="currentColor" />
    </svg>
  );
};

export default EyeOpenIcon;
