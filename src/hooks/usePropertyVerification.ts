import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useStorage } from '@/hooks/useStorage';

export interface PropertyDocument {
  id: string;
  document_type: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  verification_status: 'pending' | 'approved' | 'rejected' | 'requires_resubmission';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  is_required: boolean;
  is_sensitive: boolean;
  created_at: string;
}

export interface VerificationRequirement {
  document_type: string;
  is_required: boolean;
  description: string;
}

export interface DocumentUploadProgress {
  documentType: string;
  progress: number;
  isUploading: boolean;
}

export function usePropertyVerification(propertyId?: string, propertyType?: string) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [requirements, setRequirements] = useState<VerificationRequirement[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<DocumentUploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile } = useStorage();

  // Get verification requirements for property type
  const fetchRequirements = async (type: string) => {
    try {
      const { data, error } = await supabase
        .from('property_verification_requirements')
        .select('document_type, is_required, description')
        .eq('property_type', type);

      if (error) throw error;
      setRequirements((data || []).map(item => ({
        document_type: item.document_type,
        is_required: item.is_required ?? false,
        description: item.description ?? ''
      })));
    } catch (err: any) {
      console.error('Error fetching requirements:', err);
      setError(err.message);
    }
  };

  // Get uploaded documents for property
  const fetchDocuments = async (propId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data || []).map(item => ({
        id: item.id,
        document_type: item.document_type,
        file_url: item.file_url,
        file_name: item.file_name,
        file_size: item.file_size ?? undefined,
        mime_type: item.mime_type ?? undefined,
        verification_status: item.verification_status as 'pending' | 'approved' | 'rejected' | 'requires_resubmission',
        verified_by: item.verified_by ?? undefined,
        verified_at: item.verified_at ?? undefined,
        rejection_reason: item.rejection_reason ?? undefined,
        admin_notes: item.admin_notes ?? undefined,
        is_required: item.is_required ?? false,
        is_sensitive: item.is_sensitive ?? false,
        created_at: item.created_at ?? ''
      })));
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async (
    documentType: string,
    fileUri: string,
    fileName: string,
    userId: string,
    propId: string
  ): Promise<boolean> => {
    try {
      setUploading(true);
      setError(null);
      
      // Add to upload progress
      setUploadProgress(prev => [
        ...prev.filter(p => p.documentType !== documentType),
        { documentType, progress: 0, isUploading: true }
      ]);

      // Determine bucket based on property type
      const bucket = (propertyType === 'land' || propertyType === 'house') ? 'land-docs' : 'property-documents';
      
      // Upload file to storage
      const uploadResult = await uploadFile(fileUri, 'application/octet-stream', bucket, `property-documents/${propId}`);
      
      if (!uploadResult || uploadResult.error) {
        throw new Error(uploadResult?.error || 'Failed to upload file');
      }
      
      const fileUrl = uploadResult.url;
      
      // Update progress
      setUploadProgress(prev => 
        prev.map(p => 
          p.documentType === documentType 
            ? { ...p, progress: 50 }
            : p
        )
      );

      // Get file info
      const fileInfo = await fetch(fileUri);
      const fileSize = parseInt(fileInfo.headers.get('content-length') || '0');
      const mimeType = fileInfo.headers.get('content-type') || 'application/octet-stream';

      // Save document record to database
      const { data, error } = await supabase
        .from('property_documents')
        .insert({
          property_id: propId,
          uploaded_by: userId,
          document_type: documentType,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          mime_type: mimeType,
          is_required: requirements.find(r => r.document_type === documentType)?.is_required || false,
          is_sensitive: ['national_id_front', 'national_id_back'].includes(documentType),
        })
        .select()
        .single();

      if (error) throw error;

      // Update documents list
      setDocuments(prev => [{
        id: data.id,
        document_type: data.document_type,
        file_url: data.file_url,
        file_name: data.file_name,
        file_size: data.file_size ?? undefined,
        mime_type: data.mime_type ?? undefined,
        verification_status: data.verification_status as 'pending' | 'approved' | 'rejected' | 'requires_resubmission',
        verified_by: data.verified_by ?? undefined,
        verified_at: data.verified_at ?? undefined,
        rejection_reason: data.rejection_reason ?? undefined,
        admin_notes: data.admin_notes ?? undefined,
        is_required: data.is_required ?? false,
        is_sensitive: data.is_sensitive ?? false,
        created_at: data.created_at ?? ''
      }, ...prev]);
      
      // Complete progress
      setUploadProgress(prev => 
        prev.map(p => 
          p.documentType === documentType 
            ? { ...p, progress: 100, isUploading: false }
            : p
        )
      );

      // Remove from progress after delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.documentType !== documentType));
      }, 2000);

      return true;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message);
      
      // Remove from progress on error
      setUploadProgress(prev => prev.filter(p => p.documentType !== documentType));
      
      alert(`Upload Error: ${err.message || 'Failed to upload document'}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Update documents list
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      return true;
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.message);
      alert(`Delete Error: ${err.message || 'Failed to delete document'}`);
      return false;
    }
  };

  // Submit property for verification
  const submitForVerification = async (propId: string): Promise<boolean> => {
    try {
      // Check if all required documents are uploaded
      const requiredDocs = requirements.filter(req => req.is_required);
      const uploadedDocTypes = documents.map(doc => doc.document_type);
      const missingDocs = requiredDocs.filter(req => !uploadedDocTypes.includes(req.document_type));

      if (missingDocs.length > 0) {
        const missingDocNames = missingDocs.map(doc => doc.document_type.replace('_', ' ')).join(', ');
        alert(`Missing Documents: Please upload the following required documents: ${missingDocNames}`);
        return false;
      }

      // Update property verification status
      const { error } = await supabase
        .from('properties')
        .update({ 
          verification_status: 'documents_submitted',
          updated_at: new Date().toISOString()
        })
        .eq('id', propId);

      if (error) throw error;

      alert('Verification Submitted: Your property has been submitted for verification. You will be notified once the review is complete.');

      return true;
    } catch (err: any) {
      console.error('Error submitting for verification:', err);
      setError(err.message);
      alert(`Submission Error: ${err.message || 'Failed to submit for verification'}`);
      return false;
    }
  };

  // Get verification status summary
  const getVerificationSummary = () => {
    const requiredDocs = requirements.filter(req => req.is_required);
    const uploadedDocTypes = documents.map(doc => doc.document_type);
    const uploadedRequired = requiredDocs.filter(req => uploadedDocTypes.includes(req.document_type));
    
    const approvedDocs = documents.filter(doc => doc.verification_status === 'approved');
    const rejectedDocs = documents.filter(doc => doc.verification_status === 'rejected');
    const pendingDocs = documents.filter(doc => doc.verification_status === 'pending');

    return {
      totalRequired: requiredDocs.length,
      uploaded: uploadedRequired.length,
      approved: approvedDocs.length,
      rejected: rejectedDocs.length,
      pending: pendingDocs.length,
      isComplete: uploadedRequired.length === requiredDocs.length,
      canSubmit: uploadedRequired.length === requiredDocs.length && rejectedDocs.length === 0,
    };
  };

  // Get document display name
  const getDocumentDisplayName = (documentType: string): string => {
    const names: Record<string, string> = {
      land_certificate: 'Land Certificate',
      sales_agreement: 'Sales Agreement (Notarized)',
      deed_of_conveyance: 'Deed of Conveyance',
      survey_plan: 'Survey Plan',
      certificate_of_urbanism: 'Certificate of Urbanism',
      national_id_front: 'National ID (Front)',
      national_id_back: 'National ID (Back)',
      pitch_document: 'Property Pitch Document',
      building_permit: 'Building Permit',
      ownership_deed: 'Ownership Deed',
    };
    return names[documentType] || documentType.replace('_', ' ').toUpperCase();
  };

  // Get document icon
  const getDocumentIcon = (documentType: string): string => {
    const icons: Record<string, string> = {
      land_certificate: '📜',
      sales_agreement: '📋',
      deed_of_conveyance: '📝',
      survey_plan: '🗺️',
      certificate_of_urbanism: '🏛️',
      national_id_front: '🆔',
      national_id_back: '🆔',
      pitch_document: '📄',
      building_permit: '🏗️',
      ownership_deed: '🏠',
    };
    return icons[documentType] || '📄';
  };

  // Load data when dependencies change
  useEffect(() => {
    if (propertyType) {
      fetchRequirements(propertyType);
    }
  }, [propertyType]);

  useEffect(() => {
    if (propertyId) {
      fetchDocuments(propertyId);
    }
  }, [propertyId]);

  return {
    // Data
    documents,
    requirements,
    uploadProgress,
    
    // States
    loading,
    uploading,
    error,
    
    // Actions
    uploadDocument,
    deleteDocument,
    submitForVerification,
    fetchDocuments,
    fetchRequirements,
    
    // Helpers
    getVerificationSummary,
    getDocumentDisplayName,
    getDocumentIcon,
    
    // Computed
    verificationSummary: getVerificationSummary(),
  };
} 
