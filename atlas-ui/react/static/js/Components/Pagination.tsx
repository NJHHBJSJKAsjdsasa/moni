// atlas-ui/react/static/js/Components/Pagination.tsx
import React, { useState, useEffect } from "react";
import { LocationBookmarks } from "../Utils/LocationBookmarks.tsx";
import { StargateGenerator } from "../Utils/StargateGenerator.tsx";

interface PaginationProps {
  page: number;
  prevPage?: number;
  nextPage?: number;
  finish: number;
  galaxyCoordinates?: number[];
}

const Pagination: React.FC<PaginationProps> = ({ page, prevPage, nextPage, finish, galaxyCoordinates }) => {
  const [savedPages, setSavedPages] = useState<Set<number>>(new Set());

  const baseClasses = "px-4 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105";
  const activeClasses = "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg";
  const inactiveClasses = "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20";

  const checkIfPageSaved = (pageNum: number): boolean => {
    if (!galaxyCoordinates) return false;
    try {
      const stargateUrl = StargateGenerator.generateGalaxyUrl(galaxyCoordinates, pageNum);
      return LocationBookmarks.isLocationSaved(stargateUrl);
    } catch (error) {
      return false;
    }
  };

  const updateSavedPages = () => {
    if (galaxyCoordinates) {
      const newSavedPages = new Set<number>();

      const range = 2;
      const start = Math.max(1, page - range);
      const end = Math.min(finish, page + range);

      if (start > 1) {
        if (checkIfPageSaved(1)) {
          newSavedPages.add(1);
        }
      }

      for (let i = start; i <= end; i++) {
        if (checkIfPageSaved(i)) {
          newSavedPages.add(i);
        }
      }

      if (end < finish) {
        if (checkIfPageSaved(finish)) {
          newSavedPages.add(finish);
        }
      }

      setSavedPages(newSavedPages);
    }
  };

  useEffect(() => {
    updateSavedPages();
  }, [page, galaxyCoordinates, finish]);

  useEffect(() => {
    const handleLocationSaved = (event: CustomEvent) => {
      const savedLocation = event.detail.location;

      if (savedLocation.type === "galaxy" && galaxyCoordinates) {
        try {
          const parts = savedLocation.stargateUrl.split("/stargate/")[1];
          if (parts) {
            const decoded = atob(parts.replace(/-/g, "+").replace(/_/g, "/"));
            const params = new URLSearchParams(decoded);
            const coordinates = params.get("coordinates");

            if (coordinates === galaxyCoordinates.join(",")) {
              updateSavedPages();
            }
          }
        } catch (error) {
          updateSavedPages();
        }
      }
    };

    window.addEventListener("locationSaved", handleLocationSaved as EventListener);

    return () => {
      window.removeEventListener("locationSaved", handleLocationSaved as EventListener);
    };
  }, [galaxyCoordinates, page, finish]);

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl p-4 sm:p-6 mb-8">
      <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
        {page !== 1 && (
          <button onClick={() => (window.location.href = "/galaxy/1")} className={`${baseClasses} ${inactiveClasses}`} title="First page">
            <span className="hidden sm:inline">First</span>
            <span className="sm:hidden">«</span>
          </button>
        )}

        {prevPage && (
          <button onClick={() => (window.location.href = `/galaxy/${prevPage}`)} className={`${baseClasses} ${inactiveClasses}`} title="Previous page">
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">‹</span>
          </button>
        )}

        {(() => {
          const pages = [];
          const range = 2;
          const start = Math.max(1, page - range);
          const end = Math.min(finish, page + range);

          if (start > 1) {
            pages.push(
              <button key={1} onClick={() => (window.location.href = "/galaxy/1")} className={`${baseClasses} ${inactiveClasses} relative`}>
                1{savedPages.has(1) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-green-400 shadow-sm" title="This page is saved"></div>}
              </button>
            );
            if (start > 2) {
              pages.push(
                <span key="start-ellipsis" className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
          }

          for (let i = start; i <= end; i++) {
            if (i === page) {
              pages.push(
                <span key={i} className={`${baseClasses} ${activeClasses} cursor-default relative`}>
                  {i}
                  {savedPages.has(i) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-green-400 shadow-sm" title="This page is saved"></div>}
                </span>
              );
            } else {
              pages.push(
                <button key={i} onClick={() => (window.location.href = `/galaxy/${i}`)} className={`${baseClasses} ${inactiveClasses} cursor-pointer relative`}>
                  {i}
                  {savedPages.has(i) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-green-400 shadow-sm" title="This page is saved"></div>}
                </button>
              );
            }
          }

          if (end < finish) {
            if (end < finish - 1) {
              pages.push(
                <span key="end-ellipsis" className="px-2 text-gray-400">
                  ...
                </span>
              );
            }
            pages.push(
              <button key={finish} onClick={() => (window.location.href = `/galaxy/${finish}`)} className={`${baseClasses} ${inactiveClasses} relative`}>
                {finish}
                {savedPages.has(finish) && <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-green-400 shadow-sm" title="This page is saved"></div>}
              </button>
            );
          }

          return pages;
        })()}

        {nextPage && (
          <button onClick={() => (window.location.href = `/galaxy/${nextPage}`)} className={`${baseClasses} ${inactiveClasses}`} title="Next page">
            <span className="hidden sm:inline">Next</span>
            <span className="sm:hidden">›</span>
          </button>
        )}

        {page !== finish && (
          <button onClick={() => (window.location.href = `/galaxy/${finish}`)} className={`${baseClasses} ${inactiveClasses}`} title="Last page">
            <span className="hidden sm:inline">Last</span>
            <span className="sm:hidden">»</span>
          </button>
        )}
      </div>

      <div className="text-center mt-4 text-sm text-gray-400">
        Page {page} of {finish}
      </div>
    </div>
  );
};

export default Pagination;
