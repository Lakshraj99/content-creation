import { useEffect, useState } from "react";
import { HISTORY_API_URL, getAssetUrl, formatHistoryTime, SpinnerIcon } from "./shared.jsx";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadHistory = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(HISTORY_API_URL);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Unable to load history");
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setError(err.message || "Unable to load history");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadHistory();
    return () => { cancelled = true; };
  }, []);

  const groupedItems = items.reduce((groups, item) => {
    const background = item.background || "Uncategorized";
    return {
      ...groups,
      [background]: [...(groups[background] || []), item],
    };
  }, {});

  const sortedGroups = Object.entries(groupedItems).sort(([a], [b]) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="history-page">
      <section className="history-head">
        <div>
          <p className="eyebrow">Creative archive</p>
          <h1>History</h1>
        </div>
      </section>

      {loading ? (
        <div className="history-state"><SpinnerIcon size={18} color="var(--acc)" /> Loading generated posters...</div>
      ) : error ? (
        <div className="history-state error">History is unavailable right now.</div>
      ) : items.length === 0 ? (
        <div className="history-state">Generated posters will appear here after your next campaign.</div>
      ) : (
        <div className="history-groups">
          {sortedGroups.map(([background, posters]) => (
            <section className="history-category" key={background} aria-label={`${background} poster history`}>
              <div className="history-category-head">
                <h2>{background}</h2>
                <span>{posters.length} poster{posters.length === 1 ? "" : "s"}</span>
              </div>
              <div className="history-rail" aria-label={`${background} posters`}>
                {posters.map((item, idx) => {
                  const title = item.campaign || item.filename || `Campaign ${idx + 1}`;
                  return (
                    <article className="history-card" key={`${item.filename || title}-${item.timestamp || idx}`}>
                      <div className="history-thumb">
                        <img src={getAssetUrl(item.url)} alt={title} />
                      </div>
                      <div className="history-meta">
                        <h3>{title}</h3>
                        <time>{formatHistoryTime(item.timestamp)}</time>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
