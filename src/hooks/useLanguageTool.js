import { useState, useEffect } from "react";
import axios from "axios";

export default function useLanguageTool(
  text,
  language = "en-US",
  debounceMs = 500
) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!text || text.trim() === "") {
      setMatches([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handler = setTimeout(() => {
      axios
        .get("http://localhost:8888/v2/check", {
          params: {
            language,
            text,
          },
        })
        .then((res) => {
          if (!cancelled) {
            setMatches(res.data.matches || []);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setMatches([]);
            setLoading(false);
          }
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [text, language, debounceMs]);

  return { matches, loading };
}
