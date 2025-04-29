import React from 'react';

interface OverlayWrapperProps {
  children: React.ReactNode;
  message?: string;
}

const OverlayWrapper: React.FC<OverlayWrapperProps> = ({
  children,
  message = 'More data needs to be collected before this insight is available 🚀',
}) => {
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <p className="text-primary text-center font-semibold px-4 text-xl">
          {message}
        </p>
      </div>
    </div>
  );
};

export default OverlayWrapper;
