import { FC } from 'react';

interface ListingCardSkeletonProps {
  isLarge?: boolean;
}

const ListingCardSkeleton: FC<ListingCardSkeletonProps> = ({
  isLarge = false,
}) => {
  return (
    <div className="bg-white rounded-xl overflow-hidden flex flex-col h-full animate-pulse">
      {/* Image skeleton */}
      <div className="relative">
        <div
          className={`w-full bg-gray-200 ${
            isLarge ? 'aspect-[4/3]' : 'aspect-[4/3]'
          }`}
        ></div>

        {/* Favorite and settings buttons skeleton */}
        <div className="absolute top-2 md:top-[22px] right-2 md:right-[22px] flex flex-col space-y-2">
          <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
          <div className="w-9 h-9 bg-gray-300 rounded-full"></div>
        </div>

        {/* Carousel dots skeleton */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      <div className="flex flex-col flex-grow p-4">
        {/* Price and location skeleton */}
        <div className="flex justify-between items-center mb-3">
          <div
            className={`h-5 bg-gray-200 rounded ${isLarge ? 'w-32' : 'w-24'}`}
          ></div>
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>

        {/* Title skeleton */}
        <div className="mb-2">
          <div
            className={`h-4 bg-gray-200 rounded w-full mb-2 ${
              isLarge ? 'h-5' : ''
            }`}
          ></div>
          {isLarge && (
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          )}
        </div>

        {/* Description skeleton (only for large cards) */}
        {isLarge && (
          <div className="mb-3">
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-4/5"></div>
          </div>
        )}

        {/* Property details skeleton */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Agent and date skeleton */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center">
            <div className="rounded-full w-9 h-9 bg-gray-200 mr-2"></div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-[14px] h-[14px] bg-gray-200 rounded mr-1"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingCardSkeleton;
