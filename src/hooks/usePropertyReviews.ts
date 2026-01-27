import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PropertyReview {
  id: string;
  property_id: string;
  user_id: string;
  reservation_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export function usePropertyReviews(propertyId: string) {
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!propertyId) {
      setReviews([]);
      setAverageRating(null);
      setTotalReviews(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('property_reviews')
        .select(`
          *,
          user:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsData = data || [];
      setReviews(reviewsData);
      setTotalReviews(reviewsData.length);

      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      } else {
        setAverageRating(null);
      }
    } catch (err: any) {
      console.error('Error fetching property reviews:', err);
      setError(err.message || 'Failed to load reviews');
      setReviews([]);
      setAverageRating(null);
      setTotalReviews(0);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const refetch = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    averageRating,
    totalReviews,
    loading,
    error,
    refetch,
  };
} 
