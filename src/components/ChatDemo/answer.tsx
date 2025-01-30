import React, { FC, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { ClipLoader } from 'react-spinners';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ChatDemo/skeleton';
import { Logo } from '@/components/shared/Logo';
import { Message } from '@/types';

function formatMarkdown(markdown: string) {
  return markdown.trim();
}

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

  const paragraphs = message.content ? message.content.split('\n\n') : [];

  return (
    <div className="mt-4">
      {isSearching && (
        <div className="text-sm text-gray-400">
          (Retrieving additional context...)
        </div>
      )}

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
              {message.chainOfThought.map((thought, idx) => (
                <div key={`${idx}-${thought.slice(0, 20)}`} className="bg-zinc-700 p-2 rounded mb-2">
                  <div className="text-sm text-gray-200 whitespace-pre-wrap">
                    {thought}
                  </div>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <div className="space-y-4 mt-4">
        {message.content || isStreaming ? (
          <div className="prose prose-sm max-w-full text-zinc-300 bg-zinc-800 p-4 rounded-lg">
            {message.content ? (
              paragraphs.map((para, i) => (
                <Markdown key={i}>{formatMarkdown(para)}</Markdown>
              ))
            ) : (
              <div className="inline-block">
                <AnimatedEllipsis />
              </div>
            )}
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