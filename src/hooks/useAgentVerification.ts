import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useStorage } from '@/hooks/useStorage';

export interface AgentVerification {
  id: string;
  agent_id: string;
  business_license_url?: string | null;
  professional_certificate_url?: string | null;
  id_document_front_url?: string | null;
  id_document_back_url?: string | null;
  proof_of_address_url?: string | null;
  verification_fee_paid: boolean;
  verification_fee_amount: number;
  payment_reference?: string | null;
  paid_at?: string | null;
  verification_status: 'pending' | 'documents_review' | 'approved' | 'rejected';
  verified_by?: string | null;
  verified_at?: string | null;
  verification_badge: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';
  badge_earned_at?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  business_name?: string | null;
  business_address?: string | null;
  years_of_experience?: number | null;
  specializations?: string[] | null;
  total_properties_sold: number;
  total_properties_rented: number;
  total_commission_earned: number;
  average_rating: number | null;
  total_reviews: number | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRating {
  id: string;
  agent_id: string;
  rated_by: string;
  property_id?: string;
  overall_rating: number;
  communication_rating?: number;
  professionalism_rating?: number;
  knowledge_rating?: number;
  responsiveness_rating?: number;
  review_text?: string;
  review_title?: string;
  is_verified_transaction: boolean;
  created_at: string;
}

export interface AgentProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  verified: boolean;
  is_verified_agent: boolean;
  verification_badge: string;
  badge_earned_at?: string;
  total_properties: number;
  average_rating: number;
  total_reviews: number;
  bio?: string;
  phone?: string;
  location?: string;
  verification?: AgentVerification | null;
  recent_ratings?: AgentRating[];
}

