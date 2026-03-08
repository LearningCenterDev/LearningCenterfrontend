import ParentDashboard from '../ParentDashboard';

export default function ParentDashboardExample() {
  // todo: remove mock functionality
  const mockChildren = [
    {
      id: '1',
      name: 'Emma Davis',
      grade: 'Grade 11',
      averageScore: 88.5,
      attendanceRate: 95.2
    },
    {
      id: '2', 
      name: 'Alex Davis',
      grade: 'Grade 9',
      averageScore: 85.3,
      attendanceRate: 92.8
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ParentDashboard 
        parentName="Jennifer Davis"
        children={mockChildren}
      />
    </div>
  );
}