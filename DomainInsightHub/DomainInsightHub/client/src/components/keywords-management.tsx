import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Tags, Plus, Edit, Trash2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { DomainWithKeywords, Keyword } from "@shared/schema";

interface KeywordsManagementProps {
  domain: DomainWithKeywords;
  onKeywordsUpdated: (domain: DomainWithKeywords) => void;
}

export default function KeywordsManagement({ domain, onKeywordsUpdated }: KeywordsManagementProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const { toast } = useToast();

  const addMutation = useMutation({
    mutationFn: async (value: string) => {
      const response = await apiRequest("POST", "/api/keywords", {
        domainId: domain.id,
        value: value.trim(),
      });
      return response.json();
    },
    onSuccess: (newKeyword: Keyword) => {
      const updatedDomain = {
        ...domain,
        keywords: [...domain.keywords, newKeyword],
      };
      onKeywordsUpdated(updatedDomain);
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const response = await apiRequest("PUT", `/api/keywords/${id}`, { value });
      return response.json();
    },
    onSuccess: (updatedKeyword: Keyword) => {
      const updatedKeywords = domain.keywords.map(k => 
        k.id === updatedKeyword.id ? updatedKeyword : k
      );
      onKeywordsUpdated({ ...domain, keywords: updatedKeywords });
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/keywords/${id}`);
      return id;
    },
    onSuccess: (deletedId: number) => {
      const updatedKeywords = domain.keywords.filter(k => k.id !== deletedId);
      onKeywordsUpdated({ ...domain, keywords: updatedKeywords });
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

  const handleEdit = (keyword: Keyword) => {
    setEditingId(keyword.id);
    setEditValue(keyword.value);
  };

  const handleSaveEdit = (id: number) => {
    if (editValue.trim()) {
      updateMutation.mutate({ id, value: editValue.trim() });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addMutation.mutate(newKeyword);
    }
  };

  const handleAddNew = () => {
    setShowAddInput(true);
    setNewKeyword("");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
          <Tags className="w-5 h-5 text-primary" />
          <span>Keywords Management</span>
        </h3>
        <Button
          size="sm"
          onClick={handleAddNew}
          className="bg-accent hover:bg-emerald-600"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add New
        </Button>
      </div>

      <div className="space-y-3">
        {domain.keywords.map((keyword) => (
          <div key={keyword.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group">
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
                  onClick={() => deleteMutation.mutate(keyword.id)}
                  className="text-slate-400 hover:text-red-500"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {showAddInput && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
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
            <Button size="sm" onClick={handleAddKeyword} disabled={addMutation.isPending}>
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddInput(false)}>
              Cancel
            </Button>
          </div>
        )}

        {domain.keywords.length > 0 && (
          <div className="pt-3 border-t border-slate-200">
            <div className="text-center text-sm text-slate-600">
              <Database className="w-4 h-4 inline mr-1" />
              {domain.keywords.length} keywords stored in database
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