export function useAgentVerification(agentId?: string) {
  const [verification, setVerification] = useState<AgentVerification | null>(null);
  const [ratings, setRatings] = useState<AgentRating[]>([]);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile } = useStorage();

  // Fetch agent verification status
  const fetchVerification = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_verifications')
        .select('*')
        .eq('agent_id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        throw error;
      }

      setVerification(data as AgentVerification | null);
    } catch (err: any) {
      console.error('Error fetching verification:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch agent ratings
  const fetchRatings = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_ratings')
        .select(`
          *,
          profiles:rated_by (
            full_name,
            avatar_url
          ),
          properties:property_id (
            title,
            location
          )
        `)
        .eq('agent_id', id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRatings(data as AgentRating[] || []);
    } catch (err: any) {
      console.error('Error fetching ratings:', err);
      setError(err.message);
    }
  };

  // Fetch complete agent profile with verification and ratings
  const fetchAgentProfile = async (id: string) => {
    try {
      setLoading(true);
      
      // Fetch profile with verification data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          agent_verifications (*)
        `)
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      // Fetch recent ratings
      const { data: recentRatings, error: ratingsError } = await supabase
        .from('agent_ratings')
        .select(`
          *,
          profiles:rated_by (full_name, avatar_url),
          properties:property_id (title, location)
        `)
        .eq('agent_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ratingsError) throw ratingsError;

      const agentData: AgentProfile = {
        ...profile,
        verification: (profile.agent_verifications?.[0] as any) || null,
        recent_ratings: recentRatings as AgentRating[] || [],
      } as AgentProfile;

      setAgentProfile(agentData);
    } catch (err: any) {
      console.error('Error fetching agent profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize agent verification
  const initializeVerification = async (
    id: string,
    businessName: string,
    businessAddress: string,
    yearsOfExperience: number,
    specializations: string[]
  ): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('agent_verifications')
        .insert({
          agent_id: id,
          business_name: businessName,
          business_address: businessAddress,
          years_of_experience: yearsOfExperience,
          specializations,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      setVerification(data as AgentVerification);
      return true;
    } catch (err: any) {
      console.error('Error initializing verification:', err);
      setError(err.message);
      alert('Error', err.message || 'Failed to initialize verification');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload verification document
  const uploadVerificationDocument = async (
    documentType: 'business_license' | 'professional_certificate' | 'id_document_front' | 'id_document_back' | 'proof_of_address',
    fileUri: string,
    fileName: string,
    agentVerificationId: string
  ): Promise<boolean> => {
    try {
      setUploading(true);
      setError(null);

      // Upload file to storage
      const uploadResult = await uploadFile(fileUri, 'application/octet-stream', 'verification-docs', `agent-verification/${agentVerificationId}`);
      
      if (!uploadResult || uploadResult.error) {
        throw new Error(uploadResult?.error || 'Failed to upload file');
      }
      
      const fileUrl = uploadResult.url;

      // Update verification record
      const updateField = `${documentType}_url`;
      const { error } = await supabase
        .from('agent_verifications')
        .update({
          [updateField]: fileUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentVerificationId);

      if (error) throw error;

      // Refresh verification data
      if (agentId) {
        await fetchVerification(agentId);
      }

      return true;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message);
      alert('Upload Error', err.message || 'Failed to upload document');
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Submit verification for review
  const submitForReview = async (verificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agent_verifications')
        .update({
          verification_status: 'documents_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      if (error) throw error;

      alert(
        'Verification Submitted',
        'Your documents have been submitted for review. You will be notified once the review is complete.'
      );

      // Refresh verification data
      if (agentId) {
        await fetchVerification(agentId);
      }

      return true;
    } catch (err: any) {
      console.error('Error submitting for review:', err);
      setError(err.message);
      alert('Submission Error', err.message || 'Failed to submit for review');
      return false;
    }
  };

  // Add rating for agent
  const addRating = async (
    targetAgentId: string,
    ratedById: string,
    propertyId: string | null,
    ratingData: {
      overall_rating: number;
      communication_rating?: number;
      professionalism_rating?: number;
      knowledge_rating?: number;
      responsiveness_rating?: number;
      review_text?: string;
      review_title?: string;
      is_verified_transaction?: boolean;
    }
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('agent_ratings')
        .insert({
          agent_id: targetAgentId,
          rated_by: ratedById,
          property_id: propertyId,
          ...ratingData,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh ratings
      await fetchRatings(targetAgentId);
      
      return true;
    } catch (err: any) {
      console.error('Error adding rating:', err);
      setError(err.message);
      alert('Rating Error', err.message || 'Failed to add rating');
      return false;
    }
  };

  // Get top verified agents with timeout and error handling
  const getTopVerifiedAgents = async (limit: number = 10): Promise<AgentProfile[]> => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          agent_verifications!agent_verifications_agent_id_fkey!inner (
            verification_status,
            verification_badge,
            average_rating,
            total_reviews
          )
        `)
        .eq('agent_verifications.verification_status', 'approved')
        .eq('role', 'agent')
        .limit(limit * 2) // Get more data to sort from
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        // Silently handle network errors to prevent console spam
        throw error;
      }
      
      // Transform and sort the data
      const agents = data?.map(agent => ({
        ...agent,
        verification: agent.agent_verifications as any || null,
      })) || [];

      // Sort by average rating (descending), then by total reviews (descending)
      const sortedAgents = agents.sort((a, b) => {
        const ratingA = a.verification?.average_rating || 0;
        const ratingB = b.verification?.average_rating || 0;
        
        if (ratingA !== ratingB) {
          return ratingB - ratingA; // Higher rating first
        }
        
        // If ratings are equal, sort by total reviews
        const reviewsA = a.verification?.total_reviews || 0;
        const reviewsB = b.verification?.total_reviews || 0;
        return reviewsB - reviewsA; // Higher review count first
      });

      return sortedAgents.slice(0, limit) as AgentProfile[];
    } catch (err: any) {
      // Silently return empty array to prevent console spam and cascading errors
      return [];
    }
  };

  // Get verification requirements checklist
  const getVerificationChecklist = () => {
    if (!verification) return [];

    return [
      {
        id: 'business_info',
        title: 'Business Information',
        completed: !!(verification.business_name && verification.business_address),
        required: true,
      },
      {
        id: 'business_license',
        title: 'Business License',
        completed: !!verification.business_license_url,
        required: true,
      },
      {
        id: 'professional_certificate',
        title: 'Professional Certificate',
        completed: !!verification.professional_certificate_url,
        required: false,
      },
      {
        id: 'id_documents',
        title: 'ID Documents (Front & Back)',
        completed: !!(verification.id_document_front_url && verification.id_document_back_url),
        required: true,
      },
      {
        id: 'proof_of_address',
        title: 'Proof of Address',
        completed: !!verification.proof_of_address_url,
        required: true,
      },
      {
        id: 'verification_fee',
        title: 'Verification Fee Payment',
        completed: verification.verification_fee_paid,
        required: true,
      },
    ];
  };

  // Get badge display info
  const getBadgeInfo = (badge: string) => {
    const badges = {
      none: { label: 'No Badge', color: '#6B7280', emoji: '' },
      bronze: { label: 'Bronze Agent', color: '#CD7F32', emoji: '🥉' },
      silver: { label: 'Silver Agent', color: '#C0C0C0', emoji: '🥈' },
      gold: { label: 'Gold Agent', color: '#FFD700', emoji: '🥇' },
      platinum: { label: 'Platinum Agent', color: '#E5E4E2', emoji: '💎' },
    };
    return badges[badge as keyof typeof badges] || badges.none;
  };

  // Update verification payment status
  const updatePaymentStatus = async (verificationId: string, paymentReference: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agent_verifications')
        .update({
          verification_fee_paid: true,
          payment_reference: paymentReference,
          paid_at: new Date().toISOString(),
        })
        .eq('id', verificationId);

      if (error) throw error;

      // Refresh verification data
      if (agentId) {
        await fetchVerification(agentId);
      }

      return true;
    } catch (err: any) {
      console.error('Error updating payment status:', err);
      setError(err.message);
      return false;
    }
  };

  // Load data when agentId changes
  useEffect(() => {
    if (agentId) {
      fetchVerification(agentId);
      fetchRatings(agentId);
    }
  }, [agentId]);

  return {
    // Data
    verification,
    ratings,
    agentProfile,
    
    // States
    loading,
    uploading,
    error,
    
    // Actions
    initializeVerification,
    uploadVerificationDocument,
    submitForReview,
    addRating,
    updatePaymentStatus,
    fetchVerification,
    fetchRatings,
    fetchAgentProfile,
    getTopVerifiedAgents,
    
    // Helpers
    getVerificationChecklist,
    getBadgeInfo,
    
    // Computed
    verificationChecklist: getVerificationChecklist(),
    isVerificationComplete: verification?.verification_status === 'approved',
    canSubmitForReview: verification && 
      verification.business_license_url &&
      verification.id_document_front_url &&
      verification.id_document_back_url &&
      verification.proof_of_address_url &&
      verification.verification_status === 'pending',
  };
} 
