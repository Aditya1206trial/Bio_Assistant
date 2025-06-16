import { useState } from "react";
import { Search, Filter, BookOpen, ExternalLink } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import * as React from "react";


interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: string;
  relevance: number;
  url?: string;
}

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    dateRange: "any",
  });
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      // Replace this with your actual FastAPI search endpoint
      const response = await fetch("http://localhost:8000/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          filters: filters,
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      
      // Fallback mock results when API is not available
      const mockResults: SearchResult[] = [
        {
          id: "1",
          title: "Photosynthesis in Plant Cells",
          snippet: "Photosynthesis is the process by which plants convert light energy into chemical energy...",
          source: "Biology Textbook Ch. 8",
          relevance: 0.95,
        },
        {
          id: "2",
          title: "DNA Replication Mechanisms",
          snippet: "DNA replication is a fundamental process where genetic material is duplicated...",
          source: "Molecular Biology Journal",
          relevance: 0.87,
        },
        {
          id: "3",
          title: "Cellular Respiration Overview",
          snippet: "Cellular respiration is the metabolic process that converts glucose into ATP...",
          source: "Cell Biology Research",
          relevance: 0.82,
        },
      ];
      
      setResults(mockResults);
      
      toast("Using Offline Results", {
  description: "Showing sample results. Connect to FastAPI backend for live search.",
});
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Search Biological Knowledge
        </h2>
        <p className="text-gray-600">
          Search through scientific literature and knowledge bases
        </p>
      </div>

      {/* Search Input */}
      <div className="flex space-x-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for biology topics, concepts, or questions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 dark:text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Search className="h-5 w-5" />
          )}
          <span>Search</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <Filter className="h-5 w-5 text-gray-600" />
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Category:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 dark:text-gray-900"
          >
            <option value="all">All Categories</option>
            <option value="molecular">Molecular Biology</option>
            <option value="genetics">Genetics</option>
            <option value="ecology">Ecology</option>
            <option value="anatomy">Anatomy</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Date:</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-900 dark:text-gray-900"
          >
            <option value="any">Any Time</option>
            <option value="recent">Last Year</option>
            <option value="5years">Last 5 Years</option>
            <option value="10years">Last 10 Years</option>
          </select>
        </div>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Search Results ({results.length})
          </h3>
          {results.map((result) => (
            <div
              key={result.id}
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                    {result.title}
                  </h4>
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {result.snippet}
                  </p>
                  <div className="flex items-center mt-3 space-x-4">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{result.source}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: result.relevance > 0.9 ? "#10b981" : result.relevance > 0.8 ? "#f59e0b" : "#6b7280"
                        }}
                      />
                      <span className="text-sm text-gray-500">
                        {Math.round(result.relevance * 100)}% relevant
                      </span>
                    </div>
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-sm">View Source</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query && !isSearching && (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );
};
