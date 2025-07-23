import React from 'react';

// Base skeleton wrapper component
const SkeletonWrapper: React.FC<{ className?: string; children?: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`animate-pulse ${className}`}>
    {children}
  </div>
);

// Basic skeleton elements
export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-4 bg-gray-200 rounded ${className}`} />
);

export const SkeletonCircle: React.FC<{ size?: string }> = ({ size = 'w-12 h-12' }) => (
  <div className={`${size} bg-gray-200 rounded-full`} />
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-10 bg-gray-200 rounded-md ${className}`} />
);

// Phrase Card Skeleton
export const PhraseCardSkeleton: React.FC = () => (
  <SkeletonWrapper className="card p-6">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <SkeletonLine className="h-6 w-3/4 mb-2" />
        <SkeletonLine className="h-4 w-1/2" />
      </div>
      <SkeletonCircle size="w-8 h-8" />
    </div>
    
    <div className="space-y-2 mb-4">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-1/4" />
    </div>

    <div className="flex items-center gap-2 mb-4">
      <SkeletonCircle size="w-6 h-6" />
      <SkeletonCircle size="w-6 h-6" />
      <SkeletonCircle size="w-6 h-6" />
    </div>

    <div className="space-y-2">
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>

    <div className="flex justify-between items-center mt-4">
      <SkeletonButton className="w-20" />
      <SkeletonButton className="w-16" />
    </div>
  </SkeletonWrapper>
);

// Phrase Grid Skeleton
export const PhraseGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <PhraseCardSkeleton key={index} />
    ))}
  </div>
);

// Calendar Skeleton
export const CalendarSkeleton: React.FC = () => (
  <SkeletonWrapper>
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine className="h-7 w-40" />
        <div className="flex gap-2">
          <SkeletonCircle size="w-8 h-8" />
          <SkeletonButton className="w-16 h-8" />
          <SkeletonCircle size="w-8 h-8" />
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="p-2 text-center">
            <SkeletonLine className="h-4 w-8 mx-auto" />
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square p-1">
            <SkeletonCircle size="w-full h-full" />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SkeletonLine className="w-8" />
          <div className="flex gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCircle key={i} size="w-3 h-3" />
            ))}
          </div>
          <SkeletonLine className="w-8" />
        </div>
        <SkeletonLine className="w-24" />
      </div>
    </div>
  </SkeletonWrapper>
);

// Stats Card Skeleton
export const StatsCardSkeleton: React.FC = () => (
  <SkeletonWrapper className="card p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <SkeletonLine className="h-4 w-20 mb-2" />
        <SkeletonLine className="h-8 w-16" />
      </div>
      <SkeletonCircle size="w-8 h-8" />
    </div>
  </SkeletonWrapper>
);

// Stats Grid Skeleton
export const StatsGridSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <StatsCardSkeleton key={index} />
    ))}
  </div>
);

// Profile Card Skeleton
export const ProfileCardSkeleton: React.FC = () => (
  <SkeletonWrapper className="card p-6">
    <div className="flex items-center justify-between mb-6">
      <SkeletonLine className="h-6 w-32" />
      <SkeletonButton className="w-16" />
    </div>

    <div className="flex items-center gap-4 mb-4">
      <SkeletonCircle size="w-16 h-16" />
      <div className="flex-1">
        <SkeletonLine className="h-5 w-32 mb-2" />
        <SkeletonLine className="h-4 w-48" />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
      <div className="flex items-center gap-2">
        <SkeletonCircle size="w-4 h-4" />
        <SkeletonLine className="w-24" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonCircle size="w-4 h-4" />
        <SkeletonLine className="w-16" />
      </div>
    </div>

    <div className="pt-4">
      <SkeletonLine className="w-full mb-2" />
      <SkeletonLine className="w-3/4" />
    </div>
  </SkeletonWrapper>
);

// Sidebar Content Skeleton
export const SidebarSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Selected day card */}
    <SkeletonWrapper className="card p-6">
      <SkeletonLine className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <SkeletonLine className="w-20" />
            <SkeletonLine className="w-12" />
          </div>
        ))}
      </div>
    </SkeletonWrapper>

    {/* Achievements card */}
    <SkeletonWrapper className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <SkeletonCircle size="w-5 h-5" />
        <SkeletonLine className="h-5 w-24" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <SkeletonCircle size="w-8 h-8" />
            <div className="flex-1">
              <SkeletonLine className="w-24 mb-1" />
              <SkeletonLine className="w-32" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonWrapper>
  </div>
);

// Form Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <SkeletonWrapper className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <SkeletonLine className="h-4 w-20 mb-2" />
        <SkeletonLine className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end">
      <SkeletonButton className="w-32" />
    </div>
  </SkeletonWrapper>
);

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <SkeletonWrapper>
    <div className="space-y-8">
      {/* Header */}
      <SkeletonLine className="h-8 w-48" />
      
      {/* Stats grid */}
      <StatsGridSkeleton count={3} />
      
      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <SkeletonCircle size="w-12 h-12" />
              <div className="flex-1">
                <SkeletonLine className="h-5 w-32 mb-2" />
                <SkeletonLine className="h-4 w-24" />
              </div>
            </div>
            <SkeletonLine className="w-full mb-2" />
            <SkeletonLine className="w-3/4 mb-4" />
            <SkeletonButton className="w-24" />
          </div>
        ))}
      </div>
    </div>
  </SkeletonWrapper>
);

// Loading overlay for entire pages
export const PageLoadingSkeleton: React.FC<{ type?: 'dashboard' | 'calendar' | 'profile' | 'phrases' }> = ({ 
  type = 'dashboard' 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'calendar':
        return (
          <div className="space-y-8">
            <SkeletonLine className="h-8 w-48" />
            <StatsGridSkeleton />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <CalendarSkeleton />
              </div>
              <div>
                <SidebarSkeleton />
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-8">
            <SkeletonLine className="h-8 w-32" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <ProfileCardSkeleton />
                <ProfileCardSkeleton />
              </div>
              <div className="space-y-6">
                <StatsCardSkeleton />
                <div className="card p-6">
                  <SkeletonLine className="h-5 w-24 mb-4" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <SkeletonCircle size="w-6 h-6" />
                        <SkeletonLine className="w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'phrases':
        return (
          <div className="space-y-8">
            <SkeletonLine className="h-8 w-48" />
            <div className="flex gap-4 mb-6">
              <SkeletonButton className="w-32" />
              <SkeletonButton className="w-24" />
              <SkeletonButton className="w-20" />
            </div>
            <PhraseGridSkeleton />
          </div>
        );
      default:
        return <DashboardSkeleton />;
    }
  };

  return (
    <div className="fade-in">
      <div className="max-w-6xl mx-auto">
        {renderSkeleton()}
      </div>
    </div>
  );
}; 