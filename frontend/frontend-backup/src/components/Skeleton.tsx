import React from 'react';

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  lines = 1, 
  height = 'h-4' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${height} ${
            index < lines - 1 ? 'mb-2' : ''
          }`}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" lines={1} height="h-12" />
        <div className="flex-1">
          <Skeleton className="w-3/4 mb-2" lines={1} height="h-4" />
          <Skeleton className="w-1/2" lines={1} height="h-3" />
        </div>
      </div>
      <Skeleton className="w-full mb-2" lines={1} height="h-4" />
      <Skeleton className="w-2/3" lines={1} height="h-3" />
    </div>
  );
};

export const SkeletonStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-lg mr-4" lines={1} height="h-12" />
            <div className="flex-1">
              <Skeleton className="w-3/4 mb-2" lines={1} height="h-3" />
              <Skeleton className="w-1/2" lines={1} height="h-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default Skeleton;
