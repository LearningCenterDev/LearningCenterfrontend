import ProgressBar from '../ProgressBar';

export default function ProgressBarExample() {
  return (
    <div className="p-4 space-y-4 max-w-sm">
      <ProgressBar 
        value={75} 
        label="Course Progress" 
        showPercentage={true}
      />
      <ProgressBar 
        value={100} 
        label="Assignment Completed" 
        variant="success"
      />
      <ProgressBar 
        value={30} 
        label="Study Time This Week" 
        variant="warning"
      />
      <ProgressBar 
        value={15} 
        label="Assignments Overdue" 
        variant="destructive"
      />
    </div>
  );
}