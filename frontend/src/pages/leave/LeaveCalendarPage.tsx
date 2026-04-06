import { useState } from 'react';
import { useLeaveCalendarRange } from '../../hooks/useLeave';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { cn, formatDate } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  const { data: events, isLoading, isError, error, refetch } = useLeaveCalendarRange(fromDate, toDate);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  // Padding for previous month
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getEventsForDay = (day: number) => {
    if (!events) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => {
      const start = event.start_date.split('T')[0];
      const end = event.end_date.split('T')[0];
      return dateStr >= start && dateStr <= end && event.status === 'approved';
    });
  };

  if (isLoading) return <Loader fullPage />;
  if (isError) return <ErrorState message={(error as any).error || 'Failed to load calendar'} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leave Calendar</h1>
          <p className="text-slate-500">View all approved leave requests in a monthly calendar.</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold px-4 min-w-[140px] text-center">
            {monthName} {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {days.map((day, idx) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div 
                key={idx} 
                className={cn(
                  "border-r border-b border-slate-100 p-2 transition-colors",
                  !day && "bg-slate-50/50",
                  day && "hover:bg-slate-50/30"
                )}
              >
                {day && (
                  <div className="h-full flex flex-col">
                    <span className={cn(
                      "inline-flex items-center justify-center h-6 w-6 text-xs font-medium rounded-full mb-1",
                      isToday ? "bg-indigo-600 text-white" : "text-slate-600"
                    )}>
                      {day}
                    </span>
                    <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                      {dayEvents.map((event, eIdx) => (
                        <div 
                          key={eIdx}
                          className="px-1.5 py-0.5 rounded bg-indigo-50 border-l-2 border-indigo-500 text-[10px] text-indigo-700 truncate"
                          title={`${event.employee_name} - ${event.policy_name}`}
                        >
                          <span className="font-bold">{event.employee_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900">Upcoming Leaves</h3>
          </div>
          <div className="space-y-4">
            {events?.filter(e => new Date(e.start_date) >= new Date() && e.status === 'approved').slice(0, 5).map(event => (
              <div key={event.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{event.employee_name}</p>
                  <p className="text-xs text-slate-500">{formatDate(event.start_date)} - {formatDate(event.end_date)}</p>
                </div>
              </div>
            ))}
            {(!events || events.filter(e => new Date(e.start_date) >= new Date() && e.status === 'approved').length === 0) && (
              <p className="text-sm text-slate-500 italic">No upcoming leaves scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
