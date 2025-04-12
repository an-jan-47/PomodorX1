import { Skeleton } from "@/components/ui/skeleton";

const ChartSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      <Skeleton className="h-[400px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  );
};

export default ChartSkeleton;