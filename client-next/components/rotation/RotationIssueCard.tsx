'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { RotationIssue, IssueSeverity } from '@/types/rotation';

interface Props {
  issue: RotationIssue;
}

export default function RotationIssueCard({ issue }: Props) {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    [IssueSeverity.CRITICAL]: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
      label: 'Critical'
    },
    [IssueSeverity.WARNING]: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
      label: 'Warning'
    },
    [IssueSeverity.INFO]: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      label: 'Info'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon className={`${config.iconColor} flex-shrink-0 mt-0.5`} size={20} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase ${config.textColor}`}>
              {issue.category}
            </span>
            <span className={`text-xs ${config.textColor} opacity-75`}>
              {config.label}
            </span>
          </div>
          <p className={`mt-1 font-medium ${config.textColor}`}>
            {issue.message}
          </p>
          
          {issue.suggestion && (
            <p className={`mt-2 text-sm ${config.textColor} opacity-90`}>
              <strong>💡 Suggestion:</strong> {issue.suggestion}
            </p>
          )}
        </div>
      </div>

      {/* Detailed Explanation */}
      {issue.detailedExplanation && (
        <p className={`mt-3 text-sm ${config.textColor} opacity-80 leading-relaxed`}>
          {issue.detailedExplanation}
        </p>
      )}

      {/* Read More Section */}
      {issue.learnMore && (
        <div className="mt-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className={`flex items-center gap-2 text-sm font-medium ${config.textColor} hover:underline`}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {expanded ? 'Show less' : 'Learn more about this'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-4">
              {/* Main Content */}
              <div className={`text-sm ${config.textColor} opacity-90 leading-relaxed whitespace-pre-line`}>
                {issue.learnMore.content}
              </div>

              {/* Scientific Basis */}
              {issue.learnMore.scientificBasis && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    🔬 Scientific Basis
                  </h4>
                  <p className={`text-sm ${config.textColor} opacity-80 leading-relaxed`}>
                    {issue.learnMore.scientificBasis}
                  </p>
                </div>
              )}

              {/* Examples */}
              {issue.learnMore.examples && issue.learnMore.examples.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    📋 Examples
                  </h4>
                  <ul className={`text-sm ${config.textColor} opacity-80 space-y-1`}>
                    {issue.learnMore.examples.map((example, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* External Links */}
              {issue.learnMore.externalLinks && issue.learnMore.externalLinks.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold ${config.textColor} mb-2`}>
                    🔗 Further Reading
                  </h4>
                  <ul className="space-y-2">
                    {issue.learnMore.externalLinks.map((link, idx) => (
                      <li key={idx}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-sm ${config.textColor} hover:underline inline-flex items-center gap-1`}
                        >
                          {link.title}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                        {link.description && (
                          <p className={`text-xs ${config.textColor} opacity-70 mt-1`}>
                            {link.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Related Plants/Years */}
              {(issue.relatedPlants || issue.affectedYears) && (
                <div className={`text-xs ${config.textColor} opacity-70 pt-2 border-t ${config.borderColor}`}>
                  {issue.affectedYears && issue.affectedYears.length > 0 && (
                    <span>Years affected: {issue.affectedYears.join(', ')} • </span>
                  )}
                  {issue.relatedPlants && issue.relatedPlants.length > 0 && (
                    <span>Related plants: {issue.relatedPlants.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
