import { useState } from 'react';
import { useLeaveCalendar } from '../../hooks/useLeave';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { cn, formatDate } from '../../lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, ChevronRight as ChevronRightIcon, ArrowUpRight, Activity, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function LeaveCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase();
  const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  const { data: events, isLoading, isError, error, refetch } = useLeaveCalendar(fromDate, toDate);

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
  if (isError) return <ErrorState message={(error as any).error || 'CRITICAL_CALENDAR_SYNC_FAILURE'} onRetry={refetch} />;

  return (
    <div className="space-y-24">
      <header className="flex items-center justify-between border-b border-border-strong pb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3 label-mono">
            <span>LEAVE_MODULE</span>
            <ChevronRightIcon className="h-3 w-3 text-accent-base" />
            <span>GLOBAL_TEMPORAL_VIEW</span>
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-ink-base uppercase">
            LEAVE_CALENDAR
          </h1>
        </div>
        <div className="flex items-center gap-1 border border-border-base bg-paper-raised p-2 shadow-sharp">
          <Button variant="ghost" size="sm" onClick={prevMonth} className="h-10 w-10 p-0">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="label-mono text-xs font-black px-6 min-w-[200px] text-center italic">
            {monthName} // {year}
          </span>
          <Button variant="ghost" size="sm" onClick={nextMonth} className="h-10 w-10 p-0">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <section className="space-y-12">
        <div className="border border-border-base bg-paper-raised overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border-base bg-paper-sunken/50">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="py-4 text-center label-mono text-[10px] opacity-50 border-r border-border-base last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[140px]">
            {days.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <div 
                  key={idx} 
                  className={cn(
                    "border-r border-b border-border-base p-4 transition-all duration-300 group",
                    !day && "bg-paper-sunken/20",
                    day && "hover:bg-paper-sunken/40"
                  )}
                >
                  {day && (
                    <div className="h-full flex flex-col">
                      <span className={cn(
                        "inline-flex items-center justify-center h-8 w-8 label-mono text-xs font-black border transition-all",
                        isToday 
                          ? "bg-ink-base text-paper-raised border-ink-base rotate-3" 
                          : "text-ink-muted border-transparent group-hover:border-border-base"
                      )}>
                        {day.toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 overflow-y-auto mt-4 space-y-1 custom-scrollbar">
                        {dayEvents.map((event, eIdx) => (
                          <div 
                            key={eIdx}
                            className="px-2 py-1.5 border border-border-base bg-paper-raised label-mono text-[8px] font-black truncate hover:border-accent-base hover:text-accent-base cursor-default transition-colors flex items-center gap-2"
                            title={`${event.employee_id} - ${event.policy?.name ?? `POLICY_${event.policy_id}`}`}
                          >
                            <span className="h-1 w-1 bg-accent-base shrink-0" />
                            {event.employee_id}
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
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
        <section className="lg:col-span-1 space-y-12">
          <div className="flex items-center justify-between border-b border-border-strong pb-6">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">UPCOMING_NODES</h2>
            <Activity className="h-6 w-6 text-accent-base" />
          </div>
          
          <div className="space-y-4">
            {events?.filter(e => new Date(e.start_date) >= new Date() && e.status === 'approved').slice(0, 5).map(event => (
              <div key={event.id} className="p-6 border border-border-base bg-paper-raised group hover:border-ink-base transition-all flex items-center gap-6">
                <div className="h-10 w-10 bg-paper-sunken border border-border-base flex items-center justify-center text-ink-faint group-hover:bg-ink-base group-hover:border-ink-base group-hover:text-paper-raised transition-all shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black tracking-tighter uppercase italic truncate">{event.employee_id}</p>
                  <p className="font-mono text-[9px] text-ink-faint truncate">
                    {formatDate(event.start_date).toUpperCase()} — {formatDate(event.end_date).toUpperCase()}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-faint group-hover:text-accent-base transition-colors shrink-0" />
              </div>
            ))}
            {(!events || events.filter(e => new Date(e.start_date) >= new Date() && e.status === 'approved').length === 0) && (
              <div className="border border-dashed border-border-base p-16 text-center bg-paper-sunken/30">
                <p className="label-mono opacity-30 italic">NO_UPCOMING_NODES_IDENTIFIED</p>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-2 space-y-12">
          <div className="flex items-center justify-between border-b border-border-strong pb-6">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">CALENDAR_LEGEND</h2>
            <ShieldCheck className="h-6 w-6 text-ink-faint" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-paper-sunken/30 border border-border-base space-y-4">
              <p className="label-mono text-accent-base">APPROVED_PROTOCOL</p>
              <p className="text-sm text-ink-muted leading-relaxed">
                Nodes displayed in the calendar grid represent verified and authorized leave requests. 
                Data state is final for these temporal blocks.
              </p>
            </div>
            <div className="p-8 border border-border-base space-y-6">
              <p className="label-mono">VIEW_OPERATIONS</p>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 bg-accent-base" />
                  <span className="label-mono text-[10px]">ACTIVE_LEAVE_BLOCK</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 bg-ink-base" />
                  <span className="label-mono text-[10px]">CURRENT_TEMPORAL_MARKER</span>
                </div>
                <div className="flex items-center gap-4 opacity-30">
                  <div className="h-2 w-2 bg-border-base" />
                  <span className="label-mono text-[10px]">INACTIVE_TEMPORAL_SPACE</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
