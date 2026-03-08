import AssignmentCard from '../AssignmentCard';

export default function AssignmentCardExample() {
  // todo: remove mock functionality
  const handleSubmit = () => console.log('Submit assignment clicked');
  const handleView = () => console.log('View assignment clicked');
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="p-4 space-y-6 max-w-md">
      <AssignmentCard
        title="Calculus Problem Set #3"
        description="Solve differential equations and integration problems from Chapter 8."
        subject="Mathematics"
        dueDate={tomorrow}
        status="pending"
        onSubmit={handleSubmit}
        onView={handleView}
        userRole="student"
      />
      
      <AssignmentCard
        title="Physics Lab Report"
        description="Write a comprehensive report on the pendulum experiment conducted in class."
        subject="Physics"
        dueDate={lastWeek}
        submittedDate={yesterday}
        grade={85}
        maxGrade={100}
        status="graded"
        teacherComment="Excellent analysis! Your methodology was thorough and conclusions well-supported."
        onView={handleView}
        userRole="student"
      />
      
      <AssignmentCard
        title="History Essay"
        description="Analyze the causes and effects of World War II on global economics."
        subject="History"
        dueDate={yesterday}
        status="overdue"
        onSubmit={handleSubmit}
        onView={handleView}
        userRole="student"
      />
    </div>
  );
}