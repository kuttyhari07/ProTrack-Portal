import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[14px] border border-dashed border-[#E4E7EC] dark:border-[#374151] bg-white/50 dark:bg-[#111827]/40">
      {Icon && (
        <div className="p-3.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-[#667085] dark:text-[#9CA3AF] mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[#172033] dark:text-[#F3F4F6]">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[#667085] dark:text-[#9CA3AF]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" onClick={onAction} icon={ActionIcon}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
