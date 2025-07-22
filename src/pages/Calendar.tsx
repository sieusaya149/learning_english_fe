import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Trophy, Flame, Clock, Target, BookOpen, Video, Star, TrendingUp } from 'lucide-react';
import { useUser, DayProgress } from '../hooks/useUser';
import clsx from 'clsx';

const Calendar: React.FC = () => {
  const { 
    practiceStats, 
    practiceHistory, 
    achievements,
    loading, 
    error, 
    isAuthenticated, 
    getCalendarData, 
    getStreakInfo 
  } = useUser();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayProgress | null>(null);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please log in to view your progress calendar.</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarData = getCalendarData(year, month);
  const streakInfo = getStreakInfo();

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(null);
  };

  // Calendar generation
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      day,
      dateStr,
      data: calendarData[dateStr]
    });
  }

  // Get practice intensity color
  const getPracticeIntensity = (dayData: DayProgress) => {
    const sessions = dayData.sessions;
    if (sessions === 0) return 'bg-gray-100';
    if (sessions === 1) return 'bg-green-200';
    if (sessions === 2) return 'bg-green-300';
    if (sessions >= 3) return 'bg-green-500';
    return 'bg-gray-100';
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="fade-in">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          Progress Calendar
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Streak</p>
                <p className="text-2xl font-bold text-orange-600">{streakInfo.current} days</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Streak</p>
                <p className="text-2xl font-bold text-green-600">{streakInfo.best} days</p>
              </div>
              <Trophy className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Practice</p>
                <p className="text-2xl font-bold text-blue-600">
                  {practiceStats ? formatMinutes(practiceStats.total_minutes) : '0m'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-purple-600">
                  {practiceStats?.total_sessions || 0}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {monthNames[month]} {year}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(dayName => (
                  <div key={dayName} className="p-2 text-center text-sm font-medium text-gray-500">
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((calendarDay, index) => {
                  if (!calendarDay) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const { day, dateStr, data } = calendarDay;
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDay?.date === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(data)}
                      className={clsx(
                        'aspect-square p-1 rounded-md text-sm font-medium transition-all hover:ring-2 hover:ring-blue-300',
                        getPracticeIntensity(data),
                        isToday && 'ring-2 ring-blue-500',
                        isSelected && 'ring-2 ring-orange-500',
                        data.sessions > 0 ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <span>{day}</span>
                        {data.sessions > 0 && (
                          <span className="text-xs opacity-80">{data.sessions}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-4">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-300 rounded-sm"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                  </div>
                  <span>More</span>
                </div>
                <span>Sessions per day</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Day Details */}
            {selectedDay && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sessions</span>
                    <span className="font-medium">{selectedDay.sessions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Practice Time</span>
                    <span className="font-medium">{formatMinutes(selectedDay.minutes)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Phrases</span>
                    <span className="font-medium">{selectedDay.phrases_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Videos</span>
                    <span className="font-medium">{selectedDay.videos_count}</span>
                  </div>
                  {selectedDay.score_average > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Avg Score</span>
                      <span className="font-medium">{selectedDay.score_average.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Achievements */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Recent Achievements
              </h3>
              
              {achievements.length > 0 ? (
                <div className="space-y-3">
                  {achievements.slice(0, 3).map(achievement => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No achievements yet. Keep practicing!</p>
              )}
            </div>

            {/* Monthly Summary */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Sessions</span>
                  </div>
                  <span className="font-medium">
                    {Object.values(calendarData).reduce((sum, day) => sum + day.sessions, 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Time</span>
                  </div>
                  <span className="font-medium">
                    {formatMinutes(Object.values(calendarData).reduce((sum, day) => sum + day.minutes, 0))}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Phrases</span>
                  </div>
                  <span className="font-medium">
                    {Object.values(calendarData).reduce((sum, day) => sum + day.phrases_count, 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Videos</span>
                  </div>
                  <span className="font-medium">
                    {Object.values(calendarData).reduce((sum, day) => sum + day.videos_count, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar; 