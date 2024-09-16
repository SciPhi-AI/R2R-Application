import { Loader } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUserContext } from '@/context/UserContext';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

interface PdfPreviewDialogProps {
  documentId: string;
  open: boolean;
  onClose: () => void;
  initialPage?: number;
}

const PdfPreviewDialog: React.FC<PdfPreviewDialogProps> = ({
  documentId,
  open,
  onClose,
  initialPage = 1,
}) => {
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [pageCache, setPageCache] = useState<Record<number, any>>({});
  const { getClient } = useUserContext();
  const pdfDocumentRef = useRef<any>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
  }, []);

  useEffect(() => {
    const fetchPdf = async () => {
      setLoading(true);
      try {
        const client = await getClient();
        if (!client) {
          throw new Error('Failed to get authenticated client');
        }

        const blob = await client.downloadFile(documentId);
        setPdfBlob(blob);

        setCurrentPage(initialPage);
      } catch (error) {
        console.error('Error fetching PDF:', error);
        setPdfBlob(null);
      } finally {
        setLoading(false);
      }
    };

    if (open && documentId) {
      fetchPdf();
    }

    return () => {
      setPdfBlob(null);
      setNumPages(0);
      setCurrentPage(initialPage);
      setPageCache({});
    };
  }, [open, documentId, getClient, initialPage]);

  useEffect(() => {
    const cachePages = async () => {
      if (!pdfDocumentRef.current) {
        return;
      }

      const prevPage = currentPage > 1 ? currentPage - 1 : null;
      const nextPage = currentPage < numPages ? currentPage + 1 : null;
      const pagesToCache = [prevPage, currentPage, nextPage].filter(
        (page): page is number => page !== null
      );

      for (const pageNum of pagesToCache) {
        if (!pageCache[pageNum]) {
          try {
            const page = await pdfDocumentRef.current.getPage(pageNum);
            setPageCache((prev) => ({ ...prev, [pageNum]: page }));
          } catch (error) {
            console.error(`Error caching page ${pageNum}:`, error);
          }
        }
      }
    };

    cachePages();
  }, [currentPage, numPages, pageCache]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    if (currentPage > numPages) {
      setCurrentPage(numPages);
    }
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
    setPageLoading(true);
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
    setPageLoading(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-5xl max-h-[90vh] flex flex-col p-4 sm:p-6 md:p-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            PDF Preview
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center flex-grow">
            <Loader className="animate-spin" size={64} />
          </div>
        ) : pdfBlob ? (
          <div className="flex flex-col items-center flex-grow">
            <div className="border border-gray-700 flex-grow min-h-[calc(90vh-20rem)] overflow-hidden">
              <Document
                file={pdfBlob}
                onLoadSuccess={(pdf) => {
                  onDocumentLoadSuccess(pdf);
                  pdfDocumentRef.current = pdf;
                }}
                loading={<Loader className="animate-spin" size={32} />}
                error={<span>Failed to load PDF.</span>}
                noData={<span>No PDF file specified.</span>}
              >
                {pageLoading && <Loader className="animate-spin" size={32} />}
                <Page
                  key={currentPage}
                  pageNumber={currentPage}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadSuccess={() => setPageLoading(false)}
                  onRenderError={() => setPageLoading(false)}
                  inputRef={pageCache[currentPage]}
                />
              </Document>
            </div>
            <p className="my-2">
              Page {currentPage} of {numPages}
            </p>
            <div className="flex flex-row items-center justify-center w-full mt-2 space-x-4">
              <Button
                color="filled"
                className="w-24"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                aria-label="Go to previous page"
              >
                Previous
              </Button>
              <Button
                color="filled"
                className="w-24"
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                aria-label="Go to next page"
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-center flex-grow">No PDF available to display.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PdfPreviewDialog;
