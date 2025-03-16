import React, { useState, useEffect, useRef } from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ExternalLink, ChevronDown, ChevronUp, Wrench, Bug } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

//=============================================================================
// PART 1: CITATION UTILITIES
//=============================================================================

// Consistent citation regex that matches what the backend produces
// export const CITATION_REGEX = /\[([a-f0-9]{1,12})\]|\b([a-f0-9]{7,8})\b/g;
// export const CITATION_REGEX = /\[([a-zA-Z0-9_-]{1,20})\]|\b([a-zA-Z0-9]{7,8})\b/g;
// Update regex to match server-generated shorthand IDs
// export const CITATION_REGEX = /\[([a-zA-Z0-9_-]{1,20})\]|\[?([a-zA-Z0-9]{7})\]?/g;
export const CITATION_REGEX = /\[([a-f0-9]{7})\]/g;

// Type for citation objects
export interface Citation {
  id: string;
  title?: string;
  snippet?: string;
  link?: string;
  [key: string]: any;
}

export function useCitationMap(citations: Citation[] | undefined) {
  const [citationMap, setCitationMap] = useState<Map<string, Citation>>(new Map());
  
  useEffect(() => {
    if (!citations?.length) {
      console.log('No citations available to map');
      return;
    }
    
    console.log(`Building citation map from ${citations.length} citations`);
    const newCitationMap = new Map();
    
    citations.forEach((citation, index) => {
      // Extract ID - server uses 7-character shorthand IDs
      const id = citation.id || '';
      if (!id) {
        console.warn(`Citation at index ${index} has no ID:`, citation);
        return;
      }
      console.log('raw_citation =' , citation)
      // Create normalized citation object
      const normalizedCitation = {
        id,
        title: citation.title || citation.payload?.title || 'Source',
        snippet: citation.snippet || citation.payload?.snippet || '',
        link: citation.link || citation.payload?.link || '',
        ...citation
      };
      console.log('raw_citation normalized =' , normalizedCitation)

      // Map with ALL possible ID formats for robust lookups
      const mappingKeys = [
        id,                  // Raw ID  
        `[${id}]`,           // [ID]
        id.substring(0, 7),  // 7-char shorthand
        `[${id.substring(0, 7)}]`, // [7-char shorthand]
      ];
      
      // For debugging
      if (index < 3) {
        console.log(`Mapping citation ${index}:`, {
          id,
          keys: mappingKeys.join(', '),
          citation: normalizedCitation
        });
      }
      
      // Add all keys to map
      mappingKeys.forEach(key => {
        newCitationMap.set(key, normalizedCitation);
      });
    });
    
    console.log(`Citation map built with ${newCitationMap.size} entries for ${citations.length} citations`);
    setCitationMap(newCitationMap);
  }, [citations]);
  
  return citationMap;
}

export function findCitation(citationId: string, originalMatch: string, citationMap: Map<string, Citation>): Citation | null {
  console.log(`Looking for citation: '${citationId}', match='${originalMatch}'`);
  
  // Try multiple possible ID formats
  const lookupKeys = [
    originalMatch,    // Raw match as it appears in text
    citationId,       // Just the ID
    `[${citationId}]` // [ID]
  ];
  
  // If ID looks like it might be a full UUID, also try the 7-char version
  if (citationId.length > 7) {
    const shortId = citationId.substring(0, 7);
    lookupKeys.push(shortId, `[${shortId}]`);
  }
  
  // Try each key
  for (const key of lookupKeys) {
    const citation = citationMap.get(key);
    if (citation) {
      console.log(`Found citation with key '${key}':`, citation);
      return citation;
    }
  }
  
  console.warn(`Citation not found for ID='${citationId}', match='${originalMatch}'`);
  return null;
}


