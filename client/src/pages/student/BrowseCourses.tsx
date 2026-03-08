import { useAuth } from "@/hooks/useAuth";
import { CourseBrowser } from "@/components/CourseBrowser";
import { Skeleton } from "@/components/ui/skeleton";

interface BrowseCoursesProps {
  studentId: string;
}

export default function BrowseCourses({ studentId }: BrowseCoursesProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto" data-testid="browse-courses-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Browse Courses</h1>
        <p className="text-muted-foreground">
          Discover and enroll in new courses to expand your knowledge
        </p>
      </div>
      <CourseBrowser 
        currentUser={user}
        showEnrollButton={true}
      />
    </div>
  );
}