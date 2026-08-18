import type { Review } from "@/lib/gas";

export function ReviewStars({ avg, count }: { avg: number; count: number }) {
  return (
    <div className="mt-3 flex items-center gap-2 text-sm">
      <span className="text-blush-rose">{"★".repeat(Math.round(avg))}{"☆".repeat(5 - Math.round(avg))}</span>
      <span className="text-dusty-rose">{avg} · {count} review{count === 1 ? "" : "s"}</span>
    </div>
  );
}

export function ReviewsPanel({
  reviews, loading, posting, reviewerId,
  rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
  onSubmit, onDelete,
}: {
  reviews: Review[];
  loading: boolean;
  posting: boolean;
  reviewerId: string;
  rvName: string; setRvName: (v: string) => void;
  rvText: string; setRvText: (v: string) => void;
  rvRating: number; setRvRating: (v: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (review: Review) => void;
}) {
  return (
    <div className="mt-8 border-t border-white/60 pt-6">
      <h4 className="font-display text-2xl text-rose-wine">Customer reviews</h4>
      <form onSubmit={onSubmit} className="mt-4 rounded-2xl bg-white/50 p-4 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            value={rvName}
            onChange={(e) => setRvName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
            maxLength={60}
            disabled={posting}
          />
          <select
            value={rvRating}
            onChange={(e) => setRvRating(Number(e.target.value))}
            className="rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
            disabled={posting}
          >
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
          </select>
        </div>
        <textarea
          value={rvText}
          onChange={(e) => setRvText(e.target.value)}
          rows={2}
          placeholder="Share your experience…"
          className="w-full rounded-xl border border-rose-wine/20 bg-white/70 px-3 py-2 text-sm outline-none focus:border-rose-wine"
          maxLength={400}
          disabled={posting}
        />
        <button type="submit" disabled={posting} className="pill-btn pill-btn-hover !py-2 !px-4 !text-xs disabled:opacity-50">
          {posting ? "Posting…" : "Post review"}
        </button>
      </form>
      <ul className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
        {loading && <li className="text-sm text-dusty-rose text-center py-4">Loading reviews…</li>}
        {!loading && reviews.length === 0 && (
          <li className="text-sm text-dusty-rose text-center py-4">No reviews yet — be the first!</li>
        )}
        {reviews.map((r) => (
          <li key={r.id} className="rounded-2xl bg-white/40 p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-rose-wine text-sm">{r.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blush-rose">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                {r.reviewerId === reviewerId && (
                  <button
                    type="button"
                    onClick={() => onDelete(r)}
                    className="text-[0.65rem] text-dusty-rose underline hover:text-rose-wine"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-neutral-700">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
