import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Clock, TrendingUp, BarChart } from "lucide-react";
import type { DomainWithKeywords } from "@shared/schema";

interface EnginePerformanceData {
  engine: string;
  avgSentimentScore: number;
  avgPerformanceScore: number;
  avgResponseTime: number;
  totalAnalyses: number;
}

interface EnginePerformanceProps {
  domain: DomainWithKeywords;
}

export default function EnginePerformance({ domain }: EnginePerformanceProps) {
  const { data: performance, isLoading, error } = useQuery<EnginePerformanceData[]>({
    queryKey: [`/api/domains/${domain.id}/engine-performance`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={`engine-skeleton-${i}`} className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error loading performance data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Platform Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No performance data available yet. Generate analyses with different AI engines.</p>
        </CardContent>
      </Card>
    );
  }

  const getEngineLabel = (engine: string) => {
    if (!engine) return 'Unknown Engine';
    switch (engine.toLowerCase()) {
      case 'openai': return 'OpenAI GPT-4o';
      case 'gemini': return 'Google Gemini';
      default: return engine;
    }
  };

  const getEngineColor = (engine: string) => {
    if (!engine) return 'bg-gray-100 text-gray-800 border-gray-200';
    switch (engine.toLowerCase()) {
      case 'openai': return 'bg-green-100 text-green-800 border-green-200';
      case 'gemini': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-600' };
    if (score >= 80) return { grade: 'A', color: 'text-green-600' };
    if (score >= 70) return { grade: 'B', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'C', color: 'text-orange-600' };
    return { grade: 'D', color: 'text-red-600' };
  };

  // Sort by performance score descending, with null safety
  const sortedPerformance = performance?.length > 0 
    ? [...performance].sort((a, b) => (b.avgPerformanceScore || 0) - (a.avgPerformanceScore || 0))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Platform Performance
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare how different AI engines perform on your domain analysis
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedPerformance.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No performance data available. Run analyses with different AI engines to compare their performance.
            </p>
          ) : (
            sortedPerformance.map((engine, index) => {
              const performanceGrade = getPerformanceGrade(engine.avgPerformanceScore);
              
              return (
                <div
                  key={engine.engine}
                  className="p-4 border rounded-lg space-y-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={getEngineColor(engine.engine)}>
                        {getEngineLabel(engine.engine)}
                      </Badge>
                      {index === 0 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Top Performer
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${performanceGrade.color}`}>
                        {performanceGrade.grade}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({engine.totalAnalyses} analyses)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BarChart className="h-4 w-4" />
                        Overall Performance
                      </div>
                      <Progress value={engine.avgPerformanceScore} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {engine.avgPerformanceScore}% average score
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Sentiment Quality
                      </div>
                      <Progress value={engine.avgSentimentScore} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {engine.avgSentimentScore}% positive sentiment
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="h-4 w-4" />
                        Response Speed
                      </div>
                      <div className="text-lg font-semibold">
                        {formatResponseTime(engine.avgResponseTime)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        average response time
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}