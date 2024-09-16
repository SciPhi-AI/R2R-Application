import {
  Loader,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react';
import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import 'react-pdf/dist/esm/Page/TextLayer.css';

const MIN_PDF_WIDTH = 300;
const MAX_PDF_WIDTH = 800;
const MIN_PDF_HEIGHT = 400;
const MAX_PDF_HEIGHT = 700;

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
  const [pageLoading, setPageLoading] = useState<boolean>(false);
  const { getClient } = useUserContext();
  const pdfDocumentRef = useRef<pdfjs.PDFDocumentProxy | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(MAX_PDF_WIDTH);
  const [containerHeight, setContainerHeight] =
    useState<number>(MAX_PDF_HEIGHT);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [rotation, setRotation] = useState<number>(0);

  // Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const ZOOM_STEP = 0.25;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3;

  // Dragging State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [scrollStart, setScrollStart] = useState<{ left: number; top: number }>(
    { left: 0, top: 0 }
  );

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + ZOOM_STEP, MAX_ZOOM));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - ZOOM_STEP, MIN_ZOOM));
  };

  const resetZoom = () => {
    setZoom(1);
  };

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
        setZoom(1);
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
      setPdfDimensions({ width: 0, height: 0 });
      setZoom(1);
      setIsDragging(false);
    };
  }, [open, documentId, getClient, initialPage]);

  const onDocumentLoadSuccess = (pdf: pdfjs.PDFDocumentProxy) => {
    setNumPages(pdf.numPages);
    pdfDocumentRef.current = pdf;
    if (currentPage > pdf.numPages) {
      setCurrentPage(pdf.numPages);
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

  const onPageLoadSuccess = (page: pdfjs.PDFPageProxy) => {
    const viewport = page.getViewport({ scale: 1 });
    setPdfDimensions({ width: viewport.width, height: viewport.height });
    setPageLoading(false);
  };

  const calculateScale = useCallback(() => {
    if (pdfDimensions.width === 0 || pdfDimensions.height === 0) {
      return 1;
    }

    const isRotated = rotation % 180 !== 0;
    const pdfWidth = isRotated ? pdfDimensions.height : pdfDimensions.width;
    const pdfHeight = isRotated ? pdfDimensions.width : pdfDimensions.height;

    const availableWidth = containerWidth;
    const availableHeight = containerHeight;

    const baseScale = Math.min(
      availableWidth / pdfWidth,
      availableHeight / pdfHeight,
      1
    );

    return baseScale * zoom;
  }, [pdfDimensions, containerWidth, containerHeight, rotation, zoom]);

  const rotateView = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (containerRef.current) {
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
      setScrollStart({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || !containerRef.current) {
        return;
      }

      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;

      containerRef.current.scrollLeft = scrollStart.left - deltaX;
      containerRef.current.scrollTop = scrollStart.top - deltaY;
    },
    [isDragging, dragStart, scrollStart]
  );

  const handleMouseUp = useCallback(() => {
    if (containerRef.current) {
      setIsDragging(false);
      // Revert cursor to default
      containerRef.current.style.cursor = 'grab';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDragging && containerRef.current) {
      setIsDragging(false);
      containerRef.current.style.cursor = 'grab';
    }
  }, [isDragging]);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (containerRef.current) {
      setIsDragging(true);
      const touch = event.touches[0];
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setScrollStart({
        left: containerRef.current.scrollLeft,
        top: containerRef.current.scrollTop,
      });
      containerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!isDragging || !containerRef.current) {
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;

      containerRef.current.scrollLeft = scrollStart.left - deltaX;
      containerRef.current.scrollTop = scrollStart.top - deltaY;
    },
    [isDragging, dragStart, scrollStart]
  );

  const handleTouchEnd = useCallback(() => {
    if (containerRef.current) {
      setIsDragging(false);
      containerRef.current.style.cursor = 'grab';
    }
  }, []);

  useEffect(() => {
    if (isDragging) {
      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      // Prevent default behavior to avoid scrolling during touch drag
      const preventDefault = (e: TouchEvent) => e.preventDefault();
      window.addEventListener('touchmove', preventDefault, { passive: false });

      return () => {
        // Clean up event listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width, height } = entry.contentRect;
          setContainerWidth(width);
          setContainerHeight(height);
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="text-white max-w-5xl flex flex-col p-4 sm:p-6 md:p-8">
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
            <div
              ref={containerRef}
              className="border border-gray-700 overflow-auto"
              style={{
                maxWidth: `${MAX_PDF_WIDTH}px`,
                maxHeight: `${MAX_PDF_HEIGHT}px`,
                width: `${MAX_PDF_WIDTH}px`,
                height: `${MAX_PDF_HEIGHT}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: isDragging ? 'none' : 'auto',
              }}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
            >
              <Document
                file={pdfBlob}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex justify-center items-center h-full">
                    <Loader className="animate-spin" size={32} />
                  </div>
                }
                error={<span>Failed to load PDF.</span>}
                noData={<span>No PDF file specified.</span>}
              >
                {!pageLoading ? (
                  <Page
                    pageNumber={currentPage}
                    scale={calculateScale()}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={onPageLoadSuccess}
                    onRenderError={() => setPageLoading(false)}
                  />
                ) : (
                  <Page
                    pageNumber={currentPage}
                    scale={calculateScale()}
                    rotate={rotation}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={onPageLoadSuccess}
                    onRenderError={() => setPageLoading(false)}
                  />
                )}
              </Document>
            </div>
            <p className="my-2">
              Page {currentPage} of {numPages}
            </p>
            <div className="flex items-center space-x-1">
              <Button
                color="filled"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                color="filled"
                onClick={rotateView}
                aria-label="Rotate view"
              >
                <RotateCw size={16} />
              </Button>
              <Button
                color="filled"
                onClick={goToNextPage}
                disabled={currentPage >= numPages}
                aria-label="Go to next page"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-center w-full mt-4 space-x-2 space-y-2">
              <div className="flex items-center space-x-1">
                <Button
                  color="filled"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                >
                  <Minus size={16} />
                </Button>
                <span className="w-16 text-center">
                  {(zoom * 100).toFixed(0)}%
                </span>
                <Button
                  color="filled"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                >
                  <Plus size={16} />
                </Button>
              </div>
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
