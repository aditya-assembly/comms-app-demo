import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, FileText, Image, Video, FileSpreadsheet, Maximize2, Minimize2, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";

import { toast } from "@/lib/toast";
import { commsAPI } from "@/services/comms-api";
import LoadingScreen from "../ui/loading-screen";
import * as XLSX from "xlsx";
import type { MediaFile } from "@/types/orchestration-dashboard-types";
import { SpreadsheetViewer } from "./spreadsheet-viewer";
import { getFileExtension, getMediaType, getMediaTypeLabel, numberToColumnName, categorizeError, MEDIA_TYPES, type MediaError, type MediaType } from "./media-utils";
import { formatFileSize } from "./utils";
import { getBadgeVariantForFileType } from "@/lib/badge-semantics";

interface MediaViewerProps {
  media: MediaFile;
  workflowId?: string;
  taskId?: string;
  ticketId?: string;
  triggerId?: string;
  children?: React.ReactNode;
}

const getMediaIcon = (mediaType: MediaType) => {
  const iconProps = { className: "h-5 w-5 text-primary" };

  switch (mediaType) {
    case MEDIA_TYPES.PDF:
    case MEDIA_TYPES.DOCUMENT:
      return <FileText {...iconProps} />;
    case MEDIA_TYPES.IMAGE:
      return <Image {...iconProps} />;
    case MEDIA_TYPES.VIDEO:
      return <Video {...iconProps} />;
    case MEDIA_TYPES.SPREADSHEET:
    case MEDIA_TYPES.CSV:
      return <FileSpreadsheet {...iconProps} />;
    default:
      return <FileText {...iconProps} />;
  }
};

