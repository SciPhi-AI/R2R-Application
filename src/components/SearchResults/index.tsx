import React, { FC, useState } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VectorSearchResult, KGSearchResult } from '@/types';

const VectorSearchResultItem: FC<{
  source: VectorSearchResult;
  index: number;
  onOpenPdfPreview: (documentId: string, page?: number) => void;
}> = ({ source, index, onOpenPdfPreview }) => {
  const { document_id, metadata, text, score, extraction_id } = source;

  const isPdf =
    metadata.document_type === 'pdf' ||
    metadata.unstructured_filetype === 'application/pdf';
  const pageNumber = metadata.unstructured_page_number;

  const handleOpenPdfPreview = () => {
    console.log('handleOpenPdfPreview');
    console.log('document_id = ', document_id);
    if (document_id) {
      onOpenPdfPreview(document_id, pageNumber);
    }
  };

  return (
    <div className="p-4 mb-2 flex items-center w-full">
      <div className="flex-grow mr-4">
        <div className="flex items-center mb-1">
          <h3 className="text-sm font-medium mr-2 overflow-hidden overflow-ellipsis">
            [{index}] {metadata.title}
          </h3>
          <div className="flex-grow"></div>
          <span className="text-xs ml-2 whitespace-nowrap text-zinc-500">
            Similarity Score: {score.toFixed(3)}
          </span>
        </div>

        <p className="text-xs text-wrap break-words">{text}</p>
        <p className="text-xs pt-4 text-zinc-500">
          Document ID: {document_id}
          <br />
          Extraction ID: {extraction_id}
        </p>
      </div>
    </div>
  );
};

const KGSearchResultItem: FC<{ entity: KGSearchResult; index: number }> = ({
  entity,
  index,
}) => {
  const { content, metadata } = entity;
  const findings = metadata?.findings;

  return (
    <div className="p-4 mb-2 flex flex-col w-full">
      <div className="flex-grow">
        {/* Title */}
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium overflow-hidden overflow-ellipsis">
            [{index}] {content.name}
          </h3>
        </div>
        <h4 className="text-sm font-semibold mb-1">Summary:</h4>

        {/* Description */}
        {content.description && (
          <p className="text-xs break-words mb-2">{content.description}</p>
        )}

        {/* Findings */}
        {findings && findings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Findings:</h4>
            <ul className="list-disc list-inside text-xs pl-4">
              {findings.map((finding: string, idx: number) => (
                <li key={idx} className="mb-1">
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const KGCommunitiesSearchResultItem: FC<{
  entity: KGSearchResult;
  index: number;
}> = ({ entity, index }) => {
  const { content } = entity;

  return (
    <div className="p-4 mb-2 flex flex-col w-full">
      <div className="flex-grow">
        {/* Title */}
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium overflow-hidden overflow-ellipsis">
            [{index}] {content.name}
          </h3>
        </div>

        {/* Summary */}
        <h4 className="text-sm font-semibold mb-1">Summary:</h4>
        <p className="text-xs break-words mb-2">{content.summary}</p>

        {/* Rating */}
        <h4 className="text-sm font-semibold mb-1">Impact Rating:</h4>
        <p className="text-xs mb-2">{content.rating} / 10</p>

        {/* Rating Explanation */}
        <h4 className="text-sm font-semibold mb-1">Rating Explanation:</h4>
        <p className="text-xs break-words mb-2">{content.rating_explanation}</p>

        {/* Findings */}
        {content.findings && content.findings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-1">Key Findings:</h4>
            <ul className="list-disc list-inside text-xs pl-4">
              {content.findings.map((finding: string, idx: number) => (
                <li key={idx} className="mb-1">
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

interface SearchResultsProps {
  vectorSearchResults: VectorSearchResult[];
  entities: KGSearchResult[];
  communities: KGSearchResult[];
}

const ResultCarousel: FC<{
  items: any[];
  ItemComponent: FC<any>;
  offset: number;
}> = ({ items, ItemComponent, offset = 0 }) => (
  <Carousel>
    <CarouselContent>
      {items.map((item, index) => (
        <CarouselItem key={index}>
          <Card className="h-48 overflow-y-auto">
            <CardContent>
              <ItemComponent {...item} index={index + offset + 1} />
            </CardContent>
          </Card>
        </CarouselItem>
      ))}
    </CarouselContent>
    <CarouselPrevious />
    <CarouselNext />
  </Carousel>
);

export const SearchResults: React.FC<SearchResultsProps> = ({
  vectorSearchResults,
  entities,
  communities,
}) => {
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const handleClosePdfPreview = () => {
    setPdfPreviewOpen(false);
  };
  const [initialPage, setInitialPage] = useState<number>(1);
  const [pdfPreviewDocumentId, setPdfPreviewDocumentId] = useState<
    string | null
  >(null);

  const openPdfPreview = (documentId: string, page?: number) => {
    setPdfPreviewDocumentId(documentId);
    if (page && page > 0) {
      setInitialPage(page);
    } else {
      setInitialPage(1);
    }
    setPdfPreviewOpen(true);

    setPdfPreviewOpen(true);
  };

  return (
    <div className="flex justify-center text-zinc-200 bg-zinc-900">
      <Tabs
        defaultValue="vectorSearch"
        className="text-zinc-900 w-full max-w-2xl"
      >
        <TabsList>
          <TabsTrigger
            value="vectorSearch"
            disabled={vectorSearchResults.length === 0}
          >
            Vector Search
          </TabsTrigger>
          <TabsTrigger value="kgEntities" disabled={entities.length === 0}>
            KG Entities
          </TabsTrigger>
          <TabsTrigger
            value="kgCommunities"
            disabled={communities.length === 0}
          >
            KG Communities
          </TabsTrigger>
        </TabsList>
        <TabsContent value="vectorSearch">
          <ResultCarousel
            items={vectorSearchResults.map((source) => ({
              source,
              onOpenPdfPreview: openPdfPreview,
            }))}
            ItemComponent={VectorSearchResultItem}
            offset={0}
          />
        </TabsContent>
        <TabsContent value="kgEntities">
          <ResultCarousel
            items={entities.map((entity) => ({ entity }))}
            ItemComponent={KGSearchResultItem}
            offset={vectorSearchResults.length}
          />
        </TabsContent>
        <TabsContent value="kgCommunities">
          <ResultCarousel
            items={communities.map((entity) => ({ entity }))}
            ItemComponent={KGCommunitiesSearchResultItem}
            offset={vectorSearchResults.length + entities.length}
          />
        </TabsContent>
      </Tabs>
      <PdfPreviewDialog
        id={pdfPreviewDocumentId || ''}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      />
    </div>
  );
};
