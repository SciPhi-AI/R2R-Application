"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

const SingleSwitch = ({ id, initialChecked, onChange, label, tooltipText }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);

  useEffect(() => {
    setIsChecked(initialChecked);
  }, [initialChecked]);

  const handleSwitchChange = (checked) => {
    setIsChecked(checked);
    onChange(id, checked);
  };

  return (
    <div className="flex justify-between items-center mt-4">
      <TooltipProvider>
        <Tooltip>
            <TooltipTrigger>
                {label && <label htmlFor={id} className="mr-2 text-sm font-medium text-zinc-300">{label}</label>}
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>

        <Switch id={id} checked={isChecked} onCheckedChange={handleSwitchChange} />
    </div>
  );
};

export default SingleSwitch;