export const processCitationsInText = ({ text, citationMap }: { text: string, citationMap: Map<string, Citation> }): React.ReactNode[] => {
  if (typeof text !== 'string' || text.length === 0 || citationMap.size === 0) {
    return [text];
  }
  
  console.log(`Processing citations in text with ${citationMap.size} available citations`);
  console.log(`Text preview: ${text.substring(0, 100)}...`);
  
  let totalMatches = 0;
  let matchesFound = 0;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Reset regex to ensure fresh execution
  const regex = new RegExp(CITATION_REGEX);
  
  // Find all citation matches
  let match;
  while ((match = regex.exec(text)) !== null) {
    totalMatches++;
    
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Get citation ID from either capture group
    const citationId = match[1] || match[2];
    const originalMatch = match[0];
    
    console.log(`Found citation reference: '${originalMatch}', ID='${citationId}'`);
    
    // Look up the citation
    const citation = findCitation(citationId, originalMatch, citationMap);
    
    if (citation) {
      matchesFound++;
      parts.push(
        <CitationPopover 
          key={`citation-${match.index}`}
          citation={citation}
          citationId={citationId}
          originalMatch={originalMatch}
        />
      );
    } else {
      // Keep original text if no citation found
      parts.push(originalMatch);
    }
    
    lastIndex = match.index + originalMatch.length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  console.log(`Citation processing stats: Found ${matchesFound}/${totalMatches} citations in text`);
  
  return parts;
};

// Get a unique array of citations
export function getUniqueCitations(citations: Citation[] | undefined): Citation[] {
  if (!citations?.length) return [];
  
  return citations.reduce((acc: Citation[], citation: Citation) => {
    if (!acc.some(c => c.id === citation.id)) {
      acc.push(citation);
    }
    return acc;
  }, []);
}

//=============================================================================
// PART 2: CITATION COMPONENTS
//=============================================================================

interface CitationPopoverProps {
  citation: Citation;
  citationId: string;
  originalMatch: string;
}

// Component for individual citation popovers
export const CitationPopover: React.FC<CitationPopoverProps> = ({
  citation,
  citationId,
  originalMatch
}) => {
  const displayId = citationId.length > 7 ? citationId.substring(0, 7) : citationId;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <span className="inline-flex items-center text-blue-400 cursor-pointer hover:underline">
          {originalMatch.startsWith('[') ? `[${displayId}]` : displayId}
        </span>
      </PopoverTrigger>
      <PopoverContent className="max-w-sm bg-zinc-800 border-zinc-700 p-3 text-sm">
        <div className="font-semibold text-white mb-1">{citation.title || 'Source'}</div>
        {citation.link && (
          <a 
            href={citation.link} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline text-xs flex items-center mb-2"
          >
            <ExternalLink className=" mr-1 h-3 w-3" /> View source
          </a>
        )}
        {citation.snippet && (
          <div className="text-zinc-300 text-xs mt-1 border-t border-zinc-700 pt-2">{citation.snippet}</div>
        )}
      </PopoverContent>
    </Popover>
  );
};

//=============================================================================
// PART 3: MARKDOWN COMPONENTS
//=============================================================================

