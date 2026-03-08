import { useState, useEffect } from "react";
import { Calendar, Clock as ClockIcon } from "lucide-react";

export function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col h-full justify-center" data-testid="clock-container">
      <div className="flex items-center gap-1.5 mb-1">
        <ClockIcon className="w-3.5 h-3.5 text-[#2FBF71]" />
        <span className="text-xs text-muted-foreground uppercase">Local Time</span>
      </div>
      <div className="text-xl font-bold text-[#1F3A5F] dark:text-white tabular-nums leading-tight" data-testid="clock-time">
        {formatTime(currentTime)}
      </div>
      <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5" data-testid="clock-date">
        <Calendar className="w-3 h-3 text-[#2FBF71]" />
        {formatDate(currentTime)}
      </div>
    </div>
  );
}
