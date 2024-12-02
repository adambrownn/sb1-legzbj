import React from 'react';
import { Info } from 'lucide-react';

interface AnalyticsTooltipProps {
  title: string;
  content: string;
}

export function AnalyticsTooltip({ title, content }: AnalyticsTooltipProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        aria-label={`Info about ${title}`}
      >
        <Info className="h-4 w-4" />
      </button>
      {show && (
        <div className="absolute left-full top-1/2 z-50 ml-2 w-64 -translate-y-1/2 rounded-lg border bg-white p-3 shadow-lg">
          <h4 className="mb-1 font-medium">{title}</h4>
          <p className="text-sm text-gray-600">{content}</p>
        </div>
      )}
    </div>
  );
}