import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NestedSelectProps {
  options: Record<string, { value: string; label: string }[]>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const NestedSelect: React.FC<NestedSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
}) => {
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nestedMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (hoveredProvider && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  }, [hoveredProvider]);

  const handleMouseEnter = (provider: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHoveredProvider(provider);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredProvider(null);
    }, 100); // Small delay before hiding the menu
  };

  const renderNestedMenu = () => {
    if (!hoveredProvider) {
      return null;
    }

    return ReactDOM.createPortal(
      <div
        ref={nestedMenuRef}
        style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          zIndex: 9999,
        }}
        className="bg-popover border border-border rounded-md shadow-md"
        onMouseEnter={() => {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
        }}
        onMouseLeave={handleMouseLeave}
      >
        {options[hoveredProvider].map((model) => (
          <div
            key={model.value}
            className="px-2 py-1 cursor-pointer hover:bg-accent"
            onClick={() => onValueChange(model.value)}
          >
            {model.label}
          </div>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger ref={triggerRef}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([provider, models]) => (
            <div
              key={provider}
              onMouseEnter={() => handleMouseEnter(provider)}
              onMouseLeave={handleMouseLeave}
            >
              <SelectItem value={provider}>{provider}</SelectItem>
            </div>
          ))}
        </SelectContent>
      </Select>
      {renderNestedMenu()}
    </>
  );
};

export default NestedSelect;
