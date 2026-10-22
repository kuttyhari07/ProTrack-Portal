import React from 'react';

const Card = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#374151] rounded-[14px] shadow-sm transition-all duration-150 ${
        hover ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
