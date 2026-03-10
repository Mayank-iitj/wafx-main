'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import {
  Search, Clock, Filter, Play, Database, AlertTriangle,
  ChevronDown, FileText, RefreshCw
} from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function executeSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const searchQuery: any = { query: query.trim() };
      if (source) searchQuery.source = source;
      if (timeFrom) searchQuery.time_from = new Date(timeFrom).toISOString();
      if (timeTo) searchQuery.time_to = new Date(timeTo).toISOString();

      const data = await api.searchEvents(searchQuery);
      setResults(data.events || data.hits || data.items || []);
      setTotalResults(data.total || data.count || (data.events || data.hits || data.items || []).length);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') executeSearch();
  }

  function setQuickRange(hours: number) {
    const now = new Date();
    const from = new Date(now.getTime() - hours * 60 * 60 * 1000);
    setTimeFrom(from.toISOString().slice(0, 16));
    setTimeTo(now.toISOString().slice(0, 16));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Log Search</h1>
        <p className="text-sm text-muted-foreground mt-1">Query security events across all ingested sources</p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search events... (e.g. source_ip:10.0.0.1 AND action:blocked)"
              className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            onClick={executeSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Search
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <input
              type="datetime-local"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="From"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="datetime-local"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="To"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {[1, 4, 12, 24, 72].map((h) => (
              <button
                key={h}
                onClick={() => setQuickRange(h)}
                className="px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition"
              >
                {h < 24 ? `${h}h` : `${h / 24}d`}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source filter..."
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-40"
          />
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Searching...' : `${totalResults} events found`}
            </p>
          </div>

          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
              </div>
            ) : results.length > 0 ? (
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider w-44">Timestamp</th>
                    <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider w-28">Source</th>
                    <th className="p-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Event Data</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((event, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition">
                      <td className="p-3 text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {event.timestamp
                          ? new Date(event.timestamp).toLocaleString()
                          : event['@timestamp']
                          ? new Date(event['@timestamp']).toLocaleString()
                          : '—'}
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          {event.source || event.log_source || '—'}
                        </span>
                      </td>
                      <td className="p-3">
                        <pre className="text-xs text-foreground font-mono whitespace-pre-wrap break-all max-h-24 overflow-hidden">
                          {typeof event.raw === 'string'
                            ? event.raw
                            : typeof event.message === 'string'
                            ? event.message
                            : JSON.stringify(event.data || event, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Database className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No events match your query</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!searched && (
        <div className="glass-card p-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-foreground font-medium mb-2">Search Security Events</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Enter a query above to search across all ingested log sources.
            Use field:value syntax for precise filtering.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Examples:</span>
            {['source_ip:10.0.0.1', 'action:blocked', 'severity:critical'].map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded hover:bg-blue-500/20 transition font-mono"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
