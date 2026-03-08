import StatCard from '../StatCard';
import { Users, BookOpen, TrendingUp, AlertTriangle } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Students"
        value={1247}
        description="Enrolled this semester"
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      
      <StatCard
        title="Active Courses"
        value={34}
        description="Currently running"
        icon={BookOpen}
        variant="success"
        trend={{ value: 5, isPositive: true }}
      />
      
      <StatCard
        title="Average Grade"
        value="87.5%"
        description="This semester"
        icon={TrendingUp}
        trend={{ value: 3.2, isPositive: true }}
      />
      
      <StatCard
        title="Overdue Assignments"
        value={23}
        description="Requiring attention"
        icon={AlertTriangle}
        variant="destructive"
        trend={{ value: -15, isPositive: false }}
      />
    </div>
  );
}