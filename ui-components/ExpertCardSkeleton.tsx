import { FC } from 'react';

const ExpertCardSkeleton: FC = () => {
  return (
    <div className="bg-white rounded-[22px] px-9 py-[30px] text-center flex flex-col items-center h-full animate-pulse">
      {/* Avatar skeleton */}
      <div className="relative w-20 h-20 mb-4">
        <div className="w-full h-full bg-gray-200 rounded-full"></div>
      </div>

      {/* Name skeleton */}
      <div className="h-5 bg-gray-200 rounded w-32 mb-1.5"></div>

      {/* Role skeleton */}
      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>

      {/* Button skeleton */}
      <div className="mt-auto w-full h-9 bg-gray-200 rounded-full"></div>
    </div>
  );
};

export default ExpertCardSkeleton;
