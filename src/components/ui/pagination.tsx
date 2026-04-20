import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/lib/ui-variants";
import { COMMON_MESSAGES } from "@/config/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center items-center py-2", className)} {...props} />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul ref={ref} className={cn("flex flex-row items-center justify-center gap-2", className)} {...props} />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => <li ref={ref} className={cn("flex-shrink-0", className)} {...props} />);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size: "icon",
      }),
      "h-10 w-10 flex items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
      isActive && "border-primary bg-primary/10 text-primary font-semibold",
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label={COMMON_MESSAGES.LABELS.PREVIOUS_PAGE}
    className={cn("gap-1 h-10 px-4 py-2 w-auto min-w-[90px] flex items-center justify-center rounded-md border-0 transition-colors hover:bg-accent hover:text-accent-foreground", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>{COMMON_MESSAGES.LABELS.PREVIOUS}</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label={COMMON_MESSAGES.LABELS.NEXT_PAGE}
    className={cn("gap-1 h-10 px-4 py-2 w-auto min-w-[70px] flex items-center justify-center rounded-md border-0 transition-colors hover:bg-accent hover:text-accent-foreground", className)}
    {...props}
  >
    <span>{COMMON_MESSAGES.LABELS.NEXT}</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

// Enhanced pagination component with page size selector
interface PaginationWithPageSizeProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showItemsInfo?: boolean;
  className?: string;
}

const PaginationWithPageSize = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showItemsInfo = true,
  className,
}: PaginationWithPageSizeProps) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    
    // Responsive page limits based on screen size
    const getMaxVisible = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        if (width < 640) return 3; // sm breakpoint - show only 3 pages on mobile
        if (width < 768) return 5; // md breakpoint - show 5 pages on small tablets
        if (width < 1024) return 6; // lg breakpoint - show 6 pages on tablets
        return 7; // show 7 pages on desktop
      }
      return 5; // default fallback
    };

    const maxVisible = getMaxVisible();
    
    // If we have fewer pages than max, show all
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)} className="cursor-pointer">
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return pages;
    }

    // For mobile, just show prev/current/next pattern
    if (maxVisible <= 3) {
      if (currentPage > 1) {
        pages.push(
          <PaginationItem key={currentPage - 1}>
            <PaginationLink onClick={() => onPageChange(currentPage - 1)} className="cursor-pointer">
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      pages.push(
        <PaginationItem key={currentPage}>
          <PaginationLink isActive={true} onClick={() => onPageChange(currentPage)} className="cursor-pointer">
            {currentPage}
          </PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage < totalPages) {
        pages.push(
          <PaginationItem key={currentPage + 1}>
            <PaginationLink onClick={() => onPageChange(currentPage + 1)} className="cursor-pointer">
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      return pages;
    }

    // Desktop/tablet logic with first/last pages
    pages.push(
      <PaginationItem key={1}>
        <PaginationLink isActive={currentPage === 1} onClick={() => onPageChange(1)} className="cursor-pointer">
          1
        </PaginationLink>
      </PaginationItem>
    );

    const remainingSlots = maxVisible - 2;
    const sidePages = Math.floor(remainingSlots / 2);
    
    let start = Math.max(2, currentPage - sidePages);
    let end = Math.min(totalPages - 1, currentPage + sidePages);
    
    if (currentPage <= sidePages + 1) {
      end = Math.min(totalPages - 1, maxVisible - 1);
    }
    if (currentPage >= totalPages - sidePages) {
      start = Math.max(2, totalPages - maxVisible + 2);
    }

    if (start > 2) {
      pages.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={currentPage === i} onClick={() => onPageChange(i)} className="cursor-pointer">
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages - 1) {
      pages.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink isActive={currentPage === totalPages} onClick={() => onPageChange(totalPages)} className="cursor-pointer">
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  if (totalPages <= 1 && !showItemsInfo && !showPageSizeSelector) {
    return null;
  }

  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex flex-col gap-4">
        {/* Top row - page size selector and items info */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left side - page size selector */}
          {showPageSizeSelector && (
            <div className="flex items-center gap-3 whitespace-nowrap">
              <span className="text-sm text-muted-foreground font-medium">Items per page:</span>
              <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                <SelectTrigger className="w-20 h-9 text-sm bg-background border-border/60 hover:border-border focus:ring-0 focus:border-primary shadow-sm transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[80px] bg-background border-border/60 shadow-lg">
                  {pageSizeOptions.map((size) => (
                    <SelectItem 
                      key={size} 
                      value={size.toString()}
                      className="text-sm cursor-pointer hover:bg-accent/50 focus:bg-accent transition-colors py-2"
                    >
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Right side - items info */}
          {showItemsInfo && (
            <div className="text-sm text-muted-foreground">
              Showing {startItem} to {endItem} of {totalItems} item{totalItems !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Bottom row - pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center w-full">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => onPageChange(Math.max(1, currentPage - 1))} className={cn("cursor-pointer", currentPage === 1 && "pointer-events-none opacity-50")} />
                </PaginationItem>

                <div className="flex items-center gap-1">{renderPageNumbers()}</div>

                <PaginationItem>
                  <PaginationNext onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} className={cn("cursor-pointer", currentPage === totalPages && "pointer-events-none opacity-50")} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationWithPageSize };
