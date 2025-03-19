type InfoIconProps = {
  width?: string;
  height?: string;
  backgroundColor?: string;
  textColor?: string;
  className?: string;
};

export const InfoIcon: React.FC<InfoIconProps> = ({
  width = 'w-6',
  height = 'h-6',
  backgroundColor = 'bg-accent-dark',
  textColor = 'text-primary',
  className = '',
}) => (
  <div
    className={`flex items-center justify-center ${width} ${height} ${backgroundColor} ${textColor} rounded-full ml-2 ${className}`}
  >
    i
  </div>
);
