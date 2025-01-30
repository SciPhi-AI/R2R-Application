import React, { FC, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';
import remarkGfm from 'remark-gfm';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ChatDemo/skeleton';
import { Logo } from '@/components/shared/Logo';
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
    // For tables, ensure proper formatting
    if (content.includes('|')) {
      const lines = content.split('\n');
      const processedLines = lines.map((line, index) => {
        if (line.includes('|')) {
          // Clean up table row formatting
          const cells = line.split('|')
            .map(cell => cell.trim())
            .filter(Boolean);
          
          if (cells.length === 0) return '';
          
          // If this is a separator row (contains ---), format it properly
          if (line.includes('---')) {
            return `| ${cells.map(() => ' --- ').join('|')} |`;
          }
          
          return `| ${cells.join(' | ')} |`;
        }
        return line;
      });

      content = processedLines.join('\n');
    }

    // Handle other markdown elements
    let processed = content;
    processed = processed.replace(/(\d+\.|\*)\s+/g, '$1 ');
    processed = processed.replace(/\n{3,}/g, '\n\n');
    
    return processed;
  };

  const splitContent = (content: string) => {
    if (!content) return [];
    
    // Split on double newlines but preserve table structure
    const chunks = content.split(/(?<=\n\n)(?![|])/);
    return chunks.map(chunk => chunk.trim()).filter(Boolean);
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

  const contentChunks = message.content ? splitContent(processMarkdown(message.content)) : [];

  return (
    <div className="mt-4">
      {/* {isSearching && (
        <div className="text-sm text-gray-400">
          (Retrieving additional context...)
        </div>
      )} */}

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
              {message.chainOfThought.map((thought, idx) => thought.length >0 && (
                <div key={`${idx}-${thought.slice(0, 20)}`} className="bg-zinc-700 p-2 rounded mb-2">
                  <div className="text-sm text-gray-200 whitespace-pre-wrap">
                    {thought.trim()}
                  </div>
                </div>
              ))}
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
                      <table className="border-collapse table-auto w-full my-4" {...props}>
                        {children}
                      </table>
                    ),
                    thead: ({ children, ...props }) => (
                      <thead className="bg-zinc-700" {...props}>
                        {children}
                      </thead>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="border border-zinc-600 px-4 py-2 text-left font-bold" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-zinc-600 px-4 py-2" {...props}>
                        {children}
                      </td>
                    ),
                    tr: ({ children, ...props }) => (
                      <tr className="border-b border-zinc-600" {...props}>
                        {children}
                      </tr>
                    )
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

// import React, { FC, useEffect, useState } from 'react';
// import Markdown from 'react-markdown';
// import { ClipLoader } from 'react-spinners';

// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import { Skeleton } from '@/components/ChatDemo/skeleton';
// import { Logo } from '@/components/shared/Logo';
// import { Message } from '@/types';
// import remarkGfm from 'remark-gfm';  // Add this import


// const AnimatedEllipsis: FC = () => {
//   const [dots, setDots] = useState('');

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
//     }, 300);
//     return () => clearInterval(interval);
//   }, []);

//   return <span className="inline-block w-2">{dots}</span>;
// };

// interface AnswerProps {
//   message: Message;
//   isStreaming: boolean;
//   isSearching: boolean;
//   mode: 'rag' | 'rag_agent';
// }

// export const Answer: FC<AnswerProps> = ({
//   message,
//   isStreaming,
//   isSearching,
//   mode,
// }) => {
//   const [thinkingText, setThinkingText] = useState('Thinking');
//   const [accordionValue, setAccordionValue] = useState('cot');

//   useEffect(() => {
//     let i = 0;
//     const variants = ['Thinking ', 'Thinking.', 'Thinking..', 'Thinking...'];
//     const timer = setInterval(() => {
//       i = (i + 1) % variants.length;
//       setThinkingText(variants[i]);
//     }, 500);
//     return () => clearInterval(timer);
//   }, []);

//   // // Helper function to process markdown content
//   // const processMarkdown = (content: string) => {
//   //   // Ensure tables have proper line breaks
//   //   let processed = content.replace(/\|\n\|/g, '|\n\n|');
    
//   //   // Ensure lists have proper spacing
//   //   processed = processed.replace(/(\d+\.|\*)\s+/g, '$1 ');
    
//   //   return processed;
//   // };

//   const processMarkdown = (content: string) => {
//     // Handle tables first
//     if (content.includes('|')) {
//       const lines = content.split('\n').map(line => line.trim());
//       const processedLines = lines.map(line => {
//         if (line.includes('|')) {
//           // Clean up table row formatting
//           const cells = line.split('|')
//             .map(cell => cell.trim())
//             .filter(Boolean);
//           return `| ${cells.join(' | ')} |`;
//         }
//         return line;
//       });
  
//       // Add proper line spacing around tables
//       let inTable = false;
//       const withSpacing = processedLines.map((line, i) => {
//         if (line.startsWith('|')) {
//           // If this is the start of a table and we're not already in one
//           if (!inTable) {
//             inTable = true;
//             return `\n${line}`;
//           }
//           inTable = true;
//           return line;
//         } else {
//           if (inTable) {
//             inTable = false;
//             return `\n${line}`;
//           }
//           return line;
//         }
//       });
  
//       content = withSpacing.join('\n');
//     }
  
//     // Handle other markdown elements
//     let processed = content;
    
//     // Ensure lists have proper spacing
//     processed = processed.replace(/(\d+\.|\*)\s+/g, '$1 ');
    
//     // Ensure paragraphs have proper spacing
//     processed = processed.replace(/\n{3,}/g, '\n\n');
    
//     return processed;
//   };
  

  
//   // Split content into chunks that preserve markdown structure
//   const splitContent = (content: string) => {
//     if (!content) return [];
    
//     // Split on double newlines but preserve table structure
//     const chunks = content.split(/(?<=\n\n)(?![|])/);
//     return chunks.map(chunk => chunk.trim()).filter(Boolean);
//   };

//   if (
//     message.chainOfThought?.length === 0 &&
//     mode === 'rag_agent' &&
//     isStreaming &&
//     message.role === 'assistant' &&
//     !message.content
//   ) {
//     return (
//       <div className="relative mt-4">
//         <div className="flex items-center justify-between w-full">
//           <Logo width={50} height={50} disableLink />
//         </div>
//         <div className="absolute top-0 right-0 flex items-center gap-2 mr-2">
//           <ClipLoader color="#888" size={24} />
//           <span className="text-gray-500 font-medium" style={{ width: '10ch' }}>
//             {thinkingText}
//           </span>
//         </div>
//       </div>
//     );
//   }

//   const contentChunks = message.content ? splitContent(processMarkdown(message.content)) : [];

//   return (
//     <div className="mt-4">
//       {isSearching && (
//         <div className="text-sm text-gray-400">
//           (Retrieving additional context...)
//         </div>
//       )}

//       {message.chainOfThought && message.chainOfThought.length > 0 && (
//         <Accordion
//           type="single"
//           collapsible
//           value={accordionValue}
//           onValueChange={setAccordionValue}
//           className="w-full"
//         >
//           <AccordionItem value="cot">
//             <AccordionTrigger className="py-2 text-md text-gray-300 hover:no-underline">
//               {accordionValue === 'cot' ? 'Hide ' : 'Show '}Chain-of-Thought
//             </AccordionTrigger>
//             <AccordionContent>
//               {message.chainOfThought.map((thought, idx) => (
//                 <div key={`${idx}-${thought.slice(0, 20)}`} className="bg-zinc-700 p-2 rounded mb-2">
//                   <div className="text-sm text-gray-200 whitespace-pre-wrap">
//                     {thought}
//                   </div>
//                 </div>
//               ))}
//             </AccordionContent>
//           </AccordionItem>
//         </Accordion>
//       )}

//       <div className="space-y-4 mt-4">
//         {message.content || isStreaming ? (
//           <div className="prose prose-sm max-w-full text-zinc-300 bg-zinc-800 p-4 rounded-lg">
//             {contentChunks.map((chunk, i) => (
//               <div key={i} className="markdown-chunk">
//                 <Markdown>{chunk}</Markdown>
//               </div>
//             ))}
//             {isStreaming && <AnimatedEllipsis />}
//           </div>
//         ) : (
//           <div className="flex flex-col gap-2">
//             <Skeleton className="max-w-lg h-4 bg-zinc-200" />
//             <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
//             <Skeleton className="max-w-lg h-4 bg-zinc-200" />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
// // import React, { FC, useEffect, useState } from 'react';
// // import Markdown from 'react-markdown';
// // import { ClipLoader } from 'react-spinners';

// // import {
// //   Accordion,
// //   AccordionContent,
// //   AccordionItem,
// //   AccordionTrigger,
// // } from '@/components/ui/accordion';
// // import { Skeleton } from '@/components/ChatDemo/skeleton';
// // import { Logo } from '@/components/shared/Logo';
// // import { Message } from '@/types';

// // function formatMarkdown(markdown: string) {
// //   return markdown.trim();
// // }

// // const AnimatedEllipsis: FC = () => {
// //   const [dots, setDots] = useState('');

// //   useEffect(() => {
// //     const interval = setInterval(() => {
// //       setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
// //     }, 300);
// //     return () => clearInterval(interval);
// //   }, []);

// //   return <span className="inline-block w-2">{dots}</span>;
// // };

// // interface AnswerProps {
// //   message: Message;
// //   isStreaming: boolean;
// //   isSearching: boolean;
// //   mode: 'rag' | 'rag_agent';
// // }

// // export const Answer: FC<AnswerProps> = ({
// //   message,
// //   isStreaming,
// //   isSearching,
// //   mode,
// // }) => {
// //   const [thinkingText, setThinkingText] = useState('Thinking');
// //   const [accordionValue, setAccordionValue] = useState('cot');

// //   useEffect(() => {
// //     let i = 0;
// //     const variants = ['Thinking ', 'Thinking.', 'Thinking..', 'Thinking...'];
// //     const timer = setInterval(() => {
// //       i = (i + 1) % variants.length;
// //       setThinkingText(variants[i]);
// //     }, 500);
// //     return () => clearInterval(timer);
// //   }, []);

// //   if (
// //     message.chainOfThought?.length === 0 &&
// //     mode === 'rag_agent' &&
// //     isStreaming &&
// //     message.role === 'assistant' &&
// //     !message.content
// //   ) {
// //     return (
// //       <div className="relative mt-4">
// //         <div className="flex items-center justify-between w-full">
// //           <Logo width={50} height={50} disableLink />
// //         </div>
// //         <div className="absolute top-0 right-0 flex items-center gap-2 mr-2">
// //           <ClipLoader color="#888" size={24} />
// //           <span className="text-gray-500 font-medium" style={{ width: '10ch' }}>
// //             {thinkingText}
// //           </span>
// //         </div>
// //       </div>
// //     );
// //   }

// //   const paragraphs = message.content ? message.content.split('\n\n') : [];

// //   return (
// //     <div className="mt-4">
// //       {isSearching && (
// //         <div className="text-sm text-gray-400">
// //           (Retrieving additional context...)
// //         </div>
// //       )}

// //       {message.chainOfThought && message.chainOfThought.length > 0 && (
// //         <Accordion
// //           type="single"
// //           collapsible
// //           value={accordionValue}
// //           onValueChange={setAccordionValue}
// //           className="w-full"
// //         >
// //           <AccordionItem value="cot">
// //             <AccordionTrigger className="py-2 text-md text-gray-300 hover:no-underline">
// //               {accordionValue === 'cot' ? 'Hide ' : 'Show '}Chain-of-Thought
// //             </AccordionTrigger>
// //             <AccordionContent>
// //               {message.chainOfThought.map((thought, idx) => (
// //                 <div key={`${idx}-${thought.slice(0, 20)}`} className="bg-zinc-700 p-2 rounded mb-2">
// //                   <div className="text-sm text-gray-200 whitespace-pre-wrap">
// //                     {thought}
// //                   </div>
// //                 </div>
// //               ))}
// //             </AccordionContent>
// //           </AccordionItem>
// //         </Accordion>
// //       )}

// //       <div className="space-y-4 mt-4">
// //         {message.content || isStreaming ? (
// //           <div className="prose prose-sm max-w-full text-zinc-300 bg-zinc-800 p-4 rounded-lg">
// //             {message.content ? (
// //               paragraphs.map((para, i) => (
// //                 <Markdown key={i}>{formatMarkdown(para)}</Markdown>
// //               ))
// //             ) : (
// //               <div className="inline-block">
// //                 <AnimatedEllipsis />
// //               </div>
// //             )}
// //             {isStreaming && <AnimatedEllipsis />}
// //           </div>
// //         ) : (
// //           <div className="flex flex-col gap-2">
// //             <Skeleton className="max-w-lg h-4 bg-zinc-200" />
// //             <Skeleton className="max-w-2xl h-4 bg-zinc-200" />
// //             <Skeleton className="max-w-lg h-4 bg-zinc-200" />
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };