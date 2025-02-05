import React, { FC, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';
import remarkGfm from 'remark-gfm';

import { Skeleton } from '@/components/ChatDemo/skeleton';
import { Logo } from '@/components/shared/Logo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Message } from '@/types';

const AnimatedEllipsis: FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block w-2">{dots}</span>;
};

interface AnswerProps {
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
  mode: 'rag' | 'rag_agent';
}

export const Answer: FC<AnswerProps> = ({
  message,
  isStreaming,
  isSearching,
  mode,
}) => {
  const [thinkingText, setThinkingText] = useState('Thinking');
  const [accordionValue, setAccordionValue] = useState('cot');

  useEffect(() => {
    let i = 0;
    const variants = ['Thinking ', 'Thinking.', 'Thinking..', 'Thinking...'];
    const timer = setInterval(() => {
      i = (i + 1) % variants.length;
      setThinkingText(variants[i]);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const processMarkdown = (content: string) => {
    if (!content) return '';
    
    // Unescape Unicode sequences
    content = content.replace(/\\u[\dA-F]{4}/gi, match =>
      String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16))
    );
  
    // Unescape quotes and other special characters
    content = content
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\n/g, '\n');
  
    // Handle table formatting
    if (content.includes('|')) {
      const lines = content.split('\n');
      const processedLines = lines.map((line) => {
        if (line.includes('|')) {
          // Clean up table row formatting
          const cells = line
            .split('|')
            .map((cell) => cell.trim())
            .filter(Boolean);
          if (cells.length === 0) return '';
          // If this is a separator row (contains ---), format it properly
          if (line.includes('---')) {
            return `| ${cells.map(() => ' --- ').join(' | ')} |`;
          }
          return `| ${cells.join(' | ')} |`;
        }
        return line;
      });
      content = processedLines.join('\n');
    }
  
    // Clean up list formatting
    content = content
      .replace(/(\d+\.|\*)\s+/g, '$1 ')
      .replace(/\n{3,}/g, '\n\n');
  
    return content;
  };
  
  // const processMarkdown = (content: string) => {
  //   // Unescape literal newlines to actual newlines
  //   content = content.replace(/\\n/g, '\n');
  
  //   // Your existing processing logic for markdown...
  //   if (content.includes('|')) {
  //     const lines = content.split('\n');
  //     const processedLines = lines.map((line) => {
  //       if (line.includes('|')) {
  //         // Clean up table row formatting
  //         const cells = line
  //           .split('|')
  //           .map((cell) => cell.trim())
  //           .filter(Boolean);
  //         if (cells.length === 0) return '';
  //         // If this is a separator row (contains ---), format it properly
  //         if (line.includes('---')) {
  //           return `| ${cells.map(() => ' --- ').join('|')} |`;
  //         }
  //         return `| ${cells.join(' | ')} |`;
  //       }
  //       return line;
  //     });
  //     content = processedLines.join('\n');
  //   }
  
  //   // Handle other markdown formatting issues
  //   let processed = content;
  //   processed = processed.replace(/(\d+\.|\*)\s+/g, '$1 ');
  //   processed = processed.replace(/\n{3,}/g, '\n\n');
  
  //   return processed;
  // };


  const splitContent = (content: string) => {
    if (!content) return [];

    // Split on double newlines but preserve table structure
    const chunks = content.split(/(?<=\n\n)(?![|])/);
    return chunks.map((chunk) => chunk.trim()).filter(Boolean);
  };
  if (
    message.chainOfThought?.length === 0 &&
    mode === 'rag_agent' &&
    isStreaming &&
    message.role === 'assistant' &&
    !message.content
  ) {
    return (
      <div className="relative mt-4">
        <div className="flex items-center justify-between w-full">
          <Logo width={50} height={50} disableLink />
        </div>
        <div className="absolute top-0 right-0 flex items-center gap-2 mr-2">
          <ClipLoader color="#888" size={24} />
          <span className="text-gray-500 font-medium" style={{ width: '10ch' }}>
            {thinkingText}
          </span>
        </div>
      </div>
    );
  }

  
  const contentChunks = message.content
    ? splitContent(processMarkdown(message.content))
    : [];

    
  console.log('Actual message.content:', JSON.stringify(message.content, null, 2));

  console.log('message.chainOfThought = ', message.chainOfThought);
  return (
    <div className="mt-4">
      {message.chainOfThought && message.chainOfThought.length > 0 && (
        <Accordion
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={setAccordionValue}
          className="w-full"
        >
          <AccordionItem value="cot">
            <AccordionTrigger className="py-2 text-md text-gray-300 hover:no-underline">
              {accordionValue === 'cot' ? 'Hide ' : 'Show '}Chain-of-Thought
            </AccordionTrigger>
            <AccordionContent>
              {message.chainOfThought.map(
                (thought, idx) =>
                  thought?.trim().length > 1 && (
                    <div
                      key={`${idx}-${thought.slice(0, 20)}`}
                      className="bg-zinc-700 p-2 rounded mb-2"
                    >
                      <div className="text-sm text-gray-200 whitespace-pre-wrap">
                        {(thought.startsWith('>')
                          ? thought.slice(1, thought.length)
                          : thought
                        )
                          .trim()
                          .replace('<Thought>', '')
                          .replace('</Thought>', '')}
                      </div>
                    </div>
                  )
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="space-y-4 mt-4">
        {message.content || isStreaming ? (
          <div className="prose prose-sm max-w-full text-zinc-300 bg-zinc-800 p-4 rounded-lg prose-table:text-zinc-300">
            {contentChunks.map((chunk, i) => (
              <div key={i} className="markdown-chunk">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children, ...props }) => (
                      <table
                        className="border-collapse table-auto w-full my-4"
                        {...props}
                      >
                        {children}
                      </table>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-zinc-700" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-zinc-600 px-4 py-2 text-left font-bold"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td
                        className="border border-zinc-600 px-4 py-2"
                        {...props}
                      >
                        {children}
                      </td>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr className="border-b border-zinc-600" {...props}>
                        {children}
                      </tr>
                    ),
                  }}
                >
                  {chunk}
                </Markdown>
              </div>
            ))}
            {isStreaming && <AnimatedEllipsis />}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
            <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
            <Skeleton className="max-w-lg h-4 bg-zinc-200" />
          </div>
        )}
      </div>
    </div>
  );
};
