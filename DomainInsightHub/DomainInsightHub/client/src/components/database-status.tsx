import { useQuery } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DatabaseStatus() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const displayStats = stats || { domains: 0, keywords: 0, analyses: 0 };

  return (
    <section className="mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Database Status</span>
          </h3>
          <Badge className="bg-green-100 text-green-700">
            Connected
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {displayStats.domains}
            </div>
            <div className="text-sm text-slate-600">Domains Analyzed</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {displayStats.keywords}
            </div>
            <div className="text-sm text-slate-600">Keywords Stored</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {displayStats.analyses}
            </div>
            <div className="text-sm text-slate-600">AI Analyses</div>
          </div>
        </div>
      </div>
    </section>
  );
}
