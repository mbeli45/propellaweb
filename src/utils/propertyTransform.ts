import { PropertyData } from '@/components/PropertyCard';

// Shared property transformation function to ensure consistency
export const transformPropertyData = (property: any): PropertyData => {
  return {
    id: property.id,
    title: property.title,
    description: property.description || undefined,
    price: property.price,
    location: property.location,
    type: property.type as 'rent' | 'sale',
    category: property.category as 'budget' | 'standard' | 'premium' | 'luxury',
    bedrooms: property.bedrooms || undefined,
    bathrooms: property.bathrooms || undefined,
    area: property.area || undefined,
    amenities: property.amenities || [],
    image: property.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image',
    images: property.images || [],
    status: property.status || undefined,
    reservationFee: property.reservation_fee || undefined,
    isVerified: property.profiles?.role === 'agent' || property.profiles?.role === 'landlord',
    owner_id: property.owner_id,
    owner: property.profiles ? {
      id: property.profiles.id,
      full_name: property.profiles.full_name || undefined,
      avatar_url: property.profiles.avatar_url || undefined,
      email: property.profiles.email || undefined,
      role: property.profiles.role || undefined,
    } : undefined,
  };
};

// Transform array of properties
export const transformPropertiesData = (properties: any[]): PropertyData[] => {
  return properties.map(transformPropertyData);
}; 