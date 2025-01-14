// NEW: A small utility for truncating text + showing full text on hover
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface HoverTruncatedCellProps {
  text: string;
  maxLength?: number;
  className?: string;
  helpCursor?: boolean;
}

function HoverTruncatedCell({
  text,
  maxLength = 50,
  helpCursor = false,
  className,
}: HoverTruncatedCellProps) {
  // If text is already short, just return it
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  // Otherwise, create a truncated version (e.g. first 50 chars + ...)
  const truncated = text.slice(0, maxLength) + '...';

  return (
    <TooltipProvider>
      <Tooltip>
        {/* The trigger is the truncated text */}
        <TooltipTrigger asChild>
          <span className={`${helpCursor ? 'cursor-help' : ''} ${className}`}>
            {truncated}
          </span>
        </TooltipTrigger>

        {/* Tooltip content shows the full text, allowing user to see everything on hover */}
        <TooltipContent className="max-w-xs break-words whitespace-pre-wrap">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HoverTruncatedCell;
