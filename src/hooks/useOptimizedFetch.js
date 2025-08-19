import { useState, useEffect, useRef } from "react";

// Custom hook for optimized data fetching with timeout and caching
export function useOptimizedFetch(
  fetchFunction,
  dependencies = [],
  options = {}
) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const cache = useRef(new Map());

  const {
    timeout = 10000,
    cacheTime = 30000, // 30 seconds
    retryCount = 2,
    retryDelay = 1000,
  } = options;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    let retryAttempts = 0;

    const cacheKey = JSON.stringify(dependencies);

    // Check cache first
    if (cache.current.has(cacheKey)) {
      const cachedData = cache.current.get(cacheKey);
      setData(cachedData);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!mounted.current) return;

      try {
        setLoading(true);
        setError(null);

        // Set timeout
        timeoutId = setTimeout(() => {
          if (mounted.current && loading) {
            setError("Request timeout - please check your connection");
            setLoading(false);
          }
        }, timeout);

        const result = await fetchFunction();

        if (mounted.current) {
          clearTimeout(timeoutId);
          setData(result);
          setError(null);

          // Cache the result
          cache.current.set(cacheKey, result);
          setTimeout(() => cache.current.delete(cacheKey), cacheTime);
        }
      } catch (err) {
        if (mounted.current) {
          console.error("Fetch error:", err);

          // Retry logic
          if (retryAttempts < retryCount) {
            retryAttempts++;
            setTimeout(() => {
              if (mounted.current) {
                fetchData();
              }
            }, retryDelay * retryAttempts);
            return;
          }

          setError(err.message || "Failed to load data");
        }
      } finally {
        if (mounted.current) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: () => {
      // Clear cache and refetch
      const cacheKey = JSON.stringify(dependencies);
      cache.current.delete(cacheKey);
      setLoading(true);
    },
  };
}

// Hook specifically for Supabase queries with optimized error handling
export function useSupabaseQuery(query, dependencies = [], options = {}) {
  const fetchFunction = async () => {
    const { data, error } = await query();
    if (error) {
      throw error;
    }
    return data;
  };

  return useOptimizedFetch(fetchFunction, dependencies, options);
}