export function MediaViewer({ media, workflowId, taskId, ticketId, triggerId, children }: MediaViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MediaError | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spreadsheetData, setSpreadsheetData] = useState<(string | number | null)[][] | null>(null);
  const [spreadsheetHeaders, setSpreadsheetHeaders] = useState<string[]>([]);
  const [contentContainerRef, setContentContainerRef] = useState<HTMLDivElement | null>(null);

  // Fetch media content when viewer opens
  useEffect(() => {
    if (isOpen && media.id && !mediaUrl && !error) {
      setIsLoading(true); // Start loading immediately when we start fetching URL
      setError(null);

      // Choose the appropriate API method based on the context
      const fetchMediaPromise = triggerId
        ? commsAPI.getMediaForTrigger(triggerId, media.id)
        : ticketId
        ? commsAPI.getTicketMediaSignedUrl(workflowId!, ticketId, media.id)
        : taskId
        ? commsAPI.getMediaSignedUrl(workflowId!, taskId, media.id)
        : Promise.reject(new Error("Either triggerId, taskId, or ticketId must be provided"));

      fetchMediaPromise
        .then((url) => {
          setMediaUrl(url);
          // Keep isLoading true - it will be set to false when media actually loads
          setError(null);
        })
        .catch((err) => {
          const categorizedError = categorizeError(err);
          setError(categorizedError);
          setIsLoading(false); // Stop loading on error
          toast.error("Failed to load media");
        });
    }
  }, [isOpen, workflowId, taskId, ticketId, triggerId, media.id, media.name, mediaUrl, error]);

  // Use the fetched URL
  const viewUrl = mediaUrl;

  const mediaType = getMediaType(media.name);

  const toggleFullscreen = useCallback(async () => {
    if (!contentContainerRef) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (contentContainerRef.requestFullscreen) {
          await contentContainerRef.requestFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((contentContainerRef as any).webkitRequestFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (contentContainerRef as any).webkitRequestFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((contentContainerRef as any).msRequestFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (contentContainerRef as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).webkitExitFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).webkitExitFullscreen();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).msExitFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (_error) {
      // Fallback to just changing state
      setIsFullscreen(!isFullscreen);
    }
  }, [contentContainerRef, isFullscreen]);

  // Listen for fullscreen changes from browser (F11, ESC, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).webkitFullscreenElement ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Function to fetch and parse spreadsheet files using SheetJS
  const fetchAndParseSpreadsheet = useCallback(
    async (url: string) => {
      try {
        setIsLoading(true);

        // Fetch file content from signed URL with CORS support
        const response = await fetch(url, {
          mode: "cors",
          credentials: "omit",
          headers: {
            Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,*/*",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }

        // Get as ArrayBuffer for SheetJS
        const arrayBuffer = await response.arrayBuffer();

        // Parse with SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON array without header interpretation
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | null)[][];

        if (jsonData.length > 0) {
          // Determine file type for header handling
          const fileExtension = getFileExtension(media.name);
          const isCSV = fileExtension === "csv";

          let headers: string[];
          let allData: (string | number | null)[][];

          if (isCSV && jsonData.length > 0) {
            // For CSV files, assume first row contains headers
            const headerRowIndex = 0;

            headers = (jsonData[headerRowIndex] as (string | number | null)[]).map((cell, index) => (cell ? String(cell) : `Column ${index + 1}`));
            allData = jsonData.slice(headerRowIndex + 1);
          } else {
            // For XLSX/XLS files, show content as-is without header assumption
            // Generate column headers (A, B, C, etc. like Excel)
            const maxColumns = Math.max(...jsonData.map((row) => (row ? row.length : 0)));
            headers = [];
            for (let i = 0; i < maxColumns; i++) {
              headers.push(numberToColumnName(i));
            }
            allData = jsonData; // Include all rows as data
          }

          // Ensure we have enough columns for all data rows
          const maxDataColumns = Math.max(...allData.map((row) => (row ? row.length : 0)));

          // Extend headers if data has more columns
          while (headers.length < maxDataColumns) {
            if (isCSV) {
              headers.push(`Column ${headers.length + 1}`);
            } else {
              headers.push(numberToColumnName(headers.length));
            }
          }

          // Normalize all data rows to have the same number of columns

          const normalizedData = allData.map((row: (string | number | null)[]) => {
            const normalizedRow = [];
            for (let i = 0; i < headers.length; i++) {
              normalizedRow.push(row && row[i] !== undefined ? row[i] : null);
            }
            return normalizedRow;
          });

          setSpreadsheetHeaders(headers);
          setSpreadsheetData(normalizedData);
        } else {
          // Handle empty spreadsheets
          setSpreadsheetHeaders([]);
          setSpreadsheetData([]);
        }

        setIsLoading(false);
      } catch (err) {
        const categorizedError = categorizeError(err as Error);

        setError(categorizedError);
        setIsLoading(false);
      }
    },
    [media.name]
  );

  // Basic keyboard shortcuts
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          break;
        case "F11":
        case "f":
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    },
    [isOpen, toggleFullscreen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Reset state when modal opens/closes and handle spreadsheet parsing
  useEffect(() => {
    if (isOpen) {
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });

      // Handle loading based on media type
      if (viewUrl && mediaType === "csv") {
        // For CSV files, use SheetJS parsing
        fetchAndParseSpreadsheet(viewUrl);
      } else if (viewUrl && mediaType === "spreadsheet") {
        // For all spreadsheet files, use SheetJS parsing
        fetchAndParseSpreadsheet(viewUrl);
      }
    } else {
      // Reset all state when modal closes
      setIsLoading(false);
      setError(null);
      setMediaUrl(null);
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
      setIsDragging(false);
      setSpreadsheetData(null);
      setSpreadsheetHeaders([]);
    }
  }, [isOpen, viewUrl, mediaType, fetchAndParseSpreadsheet]);

  const handleIframeLoad = () => {
    // Content has successfully loaded
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    const genericError: MediaError = {
      type: "generic",
      message: "Failed to load media content",
      userMessage: "Failed to load media content. The file may not be supported for preview.",
    };
    setError(genericError);
  };

  const renderMediaContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>

            <Alert className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">
                    {error.type === "cors"
                      ? "Cannot Preview File"
                      : error.type === "network"
                      ? "Connection Error"
                      : error.type === "not_found"
                      ? "File Not Found"
                      : error.type === "parse"
                      ? "Cannot Open File"
                      : "Error Loading File"}
                  </p>
                  <p className="text-sm">{error.userMessage}</p>

                  {/* Simple context for specific error types */}
                  {error.type === "cors" && (
                    <p className="text-xs text-muted-foreground">
                      {mediaType === "spreadsheet" || mediaType === "csv"
                        ? "This spreadsheet file cannot be previewed directly due to browser security restrictions. Try opening in a new tab or downloading the file."
                        : "Some files cannot be previewed directly in the browser."}
                    </p>
                  )}
                  {error.type === "network" && <p className="text-xs text-muted-foreground">Please check your internet connection and try again.</p>}
                  {error.type === "not_found" && <p className="text-xs text-muted-foreground">This file may have been moved or deleted.</p>}
                  {error.type === "parse" && <p className="text-xs text-muted-foreground">The file may be corrupted or in an unsupported format.</p>}
                </div>
              </AlertDescription>
            </Alert>

            {/* Action buttons based on error type */}
            <div className="flex flex-col gap-2">
              {error.type === "cors" && viewUrl && (
                <>
                  {/* For XLSX files, prioritize opening in new tab since it usually works */}
                  {(mediaType === "spreadsheet" || mediaType === "csv") && (
                    <Button onClick={() => window.open(viewUrl, "_blank")} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Open in New Tab
                    </Button>
                  )}
                  <Button
                    variant={mediaType === "spreadsheet" || mediaType === "csv" ? "outline" : "default"}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = viewUrl;
                      link.download = media.name;
                      link.click();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </Button>
                  {!(mediaType === "spreadsheet" || mediaType === "csv") && (
                    <Button variant="outline" onClick={() => window.open(viewUrl, "_blank")} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Try Opening in New Tab
                    </Button>
                  )}
                </>
              )}

              {error.type === "network" && (
                <Button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    // Retry by re-triggering the effect
                    if (viewUrl && mediaType === "csv") {
                      fetchAndParseSpreadsheet(viewUrl);
                    } else if (viewUrl && mediaType === "spreadsheet") {
                      fetchAndParseSpreadsheet(viewUrl);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  Try Again
                </Button>
              )}

              {(error.type === "parse" || error.type === "generic") && viewUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = viewUrl;
                    link.download = media.name;
                    link.click();
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (!viewUrl && !isLoading) {
      const urlError: MediaError = {
        type: "generic",
        message: "Unable to load media URL",
        userMessage: "Unable to load media URL. Please try again.",
      };

      return (
        <div className="flex items-center justify-center h-full">
          <Alert className="w-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-center">{urlError.userMessage}</AlertDescription>
          </Alert>
        </div>
      );
    }

    // Don't render anything if we don't have URL yet (loading spinner will show)
    if (!viewUrl) {
      return null;
    }

    if (mediaType === MEDIA_TYPES.UNKNOWN) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <Alert className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-center">
                <div className="space-y-2">
                  <p>This file type cannot be previewed.</p>
                  <p className="text-xs text-muted-foreground">Download the file to view its contents.</p>
                </div>
              </AlertDescription>
            </Alert>
            {viewUrl && (
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = viewUrl;
                  link.download = media.name;
                  link.click();
                }}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Handle videos with native HTML5 video player (using browser's built-in controls)
    if (mediaType === MEDIA_TYPES.VIDEO) {
      return (
        <div className={`flex items-center justify-center h-full ${isFullscreen ? "p-0" : "p-2"}`}>
          <video
            src={viewUrl}
            controls
            controlsList="nodownload"
            className={`${isFullscreen ? "w-screen h-screen" : "w-full h-full rounded-lg shadow-lg"}`}
            onLoadedData={handleIframeLoad}
            onError={handleIframeError}
            preload="metadata"
            style={{
              objectFit: "contain",
              maxHeight: isFullscreen ? "100vh" : "calc(100vh - 160px)",
              minHeight: isFullscreen ? "100vh" : "400px",
              width: isFullscreen ? "100vw" : "100%",
              height: isFullscreen ? "100vh" : "auto",
              borderRadius: isFullscreen ? "0" : undefined,
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Handle images with proper sizing, centering, and intuitive panning capability
    if (mediaType === MEDIA_TYPES.IMAGE) {
      const handleMouseDown = (e: React.MouseEvent) => {
        if (isFullscreen && imageScale > 1) {
          e.preventDefault();
          setIsDragging(true);
          setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
        }
      };

      const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && isFullscreen && imageScale > 1) {
          setImagePosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
          });
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      const handleWheel = (e: React.WheelEvent) => {
        if (isFullscreen) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.2 : 0.2;
          const newScale = Math.max(0.5, Math.min(5, imageScale + delta));
          setImageScale(newScale);

          // Reset position when zooming out to 1x
          if (newScale <= 1) {
            setImagePosition({ x: 0, y: 0 });
          }
        }
      };

      // Reset zoom and position when switching to/from fullscreen
      const effectiveScale = isFullscreen ? imageScale : 1;
      const effectivePosition = isFullscreen && imageScale > 1 ? imagePosition : { x: 0, y: 0 };
      const canPan = isFullscreen && imageScale > 1;

      return (
        <div
          className={`flex items-center justify-center h-full ${isFullscreen ? "p-0" : "p-4"} overflow-hidden relative`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            cursor: isFullscreen ? (canPan ? (isDragging ? "grabbing" : "grab") : "zoom-in") : "default",
            width: isFullscreen ? "100vw" : undefined,
            height: isFullscreen ? "100vh" : undefined,
          }}
        >
          <img
            src={viewUrl}
            alt={media.name}
            className={`${isFullscreen ? "" : "rounded-lg shadow-lg"} select-none`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{
              maxWidth: isFullscreen ? "100vw" : "100%",
              maxHeight: isFullscreen ? "100vh" : "100%",
              width: isFullscreen ? "auto" : "auto",
              height: isFullscreen ? "auto" : "auto",
              transform: `translate(${effectivePosition.x}px, ${effectivePosition.y}px) scale(${effectiveScale})`,
              transition: isDragging ? "none" : "transform 0.3s ease",
              objectFit: "contain",
            }}
            draggable={false}
          />

          {/* Zoom indicator for fullscreen */}
          {isFullscreen && imageScale !== 1 && (
            <div className="absolute top-4 left-4 text-xs px-2 py-1 rounded" style={{ backgroundColor: "hsl(var(--gray-900) / 0.7)", color: "hsl(var(--gray-50))" }}>
              {Math.round(imageScale * 100)}%
            </div>
          )}
        </div>
      );
    }

    // Handle CSV files with SheetJS parsing
    if (mediaType === "csv") {
      return (
        <div className="w-full h-full overflow-hidden">
          <SpreadsheetViewer
            fileName={media.name}
            fileSize={media.sizeMB}
            headers={spreadsheetHeaders}
            data={spreadsheetData || []}
            fileType="csv"
            isLoading={spreadsheetData === null}
            isEmpty={spreadsheetData !== null && spreadsheetHeaders.length === 0}
            isFullscreen={isFullscreen}
          />
        </div>
      );
    }

    // Handle spreadsheets and documents
    if (mediaType === "spreadsheet" || mediaType === "document") {
      const fileExtension = getFileExtension(media.name);

      // For XLSX/XLS files, use SheetJS parsing
      if (["xlsx", "xls"].includes(fileExtension)) {
        // If we have an error, show fallback options
        if (error) {
          return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-800">
              <div className="mb-6 p-4 bg-error-bg rounded-full">{getMediaIcon(mediaType)}</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{media.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Unable to preview spreadsheet content in browser.</p>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button onClick={() => window.open(viewUrl!, "_blank")} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Open in New Tab
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = viewUrl!;
                    link.download = media.name;
                    link.click();
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download File
                </Button>
              </div>
            </div>
          );
        }

        // Use enhanced SheetJS viewer for all spreadsheet files
        if (["xlsx", "xls"].includes(fileExtension)) {
          return (
            <div className="w-full h-full overflow-hidden">
              <SpreadsheetViewer
                fileName={media.name}
                fileSize={media.sizeMB}
                headers={spreadsheetHeaders}
                data={spreadsheetData || []}
                fileType={fileExtension as "xlsx" | "xls" | "csv"}
                isLoading={spreadsheetData === null}
                isEmpty={spreadsheetData !== null && spreadsheetHeaders.length === 0}
                isFullscreen={isFullscreen}
              />
            </div>
          );
        }

        // Fallback to table view for CSV and other spreadsheet formats
        return (
          <div className="w-full h-full overflow-hidden">
            <SpreadsheetViewer
              fileName={media.name}
              fileSize={media.sizeMB}
              headers={spreadsheetHeaders}
              data={spreadsheetData || []}
              fileType="csv"
              isLoading={spreadsheetData === null}
              isFullscreen={isFullscreen}
              isEmpty={spreadsheetData !== null && spreadsheetHeaders.length === 0}
            />
          </div>
        );
      }

      // For other document types, show download option with preview info
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="mb-6">{getMediaIcon(mediaType)}</div>
          <h3 className="text-lg font-semibold mb-2">{media.name}</h3>
          <p className="text-muted-foreground mb-4">This {getMediaTypeLabel(mediaType)} file cannot be previewed in the browser.</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.open(viewUrl, "_blank")} className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const link = document.createElement("a");
                link.href = viewUrl;
                link.download = media.name;
                link.click();
              }}
              className="flex items-center gap-2"
            >
              Download File
            </Button>
          </div>
        </div>
      );
    }

    // Direct embedding for PDFs with full screen support
    return (
      <iframe
        src={viewUrl}
        className={`border-0 ${isFullscreen ? "w-full h-full" : "w-full h-full rounded-lg"}`}
        style={{
          width: "100%",
          height: isFullscreen ? "calc(100vh - 56px)" : "100%",
          minHeight: isFullscreen ? "calc(100vh - 56px)" : "calc(95vh - 200px)",
          border: "none",
          borderRadius: isFullscreen ? "0" : undefined,
        }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title={`Preview of ${media.name}`}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100 transition-opacity">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent
        noPadding
        className={`${
          isFullscreen
            ? "max-w-[95vw] max-h-[95vh] h-[95vh] w-[95vw]"
            : mediaType === MEDIA_TYPES.PDF
            ? "max-w-7xl max-h-[95vh] h-[95vh] w-[90vw]"
            : mediaType === MEDIA_TYPES.SPREADSHEET || mediaType === MEDIA_TYPES.CSV
            ? "max-w-7xl max-h-[95vh] h-[90vh] w-[90vw]"
            : "max-w-6xl max-h-[90vh] w-[85vw]"
        } transition-all duration-300 bg-white dark:bg-slate-950 rounded-xl overflow-hidden`}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Fullscreen button positioned below close button */}
        {!isFullscreen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="absolute right-4 top-14 h-8 w-8 p-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-50"
            title="Fullscreen (F)"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full overflow-hidden rounded-xl"
          >
            {/* Enhanced Header */}
            <DialogHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-t-xl">
              <div className="flex items-start gap-4">
                {/* File info section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex-shrink-0">{getMediaIcon(mediaType)}</div>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-xl font-semibold truncate text-slate-900 dark:text-slate-100">{media.name}</DialogTitle>
                    <DialogDescription className="sr-only">
                      Media viewer for {media.name}, a {getMediaTypeLabel(mediaType)} file of {formatFileSize(media.sizeMB)}
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={getBadgeVariantForFileType(mediaType)} className="text-xs font-medium flex-shrink-0">
                        {getMediaTypeLabel(mediaType)}
                      </Badge>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{formatFileSize(media.sizeMB)}</span>
                      </div>
                      {/* Show rows/columns for spreadsheet files */}
                      {(mediaType === "spreadsheet" || mediaType === "csv") && spreadsheetData && (
                        <>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success-bg rounded-full text-xs flex-shrink-0 border border-success/30">
                            <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                            <span className="font-medium text-success">{spreadsheetData.length.toLocaleString()}</span>
                            <span className="text-success/90">rows</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-info-bg rounded-full text-xs flex-shrink-0 border border-info/30">
                            <span className="w-1.5 h-1.5 bg-info rounded-full"></span>
                            <span className="font-medium text-info">{spreadsheetHeaders.length}</span>
                            <span className="text-info/90">columns</span>
                          </div>
                        </>
                      )}
                      {media.description && <span className="text-sm text-slate-500 dark:text-slate-500 truncate max-w-[200px]">{media.description}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Enhanced Content Container */}
            <div className={`flex-1 relative ${isFullscreen ? "p-0" : "p-0"} transition-all duration-300 min-h-0 overflow-hidden bg-white dark:bg-slate-950`}>
              {isLoading && (
                <div className="absolute inset-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 shadow-lg border border-slate-200 dark:border-slate-700">
                  <LoadingScreen variant="inline" message="Loading content..." />
                </div>
              )}

              <div
                ref={(ref) => setContentContainerRef(ref)}
                className={`w-full h-full ${
                  isFullscreen
                    ? "fixed inset-0 z-[9999] bg-black flex flex-col"
                    : mediaType === MEDIA_TYPES.PDF
                    ? "min-h-[600px] bg-white dark:bg-slate-950"
                    : mediaType === MEDIA_TYPES.SPREADSHEET || mediaType === MEDIA_TYPES.CSV
                    ? "h-full bg-white dark:bg-slate-950 overflow-hidden"
                    : "min-h-[400px] bg-white dark:bg-slate-950"
                } transition-all duration-300`}
                style={{
                  backgroundColor: isFullscreen ? "hsl(var(--gray-900))" : undefined,
                }}
              >
                {/* Fullscreen header controls */}
                {isFullscreen && (
                  <div className="fixed top-0 left-0 right-0 z-[10000] bg-black/90 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-white/90 truncate max-w-[200px] sm:max-w-[400px] lg:max-w-[600px]">{media.name}</div>
                        {(mediaType === MEDIA_TYPES.SPREADSHEET || mediaType === MEDIA_TYPES.CSV) && spreadsheetData && (
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                              <span className="text-white/70">{spreadsheetData.length.toLocaleString()} rows</span>
                            </div>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-full text-xs">
                              <span className="text-white/70">{spreadsheetHeaders.length} columns</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-9 w-9 p-0 text-white hover:bg-white/20 bg-black/50 border border-white/20 flex-shrink-0 ml-4" title="Exit Fullscreen (ESC)">
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className={isFullscreen ? "w-full h-full pt-16" : "w-full h-full"}>{renderMediaContent()}</div>
              </div>
            </div>

            {/* Enhanced Footer */}
            {!isFullscreen && (
              <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-b-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                    {media.owners && media.owners.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Owners:</span>
                        <span className="text-slate-600 dark:text-slate-400">{media.owners.join(", ")}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                      <span className="text-xs font-medium">Last modified: {new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                    <span className="font-medium">{getMediaTypeLabel(mediaType)}</span>
                    <span>•</span>
                    <span className="font-medium">{formatFileSize(media.sizeMB)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
