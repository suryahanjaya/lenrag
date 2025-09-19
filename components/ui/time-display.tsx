import React from 'react';

interface TimeDisplayProps {
  currentTime: Date;
  greeting: {
    emoji: string;
    color: string;
  };
  variant: 'mobile' | 'tablet' | 'desktop';
}

export function TimeDisplay({ currentTime, greeting, variant }: TimeDisplayProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCurrentDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeBoxClass = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'bg-gradient-to-br from-pink-500/50 via-pink-400/40 to-pink-200/30';
    if (hour >= 12 && hour < 15) return 'bg-gradient-to-br from-yellow-500/50 via-yellow-400/40 to-yellow-200/30';
    if (hour >= 15 && hour < 18) return 'bg-gradient-to-br from-orange-500/50 via-orange-400/40 to-orange-200/30';
    return 'bg-gradient-to-br from-blue-500/50 via-blue-400/40 to-blue-200/30';
  };

  const getTimeIconColor = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'text-pink-400';
    if (hour >= 12 && hour < 15) return 'text-yellow-400';
    if (hour >= 15 && hour < 18) return 'text-orange-400';
    return 'text-blue-400';
  };

  return (
    <div className={`${getTimeBoxClass()} time-box-${variant}`}>
      <div className={`time-display-${variant}`}>
        <div className={`time-icon-${variant}`}>
          <span className={`text-2xl ${getTimeIconColor()}`}>
            {greeting.emoji}
          </span>
        </div>
        <span className={`time-text-${variant}`}>{formatTime(currentTime)}</span>
      </div>
      <div className={`date-display-${variant}`}>
        {formatCurrentDate(currentTime)}
      </div>
    </div>
  );
}
