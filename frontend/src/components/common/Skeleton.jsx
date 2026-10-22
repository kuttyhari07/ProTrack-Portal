import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 ${className}`}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-[14px] p-5 shadow-sm space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-[14px] p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-[#E4E7EC] dark:border-[#374151]">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
