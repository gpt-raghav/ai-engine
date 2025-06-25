import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Info, ArrowRight, ArrowLeft, Save, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords, Keyword } from "@shared/schema";

export default function AnalysisPage() {
  const [, params] = useRoute("/analysis/:id");
  const [, setLocation] = useLocation();
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const domainId = params?.id ? parseInt(params.id) : null;

  const { data: domain, isLoading } = useQuery<DomainWithKeywords>({
    queryKey: [`/api/domains/${domainId}`],
    enabled: !!domainId,
  });

  useEffect(() => {
    if (domain) {
      setDescription(domain.description);
    }
  }, [domain]);

  const updateDescriptionMutation = useMutation({
    mutationFn: async (newDescription: string) => {
      const response = await apiRequest("PUT", `/api/domains/${domainId}`, {
        description: newDescription,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}`] });
      toast({
        title: "Description updated",
        description: "Domain description has been saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (value: string) => {
      const response = await apiRequest("POST", "/api/keywords", {
        domainId: domainId,
        value: value.trim(),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}`] });
      setNewKeyword("");
      setShowAddInput(false);
      toast({
        title: "Keyword added",
        description: "New keyword has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add keyword",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateKeywordMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const response = await apiRequest("PUT", `/api/keywords/${id}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}`] });
      setEditingId(null);
      toast({
        title: "Keyword updated",
        description: "Keyword has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update keyword",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/keywords/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/domains/${domainId}`] });
      toast({
        title: "Keyword deleted",
        description: "Keyword has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete keyword",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveDescription = () => {
    if (description.trim() !== domain?.description) {
      updateDescriptionMutation.mutate(description);
    }
  };

  const handleEdit = (keyword: Keyword) => {
    setEditingId(keyword.id);
    setEditValue(keyword.value);
  };

  const handleSaveEdit = (id: number) => {
    if (editValue.trim()) {
      updateKeywordMutation.mutate({ id, value: editValue.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeywordMutation.mutate(newKeyword);
    }
  };

  const handleNext = () => {
    setLocation(`/insights/${domainId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading domain analysis...</p>
        </div>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Domain not found</p>
          <Button onClick={() => setLocation("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Search</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Info className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Domain Analysis</h1>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">Step 2 of 3</span>
              <Button onClick={handleNext} className="flex items-center space-x-2">
                <span>Continue to Insights</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Domain Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Domain Information</h2>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              Analyzed
            </Badge>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Domain Name
              </label>
              <div className="p-3 bg-slate-50 rounded-lg font-mono text-lg">
                {domain.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                AI-Generated Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resize-none min-h-[120px]"
                placeholder="Enter domain description..."
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleSaveDescription}
                  disabled={updateDescriptionMutation.isPending || description.trim() === domain.description}
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Keywords Management */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Keywords Management</h2>
            <Button
              size="sm"
              onClick={() => setShowAddInput(true)}
              className="bg-accent hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Keyword
            </Button>
          </div>

          <div className="space-y-3">
            {domain.keywords.map((keyword) => (
              <div key={keyword.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg group">
                <div className="flex-1">
                  {editingId === keyword.id ? (
                    <div className="flex space-x-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(keyword.id);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSaveEdit(keyword.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-900">{keyword.value}</span>
                  )}
                </div>
                {editingId !== keyword.id && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(keyword)}
                      className="text-slate-400 hover:text-primary"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteKeywordMutation.mutate(keyword.id)}
                      className="text-slate-400 hover:text-red-500"
                      disabled={deleteKeywordMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {showAddInput && (
              <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Enter new keyword..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddKeyword();
                    if (e.key === "Escape") setShowAddInput(false);
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddKeyword} disabled={addKeywordMutation.isPending}>
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddInput(false)}>
                  Cancel
                </Button>
              </div>
            )}

            {domain.keywords.length === 0 && !showAddInput && (
              <div className="text-center py-8 text-slate-500">
                <p>No keywords found. Add some keywords to continue.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}