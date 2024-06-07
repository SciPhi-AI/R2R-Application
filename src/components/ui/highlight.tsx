import React from 'react';

interface HighlightProps {
  color: string; // Accept any string
  textColor: string;
  children: React.ReactNode;
}

const Highlight: React.FC<HighlightProps> = ({
  color,
  textColor,
  children,
}) => {
  return (
    <span className={`px-2 py-1 ${color} rounded ${textColor}`}>
      {children}
    </span>
  );
};

export default Highlight;
