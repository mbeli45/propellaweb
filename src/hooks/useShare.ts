import { useState, useCallback } from 'react';
import { sharePropertyWithImage, sharePropertyUrl, requestSharingPermissions } from '@/utils/shareUtils';
import { PropertyData } from '@/components/PropertyCard';

interface UseShareReturn {
  isSharing: boolean;
  shareProperty: (property: PropertyData) => Promise<void>;
  sharePropertyUrl: (property: PropertyData, customMessage?: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useShare = (): UseShareReturn => {
  const [isSharing, setIsSharing] = useState(false);

  const shareProperty = useCallback(async (property: PropertyData) => {
    if (isSharing) return; // Prevent multiple simultaneous shares
    
    setIsSharing(true);
    try {
      await sharePropertyWithImage(property);
    } catch (error) {
      console.error('Error sharing property:', error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  const sharePropertyUrl = useCallback(async (property: PropertyData, customMessage?: string) => {
    if (isSharing) return; // Prevent multiple simultaneous shares
    
    setIsSharing(true);
    try {
      await sharePropertyUrl(property, customMessage);
    } catch (error) {
      console.error('Error sharing property URL:', error);
    } finally {
      setIsSharing(false);
    }
  }, [isSharing]);

  const requestPermissions = useCallback(async () => {
    return await requestSharingPermissions();
  }, []);

  return {
    isSharing,
    shareProperty,
    sharePropertyUrl,
    requestPermissions,
  };
};
