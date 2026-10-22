import React from 'react';
import Card from './Card';

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg = 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  trend,
  trendType = 'neutral',
  onClick
}) => {
  return (
    <Card
      hover={!!onClick}
      onClick={onClick}
      className="p-5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#667085] dark:text-[#9CA3AF]">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold text-[#172033] dark:text-[#F3F4F6] tracking-tight">
          {value}
        </h3>
        {(subtext || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#667085] dark:text-[#9CA3AF]">
            {trend && (
              <span
                className={`font-medium ${
                  trendType === 'positive'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trendType === 'negative'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500'
                }`}
              >
                {trend}
              </span>
            )}
            {subtext && <span>{subtext}</span>}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
