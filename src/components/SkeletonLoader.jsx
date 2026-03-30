const SkeletonLoader = () => {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 rounded-lg h-32 mb-4"></div>
      <div className="space-y-3">
        <div className="bg-gray-200 rounded h-4 w-3/4"></div>
        <div className="bg-gray-200 rounded h-4 w-1/2"></div>
        <div className="bg-gray-200 rounded h-4 w-5/6"></div>
      </div>
    </div>
  );
};

export const TableSkeleton = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex space-x-4">
        <div className="bg-gray-200 rounded-full h-10 w-10"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-gray-200 rounded h-4 w-3/4"></div>
          <div className="bg-gray-200 rounded h-3 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;