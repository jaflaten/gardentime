'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import GardenNavigation from '../components/GardenNavigation';

interface CropAssignment {
  plannedCropId: string;
  plantName: string;
  plantId: string;
  quantity: number;
  recommendedGrowAreaId: number;
  growAreaName: string;
  score: {
    totalScore: number;
    grade: string;
    recommendation: string;
    issues: Array<{
      severity: string;
      category: string;
      message: string;
      suggestion?: string;
    }>;
    benefits: Array<{
      category: string;
      message: string;
      impact: string;
    }>;
  };
  alternativeLocations: Array<{
    growAreaId: number;
    growAreaName: string;
    score: number;
    grade: string;
    summary: string;
  }>;
}

interface PlacementSummary {
  totalCrops: number;
  excellentPlacements: number;
  goodPlacements: number;
  fairPlacements: number;
  poorPlacements: number;
  overallScore: number;
  overallGrade: string;
  recommendations: string[];
  warnings: string[];
}

interface CropPlacementPlan {
  seasonPlanId: string;
  gardenId: string;
  assignments: CropAssignment[];
  summary: PlacementSummary;
}

export default function RotationPlannerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const gardenId = params.id as string;
  const seasonPlanId = searchParams.get('seasonPlanId');

  const [placementPlan, setPlacementPlan] = useState<CropPlacementPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gardenName, setGardenName] = useState<string>('');

  useEffect(() => {
    if (!seasonPlanId) {
      setError('No season plan ID provided');
      setLoading(false);
      return;
    }

    fetchData();
  }, [gardenId, seasonPlanId]);

  const fetchData = async () => {
    if (!seasonPlanId) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch garden info
      const gardenRes = await api.get(`/gardens/${gardenId}`);
      if (gardenRes.data) {
        setGardenName(gardenRes.data.name);
      }

      // Run rotation planner
      console.log('Running rotation planner for season plan:', seasonPlanId);
      const plannerRes = await api.post(
        `/gardens/${gardenId}/season-plans/${seasonPlanId}/run-rotation-planner`
      );

      console.log('Rotation planner result:', plannerRes.data);
      setPlacementPlan(plannerRes.data);
    } catch (err: any) {
      console.error('Failed to run rotation planner:', err);
      setError(err.response?.data?.error || err.message || 'Failed to run rotation planner');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'GOOD':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'FAIR':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'POOR':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'AVOID':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '🔴';
      case 'WARNING':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Analyzing crop rotations...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-sm p-8 max-w-md">
            <div className="text-red-600 text-center mb-4">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Error</h2>
              <p className="mt-2 text-gray-600">{error}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!placementPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <GardenNavigation gardenId={gardenId} gardenName={gardenName} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crop Rotation Plan</h1>
            <p className="text-gray-600 mt-1">Optimal placement recommendations for your crops</p>
          </div>
          <button
            onClick={() => router.push(`/gardens/${gardenId}/season-plan`)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            Back to Season Plan
          </button>
        </div>

        {/* Summary Card */}
        <div className={`bg-white rounded-lg shadow-sm p-6 mb-6 border-2 ${getGradeColor(placementPlan.summary.overallGrade)}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Overall Grade: {placementPlan.summary.overallGrade}</h2>
            <div className="text-3xl font-bold">{placementPlan.summary.overallScore}/100</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{placementPlan.summary.excellentPlacements}</div>
              <div className="text-sm text-gray-600">Excellent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{placementPlan.summary.goodPlacements}</div>
              <div className="text-sm text-gray-600">Good</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{placementPlan.summary.fairPlacements}</div>
              <div className="text-sm text-gray-600">Fair</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{placementPlan.summary.poorPlacements}</div>
              <div className="text-sm text-gray-600">Poor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{placementPlan.summary.totalCrops}</div>
              <div className="text-sm text-gray-600">Total Crops</div>
            </div>
          </div>

          {placementPlan.summary.recommendations.length > 0 && (
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 mb-2">✓ Recommendations</h3>
              <ul className="space-y-1">
                {placementPlan.summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-gray-700">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {placementPlan.summary.warnings.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">⚠️ Warnings</h3>
              <ul className="space-y-1">
                {placementPlan.summary.warnings.map((warn, idx) => (
                  <li key={idx} className="text-sm text-orange-700">• {warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Crop Assignments */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Crop Placements</h2>
          
          {placementPlan.assignments.map((assignment) => (
            <div key={assignment.plannedCropId} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{assignment.plantName}</h3>
                  <p className="text-sm text-gray-600">Quantity: {assignment.quantity}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border-2 ${getGradeColor(assignment.score.grade)}`}>
                  <div className="text-lg font-bold">{assignment.score.grade}</div>
                  <div className="text-sm">{assignment.score.totalScore}/100</div>
                </div>
              </div>

              {/* Recommended Location */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold text-gray-900">Recommended Location</span>
                </div>
                <p className="text-lg font-semibold text-green-900">{assignment.growAreaName}</p>
                <p className="text-sm text-gray-700 mt-2">{assignment.score.recommendation}</p>
              </div>

              {/* Issues */}
              {assignment.score.issues.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Issues to Consider</h4>
                  <div className="space-y-2">
                    {assignment.score.issues.map((issue, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <span className="mr-2">{getSeverityIcon(issue.severity)}</span>
                        <strong>{issue.category}:</strong> {issue.message}
                        {issue.suggestion && <div className="ml-6 text-gray-600 mt-1">💡 {issue.suggestion}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {assignment.score.benefits.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                  <div className="space-y-2">
                    {assignment.score.benefits.map((benefit, idx) => (
                      <div key={idx} className="text-sm text-gray-700">
                        <span className="mr-2">✓</span>
                        <strong>{benefit.category}:</strong> {benefit.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Locations */}
              {assignment.alternativeLocations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Alternative Locations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignment.alternativeLocations.map((alt) => (
                      <div key={alt.growAreaId} className={`p-3 rounded-lg border ${getGradeColor(alt.grade)}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold">{alt.growAreaName}</span>
                          <span className="text-sm font-bold">{alt.score}/100</span>
                        </div>
                        <p className="text-xs">{alt.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push(`/gardens/${gardenId}/season-plan`)}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 font-semibold"
          >
            Apply Recommendations to Season Plan
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
