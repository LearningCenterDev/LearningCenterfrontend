import CourseCard from '../CourseCard';

export default function CourseCardExample() {
  // todo: remove mock functionality
  const handleEnroll = () => console.log('Enroll clicked');
  const handleView = () => console.log('View course clicked');

  return (
    <div className="p-4 space-y-6 max-w-md">
      <CourseCard
        title="Advanced Mathematics"
        description="Deep dive into calculus, algebra, and geometric principles with real-world applications."
        instructor="Dr. Sarah Wilson"
        enrolledStudents={24}
        duration="12 weeks"
        schedule="Mon, Wed, Fri 10:00 AM"
        progress={65}
        status="active"
        onView={handleView}
        userRole="student"
      />
      
      <CourseCard
        title="Physics Fundamentals"
        description="Introduction to mechanics, thermodynamics, and electromagnetic theory."
        instructor="Prof. Michael Chen"
        enrolledStudents={18}
        duration="10 weeks"
        schedule="Tue, Thu 2:00 PM"
        status="upcoming"
        onEnroll={handleEnroll}
        onView={handleView}
        userRole="student"
      />
    </div>
  );
}