import React, { useState, useMemo, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Download } from "lucide-react";
import { isUrl, formatUrl } from "@/lib/utils";

interface SpreadsheetViewerProps {
  fileName: string;
  fileSize: number;
  headers: string[];
  data: (string | number | null)[][];
  fileType: "csv" | "xlsx" | "xls";
  isLoading?: boolean;
  isEmpty?: boolean;
  isFullscreen?: boolean;
}

// Enhanced helper function to detect cell data type and apply appropriate styling
const getCellValue = (value: string | number | null): { value: string; type: 'number' | 'text' | 'empty' | 'url' } => {
  if (value === null || value === undefined || value === '') {
    return { value: '', type: 'empty' };
  }
  
  const stringValue = String(value);
  
  // Check if it's a URL
  if (isUrl(stringValue)) {
    return { value: stringValue, type: 'url' };
  }
  
  // Check if it's a number
  if (!isNaN(Number(stringValue)) && stringValue.trim() !== '') {
    return { value: stringValue, type: 'number' };
  }
  
  return { value: stringValue, type: 'text' };
};

// Enhanced helper function to get cell styling based on content type
const getCellStyling = (cellType: 'number' | 'text' | 'empty' | 'url'): string => {
  switch (cellType) {
    case 'number':
      return 'text-center font-mono text-info bg-info-bg/30';
    case 'url':
      return 'text-center text-info underline decoration-info/30 hover:decoration-info';
    case 'empty':
      return 'text-slate-400 dark:text-slate-600 italic text-center';
    case 'text':
    default:
      return 'text-center text-slate-700 dark:text-slate-300';
  }
};


export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  fileName,
  fileSize: _fileSize,
  headers,
  data,
  fileType,
  isLoading = false,
  isEmpty = false,
  isFullscreen = false,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Simple debounce implementation to improve performance
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(term);
    }, 300);
  }, []);

  // Simple and fast filtering - only filters rows, no complex highlighting
  const filteredData = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return data;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return data.filter((row) => {
      return row.some((cell) => {
        const cellValue = String(cell || '').toLowerCase();
        return cellValue.includes(searchLower);
      });
    });
  }, [data, debouncedSearchTerm]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearchTerm("");
  };

  const handleDownload = () => {
    // Create CSV content from current data (filtered or full)
    const dataToExport = debouncedSearchTerm ? filteredData : data;
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        row.map(cell => {
          const value = String(cell || '');
          // Escape quotes and wrap in quotes if contains comma or quote
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName.replace(/\.[^/.]+$/, '')}${debouncedSearchTerm ? '_filtered' : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const gradientClass = 'bg-white dark:bg-slate-950';
    
  const headerClass = fileType === 'csv'
    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    : 'bg-success-bg border-success/40';
    
  const headerTextClass = fileType === 'csv'
    ? 'text-slate-700 dark:text-slate-300'
    : 'text-success';

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${gradientClass}`}>
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse">
          <div className="w-6 h-6 bg-slate-400 dark:bg-slate-600 rounded"></div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{fileName}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">Loading spreadsheet content...</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-8 text-center ${gradientClass}`}>
        <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-full">
          <div className="w-6 h-6 bg-slate-400 dark:bg-slate-600 rounded"></div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">{fileName}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">This {fileType.toUpperCase()} file appears to be empty.</p>
        <Badge variant="warningSoft">
          No Data
        </Badge>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${gradientClass} overflow-hidden ${isFullscreen ? 'max-w-[100vw]' : ''}`}>
      {/* Simplified Search and Actions Bar */}
      <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-2 sm:left-3 inset-y-0 flex items-center pointer-events-none">
              <Search className="h-3 sm:h-4 w-3 sm:w-4 text-slate-400" />
            </div>
            <Input
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 sm:pl-10 pr-8 sm:pr-10 h-8 sm:h-9 text-xs sm:text-sm bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
            />
            {searchInput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 sm:h-7 w-6 sm:w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
              </Button>
            )}
          </div>
          
          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600"
          >
            <Download className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="hidden sm:inline">{debouncedSearchTerm ? 'Download Filtered' : 'Download'}</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
        
        {/* Simple Search Summary */}
        {debouncedSearchTerm && (
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {filteredData.length} of {data.length} rows match "{debouncedSearchTerm}"
            </Badge>
          </div>
        )}
      </div>

      {/* Enhanced Table Container with proper scrolling */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900" style={{ scrollbarGutter: 'stable', maxWidth: isFullscreen ? '100vw' : '100%' }}>
        <table className="w-full border-collapse">
          {/* Enhanced sticky header - only for CSV */}
          {fileType === 'csv' && (
            <thead className="sticky top-0 z-10">
              <tr className={`${headerClass} border-b-2 border-slate-200 dark:border-slate-700 shadow-md`}>
                {/* Row number header */}
                <th className={`w-10 sm:w-16 text-center px-1 sm:px-2 py-2 sm:py-3 font-bold text-[10px] sm:text-xs ${headerTextClass} border-r border-slate-200 dark:border-slate-700 sticky left-0 z-20 ${headerClass}`}>
                  #
                </th>
                {headers.map((header, index) => (
                  <th 
                    key={index} 
                    className={`text-center px-2 sm:px-4 py-2 sm:py-3 font-bold text-[10px] sm:text-sm ${headerTextClass} border-r border-slate-200 dark:border-slate-700 last:border-r-0 ${isFullscreen ? 'min-w-[150px] max-w-[300px]' : 'min-w-[80px] sm:min-w-[120px]'} ${isFullscreen ? 'whitespace-normal' : 'whitespace-nowrap'} relative group`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-bold ${isFullscreen ? 'break-words' : 'truncate'}`} title={header || `Column ${index + 1}`}>
                        {header || `Column ${index + 1}`}
                      </span>
                    </div>
                    {/* Column resize indicator */}
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-col-resize" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(debouncedSearchTerm ? filteredData : data).map((row, rowIndex) => {
              const adjustedRowIndex = fileType === 'csv' ? rowIndex : rowIndex;
              return (
                <tr 
                  key={rowIndex} 
                  className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-150 ${
                    rowIndex % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-900/30'
                  } group`}
                >
                  {/* Row number */}
                  <td className={`w-10 sm:w-16 text-center px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-xs font-medium border-r border-slate-200 dark:border-slate-700 sticky left-0 z-10 ${
                    rowIndex % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-700'
                  } text-slate-600 dark:text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700`}>
                    {adjustedRowIndex + 1}
                  </td>
                  {headers.map((_, colIndex) => {
                    const cell = getCellValue(row[colIndex]);
                    
                    return (
                      <td 
                        key={colIndex} 
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${isFullscreen ? 'min-w-[150px] max-w-[300px]' : 'min-w-[80px] sm:min-w-[120px] max-w-[120px] sm:max-w-[200px]'} relative group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/30 transition-colors ${getCellStyling(cell.type)}`}
                      >
                        <div className={`text-center ${isFullscreen ? 'break-words whitespace-normal' : 'truncate'}`} title={!isFullscreen ? (cell.value || 'Empty') : undefined}>
                          {cell.type === 'empty' ? (
                            <span className="text-slate-300 dark:text-slate-600 italic text-xs">—</span>
                          ) : cell.type === 'url' ? (
                            <a 
                              href={formatUrl(cell.value)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-info transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {cell.value}
                            </a>
                          ) : (
                            <span className={cell.type === 'number' ? 'font-mono' : ''}>
                              {cell.value}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};