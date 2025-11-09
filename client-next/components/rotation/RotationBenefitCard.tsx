'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { RotationBenefit } from '@/types/rotation';

interface Props {
  benefit: RotationBenefit;
}

export default function RotationBenefitCard({ benefit }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Sparkles className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-green-800">
              {benefit.category}
            </span>
          </div>
          <p className="mt-1 font-medium text-green-800">
            {benefit.message}
          </p>
          <p className="mt-1 text-sm text-green-700">
            <strong>✨ Impact:</strong> {benefit.impact}
          </p>
        </div>
      </div>

      {/* Detailed Explanation */}
      {benefit.detailedExplanation && (
        <p className="mt-3 text-sm text-green-800 opacity-90 leading-relaxed">
          {benefit.detailedExplanation}
        </p>
      )}

      {/* Read More Section */}
      {(benefit.expectedResults || benefit.timeframe) && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm font-medium text-green-800 hover:underline"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Show less' : 'See expected results'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {/* Expected Results */}
              {benefit.expectedResults && benefit.expectedResults.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-800 mb-2">
                    📊 Expected Results
                  </h4>
                  <ul className="text-sm text-green-800 opacity-90 space-y-1">
                    {benefit.expectedResults.map((result, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>✓</span>
                        <span>{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeframe */}
              {benefit.timeframe && (
                <div className="text-xs text-green-700 pt-2 border-t border-green-200">
                  <strong>⏱️ Timeframe:</strong> {benefit.timeframe}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
