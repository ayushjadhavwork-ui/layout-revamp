import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getReviews, submitReview as apiSubmitReview, deleteReview as apiDeleteReview, getReviewerId, type Review } from "./gas";

// Shared review logic for every product modal — one Reviews sheet lookup
// per productId, so each product's reviews are isolated from every other.
export function useProductReviews(productId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [rvName, setRvName] = useState("");
  const [rvText, setRvText] = useState("");
  const [rvRating, setRvRating] = useState(5);
  const reviewerId = getReviewerId();

  useEffect(() => {
    setRvName(""); setRvText(""); setRvRating(5);
    if (!productId) { setReviews([]); return; }
    setLoading(true);
    getReviews(productId)
      .then(setReviews)
      .catch(() => toast.error("Could not load reviews."))
      .finally(() => setLoading(false));
  }, [productId]);

  const avg = reviews.length
    ? Math.round((reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) * 10) / 10
    : 5;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    if (!rvName.trim() || !rvText.trim()) return toast.error("Add your name and review.");
    setPosting(true);
    try {
      const res = await apiSubmitReview({ productId, name: rvName.trim(), rating: rvRating, text: rvText.trim(), reviewerId });
      if (!res.ok) throw new Error();
      setReviews((r) => [
        { id: res.id!, productId, name: rvName.trim(), rating: rvRating, text: rvText.trim(), reviewerId, timestamp: new Date().toISOString() },
        ...r,
      ]);
      setRvName(""); setRvText(""); setRvRating(5);
      toast.success("Review posted");
    } catch {
      toast.error("Could not post review — try again.");
    } finally {
      setPosting(false);
    }
  };

  const deleteReview = async (review: Review) => {
    try {
      const res = await apiDeleteReview(review.id, reviewerId);
      if (!res.ok) throw new Error();
      setReviews((r) => r.filter((x) => x.id !== review.id));
      toast.success("Review deleted");
    } catch {
      toast.error("Could not delete — this may not be your review.");
    }
  };

  return {
    reviews, loading, posting, avg, reviewerId,
    rvName, setRvName, rvText, setRvText, rvRating, setRvRating,
    submitReview, deleteReview,
  };
}
