import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, BarChart3 } from "lucide-react";
import type { DomainWithKeywords } from "@shared/schema";

interface KeywordRankingData {
  keyword: string;
  totalMentions: number;
  avgSentimentScore: number;
  avgPerformanceScore: number;
}

interface KeywordRankingsProps {
  domain: DomainWithKeywords;
}

export default function KeywordRankings({ domain }: KeywordRankingsProps) {
  const { data: rankings, isLoading, error } = useQuery<KeywordRankingData[]>({
    queryKey: [`/api/domains/${domain.id}/keyword-rankings`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Keyword Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={`skeleton-${i}`} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
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
            <Target className="h-5 w-5" />
            Keyword Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Error loading ranking data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  if (!rankings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Keyword Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No ranking data available yet. Generate some analyses first.</p>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getSentimentColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Keyword Performance Rankings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Rankings based on AI analysis mentions and response quality
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rankings.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No keyword data available. Run some AI analyses to see rankings.
            </p>
          ) : (
            rankings.map((ranking, index) => (
              <div
                key={ranking.keyword}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="min-w-8">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium">{ranking.keyword}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm font-medium">{ranking.totalMentions}</div>
                    <div className="text-xs text-muted-foreground">mentions</div>
                  </div>

                  <div className="text-center">
                    <div className={`text-sm font-medium ${getSentimentColor(ranking.avgSentimentScore)}`}>
                      {ranking.avgSentimentScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">sentiment</div>
                  </div>

                  <div className="w-24">
                    <div className="text-xs text-muted-foreground mb-1">Performance</div>
                    <Progress
                      value={ranking.avgPerformanceScore}
                      className="h-2"
                    />
                    <div className="text-xs text-center mt-1">{ranking.avgPerformanceScore}%</div>
                  </div>

                  {index < 3 && (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}