// Component for rendering markdown with citation processing
export const MarkdownWithCitations: React.FC<{
  content: string,
  citationMap: Map<string, Citation>
}> = ({
  content,
  citationMap
}) => {
  // Create markdown components with citation processing
  const markdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-white text-2xl font-bold my-3" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-white text-xl font-bold my-2" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-white text-lg font-bold my-2" {...props} />,
    h4: ({node, ...props}: any) => <h4 className="text-white text-base font-bold my-1" {...props} />,
    h5: ({node, ...props}: any) => <h5 className="text-white text-sm font-bold my-1" {...props} />,
    h6: ({node, ...props}: any) => <h6 className="text-white text-xs font-bold my-1" {...props} />,
    
    // Process citations in paragraphs
    p: ({node, children, ...props}: any) => {
      if (typeof children === 'string') {
        const processedChildren = processCitationsInText({
          text: children,
          citationMap
        });
        return <p className="text-white my-1.5" {...props}>{processedChildren}</p>;
      }
      return <p className="text-white my-1.5" {...props}>{children}</p>;
    },
    
    // Process citations in list items
    li: ({node, children, ...props}: any) => {
      if (typeof children === 'string') {
        const processedChildren = processCitationsInText({
          text: children,
          citationMap
        });
        return <li className="text-white my-0.5" {...props}>{processedChildren}</li>;
      }
      return <li className="text-white my-0.5" {...props}>{children}</li>;
    },
    
    // Other markdown components without citation processing
    a: ({node, ...props}: any) => <a className="text-blue-400 hover:underline" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 my-1.5" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 my-1.5" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-zinc-500 pl-4 my-1.5 text-zinc-300" {...props} />,
    code: ({node, inline, ...props}: any) => 
      inline 
        ? <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-200 text-sm" {...props} />
        : <code className="block bg-zinc-900 p-2 rounded text-zinc-200 text-sm overflow-x-auto" {...props} />,
    pre: ({node, ...props}: any) => <pre className="bg-zinc-900 p-3 rounded my-1.5 overflow-x-auto" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
    em: ({node, ...props}: any) => <em className="italic text-white" {...props} />,
    table: ({node, ...props}: any) => <table className="border-collapse border border-zinc-700 my-2 w-full" {...props} />,
    thead: ({node, ...props}: any) => <thead className="bg-zinc-900" {...props} />,
    tbody: ({node, ...props}: any) => <tbody className="bg-zinc-800" {...props} />,
    tr: ({node, ...props}: any) => <tr className="border-b border-zinc-700" {...props} />,
    th: ({node, ...props}: any) => <th className="border border-zinc-700 p-2 text-left" {...props} />,
    td: ({node, ...props}: any) => <td className="border border-zinc-700 p-2" {...props} />,
    img: ({node, ...props}: any) => <img className="max-w-full h-auto my-2 rounded" {...props} />
  };

  return (
    <ReactMarkdown components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

// Special component for rendering thinking text (chain of thought)
export const ThinkingMarkdown: React.FC<{content: string}> = ({ content }) => {
  const thinkingComponents = {
    p: ({node, ...props}: any) => <p className="text-zinc-400 my-1" {...props} />,
    ul: ({node, ...props}: any) => <ul className="list-disc pl-6 my-1" {...props} />,
    ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 my-1" {...props} />,
    li: ({node, ...props}: any) => <li className="text-zinc-400 my-0.5" {...props} />,
    blockquote: ({node, ...props}: any) => <blockquote className="border-l-4 border-zinc-500 pl-4 my-1 text-zinc-500" {...props} />,
    code: ({node, inline, ...props}: any) => 
      inline 
        ? <code className="bg-zinc-900 px-1 py-0.5 rounded text-zinc-300 text-sm" {...props} />
        : <code className="block bg-zinc-900 p-2 rounded text-zinc-300 text-sm overflow-x-auto" {...props} />,
    pre: ({node, ...props}: any) => <pre className="bg-zinc-900 p-3 rounded my-1 overflow-x-auto" {...props} />,
  };

  return (
    <ReactMarkdown components={thinkingComponents}>
      {content}
    </ReactMarkdown>
  );
};

// Format thinking text for better display
export function formatThinkingText(text: string): string {
  if (!text) return '';
  
  // Add proper spacing after periods followed by capital letters
  let formattedText = text.replace(/\.([A-Z])/g, '. $1');
  
  // Add newlines before headings
  formattedText = formattedText.replace(/\.(\s*)#/g, '.\n\n#');
  
  return formattedText;
}

//=============================================================================
// PART 4: TOOL CALL COMPONENTS
//=============================================================================

// Types for tool calls and results
export interface ToolCall {
  id?: string;
  name: string;
  arguments: string | Record<string, any>;
}

export interface ToolResult {
  tool_call_id: string;
  content: any;
}

interface ToolCallsSectionProps {
  toolCalls: ToolCall[];
  toolResults?: ToolResult[];
  showTools: boolean;
  setShowTools: (show: boolean) => void;
}

export const ToolCallsSection: React.FC<ToolCallsSectionProps> = ({
  toolCalls,
  toolResults,
  showTools,
  setShowTools
}) => {
  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <Collapsible 
      open={showTools} 
      onOpenChange={setShowTools}
      className="mb-4 border border-zinc-700 rounded-md"
    >
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex w-full justify-between p-2 text-sm pl-4"
        >
          <span className="flex items-center">
            <Wrench className="-ml-2 mr-2 h-4 w-4" />
            {toolCalls.length} Tool Call{toolCalls.length !== 1 ? 's' : ''}
          </span>
          {showTools ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 py-2">
        <div className="space-y-3">
          {toolCalls.map((tool, index) => (
            <div key={tool.id || index} className="text-sm bg-zinc-900 rounded-md p-3">
              <div className="font-semibold text-green-400 mb-1">{tool.name}</div>
              <div className="bg-zinc-950 rounded p-2 text-xs font-mono overflow-x-auto">
                {typeof tool.arguments === 'string' 
                  ? tool.arguments 
                  : JSON.stringify(tool.arguments, null, 2)}
              </div>
              
              {/* Show tool result if available */}
              {toolResults && tool.id && toolResults.some(result => result.tool_call_id === tool.id) && (
                <div className="mt-2">
                  <div className="font-semibold text-blue-400 text-xs mt-1">Result:</div>
                  <div className="bg-zinc-950 rounded p-2 text-xs font-mono overflow-x-auto mt-1">
                    {JSON.stringify(
                      toolResults.find(result => result.tool_call_id === tool.id)?.content,
                      null, 2
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

//=============================================================================
// PART 5: MAIN ANSWER COMPONENT
//=============================================================================

// Interface for the message object
export interface Message {
  content?: string;
  role: string;
  citations?: Citation[];
  chainOfThought?: string[];
  toolCalls?: any[];
  toolResults?: any[];
  [key: string]: any;
}

interface AnswerProps {
  message: Message;
  isStreaming: boolean;
  isSearching: boolean;
  mode: 'rag' | 'rag_agent';
}

export const Answer: React.FC<AnswerProps> = ({
  message,
  isStreaming,
  isSearching,
  mode,
}) => {
  // UI state
  const [showThinking, setShowThinking] = useState(false);
  const [showCitations, setShowCitations] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  
  // Content state
  const [rawContent, setRawContent] = useState<string>(message.content || '');
  
  // Process citations using our custom hook
  const citationMap = useCitationMap(message.citations);
  const uniqueCitations = getUniqueCitations(message.citations);
  
  // Update content when message changes
  useEffect(() => {
    if (message.content !== undefined) {
      setRawContent(message.content);
    }
  }, [message.content]);
  
  // Format thinking text for display
  const formattedThinking = message.chainOfThought ? 
    message.chainOfThought.map(formatThinkingText).join('\n') : '';

  return (
    <div className="rounded-lg p-4 w-full bg-zinc-800">
      {/* Header */}
      <div className="font-semibold text-white mb-2 flex items-center justify-between">
        <div className="flex items-center">
          Assistant {isStreaming && isSearching && <Loader2 className="animate-spin ml-2 h-4 w-4" />}
        </div>
{/*         
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0" 
          onClick={() => setDebugMode(!debugMode)}
          title="Toggle Debug Mode"
        >
          <Bug className="h-4 w-4 text-zinc-400" />
        </Button> */}
      </div>

      {debugMode && (
        <div className="mb-4 p-2 border border-amber-500 bg-zinc-900 text-xs rounded">
          <h4 className="font-bold text-amber-400">Citation Debug</h4>
          <div>Citations: {uniqueCitations.length}</div>
          <div>Citation map size: {citationMap.size}</div>
          <div>Content length: {rawContent.length}</div>
          <button 
            onClick={() => {
              // Find the first 500 chars of content and log all citation matches
              const sample = rawContent.substring(0, 500);
              const regex = new RegExp(CITATION_REGEX);
              const matches = Array.from(sample.matchAll(regex));
              console.log('Citation matches in content sample:', matches);
              console.log('Citation map keys:', Array.from(citationMap.keys()).slice(0, 20));
              console.log('Citations:', uniqueCitations);
            }}
            className="bg-amber-600 px-2 py-1 rounded mt-1 text-white text-xs"
          >
            Analyze Citations
          </button>
        </div>
      )}
      <div className="prose prose-invert max-w-full">
        {/* Thinking Section */}
        {message.chainOfThought && message.chainOfThought.length > 0 && (
          <Collapsible 
            open={showThinking} 
            onOpenChange={setShowThinking}
            className="mb-4 border border-zinc-700 rounded-md"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex w-full justify-between p-2 text-sm pl-4"
              >
                <span className="-ml-1">View Assistant's Thinking</span>
                {showThinking ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2">
              <div className="text-zinc-400 text-sm">
                <ThinkingMarkdown content={formattedThinking} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tool Calls Section */}
        <ToolCallsSection 
          toolCalls={message.toolCalls || []}
          toolResults={message.toolResults}
          showTools={showTools}
          setShowTools={setShowTools}
        />

        {/* Main Content */}
        <div className="markdown-content px-1">
          {rawContent ? (
            <MarkdownWithCitations 
              content={rawContent} 
              citationMap={citationMap} 
            />
          ) : (
            <p className="text-white">
              {isSearching ? 'Searching...' : 'Thinking...'}
            </p>
          )}
        </div>

        {/* Citations Section */}
        {uniqueCitations.length > 0 && (
          <Collapsible 
            open={showCitations} 
            onOpenChange={setShowCitations}
            className="mt-4 border border-zinc-700 rounded-md"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex w-full justify-between p-2 text-sm pl-4"
              >
                <span className="flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {uniqueCitations.length} Citation{uniqueCitations.length !== 1 ? 's' : ''}
                </span>
                {showCitations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 py-2">
              <div className="space-y-2">
                {uniqueCitations.map((citation, index) => (
                  <div key={citation.id || index} className="text-sm border-b border-zinc-700 pb-2 last:border-0">
                    <div className="font-semibold">{citation.title || 'Source'}</div>
                    {citation.link && (
                      <a 
                        href={citation.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs flex items-center"
                      >
                        {citation.link} <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    )}
                    {citation.snippet && (
                      <div className="text-zinc-400 text-xs mt-1">{citation.snippet}</div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};