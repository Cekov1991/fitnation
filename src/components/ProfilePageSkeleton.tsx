import { Skeleton } from './ui/Skeleton';

function FieldSkeleton() {
  return (
    <div>
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-14 w-full rounded-xl" />
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div aria-busy aria-label="Loading profile">
      <div className="mb-8">
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-52 mb-4" />
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </div>

      <div className="mb-8">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="space-y-6">
          <div>
            <Skeleton className="h-3 w-40 mb-3" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-3 w-full max-w-xs mt-2" />
          </div>
          <div>
            <Skeleton className="h-3 w-32 mb-2" />
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Skeleton className="h-14 w-full rounded-2xl mb-4" />
    </div>
  );
}
