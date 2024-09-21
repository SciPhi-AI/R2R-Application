import React from 'react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  id: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  id,
}) => {
  const handleValueChange = (clickedValue: string) => {
    const newValue = value.includes(clickedValue)
      ? value.filter((v) => v !== clickedValue)
      : [...value, clickedValue];
    onChange(newValue);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button shape="outline" id={id} className="w-full justify-start">
          {value.length === 0
            ? 'Select collections'
            : `${value.length} collection${value.length !== 1 ? 's' : ''} selected`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <div className="max-h-[300px] overflow-y-auto p-4">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 mb-2"
            >
              <Checkbox
                id={`checkbox-${option.value}`}
                checked={value.includes(option.value)}
                onCheckedChange={() => handleValueChange(option.value)}
              />
              <Label
                htmlFor={`checkbox-${option.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
