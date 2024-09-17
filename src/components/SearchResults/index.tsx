import { FileText } from 'lucide-react';
import React, { FC, useEffect, useState, useRef } from 'react';

import PdfPreviewDialog from '@/components/ChatDemo/utils/pdfPreviewDialog';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VectorSearchResult, KGLocalSearchResult } from '@/types';

const VectorSearchResultItem: FC<{
  source: VectorSearchResult;
  index: number;
  onOpenPdfPreview: (documentId: string, page?: number) => void;
}> = ({ source, index, onOpenPdfPreview }) => {
  const { document_id, score, metadata, text } = source;

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
    <div
      className="bg-zinc-700 p-4 rounded-lg mb-2 flex items-center"
      style={{ width: '100%' }}
    >
      <div className="flex-grow mr-4">
        <div className="flex items-center mb-1 flex-nowrap">
          <h3 className="text-sm font-medium text-zinc-200 mr-2 overflow-hidden overflow-ellipsis whitespace-nowrap">
            [{index}] {metadata.title}
          </h3>
          <div className="flex-grow"></div>
          <span className="text-xs text-zinc-400 ml-2 whitespace-nowrap">
            Similarity Score: {source.score.toFixed(3)}
            {isPdf && (
              <div className="flex-shrink-0">
                <Button
                  onClick={handleOpenPdfPreview}
                  color="filled"
                  className="text-white font-bold flex items-center z-10000"
                  title={`Open PDF${pageNumber ? ` (Page ${pageNumber})` : ''}`}
                >
                  <FileText size={16} className="mr-2" />
                  PDF
                </Button>
              </div>
            )}
          </span>
        </div>

        <p className="text-xs text-zinc-300">{text}</p>
        <p className="text-xs text-zinc-400 pt-4">
          {/* Similarity Score: {(source.score).toFixed(3)} */}
          {/* <br /> */}
          Document ID: {source.document_id}
          <br />
          Fragment ID: {source.fragment_id}
          {/* Similarity: {score.toFixed(3)} */}
        </p>
      </div>
    </div>
  );
};

const KGEntityResult: FC<{ entity: any }> = ({ entity }) => {
  return (
    <div className="bg-zinc-700 p-4 rounded-lg mb-2">
      <h3 className="text-sm font-medium text-zinc-300 mb-1">{entity.name}</h3>
      <p className="text-xs text-zinc-400">{entity.description}</p>
    </div>
  );
};

interface SearchResultsProps {
  vectorSearchResults: VectorSearchResult[];
  kgLocalSearchResult: KGLocalSearchResult | null;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  vectorSearchResults,
  kgLocalSearchResult,
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
    // Implement the logic to open the PDF preview
    // console.log(
    //   `Opening PDF preview for document ID: ${documentId}, page: ${page}`
    // );
    setPdfPreviewDocumentId(documentId);
    if (page && page > 0) {
      setInitialPage(page);
    } else {
      setInitialPage(1);
    }
    setPdfPreviewOpen(true);

    setPdfPreviewOpen(true);
  };

  console.log('in search results, kgEntityResults = ', kgLocalSearchResult);
  return (
    <div className="flex justify-center text-zinc-200 bg-zinc-900">
      <Tabs defaultValue="vectorSearch" className="w-full max-w-2xl">
        <TabsList>
          <TabsTrigger value="vectorSearch">Vector Search</TabsTrigger>
          {kgLocalSearchResult && kgLocalSearchResult?.entities && (
            <TabsTrigger value="kgEntities">KG Entities</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="vectorSearch">
          <Carousel>
            <CarouselContent>
              {vectorSearchResults.map((source, index) => (
                <CarouselItem key={index}>
                  <div className="p-4">
                    <Card className="h-96 overflow-y-auto bg-zinc-900">
                      <CardContent>
                        <div className="mt-4" />
                        <VectorSearchResultItem
                          source={source}
                          index={index}
                          onOpenPdfPreview={openPdfPreview}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </TabsContent>
        {kgLocalSearchResult && kgLocalSearchResult?.entities && (
          <TabsContent value="kgEntities">
            <Carousel>
              <CarouselContent>
                {Object.entries(kgLocalSearchResult.entities).map(
                  ([_, entity]) => (
                    <CarouselItem key={entity.name}>
                      <div className="p-4">
                        <Card className="h-96 overflow-y-auto bg-zinc-900">
                          <CardContent>
                            <div className="mt-4" />
                            <KGEntityResult entity={entity} />
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  )
                )}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </TabsContent>
        )}
      </Tabs>
      <PdfPreviewDialog
        documentId={pdfPreviewDocumentId || ''}
        open={pdfPreviewOpen}
        onClose={handleClosePdfPreview}
        initialPage={initialPage}
      />
    </div>
  );
};
