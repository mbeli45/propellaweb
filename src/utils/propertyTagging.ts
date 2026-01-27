// Property tagging and categorization utilities for improved search performance

export interface PropertyTag {
  id: string;
  name: string;
  category: 'location' | 'amenity' | 'type' | 'feature';
  weight: number;
}

export interface PropertyTags {
  location: PropertyTag[];
  amenities: PropertyTag[];
  features: PropertyTag[];
  type: PropertyTag[];
}

// Property category types
export type PropertyCategory = 'budget' | 'standard' | 'premium' | 'luxury';

// Price thresholds for automatic categorization (in FCFA)
export const PROPERTY_CATEGORY_THRESHOLDS = {
  budget: { min: 0, max: 300000 },
  standard: { min: 350000, max: 450000 },
  premium: { min: 500000, max: 650000 },
  luxury: { min: 650000, max: Infinity }
} as const;

// Automatically determine property category based on price
export const determinePropertyCategory = (price: number): PropertyCategory => {
  if (price <= PROPERTY_CATEGORY_THRESHOLDS.budget.max) {
    return 'budget';
  } else if (price >= PROPERTY_CATEGORY_THRESHOLDS.standard.min && price <= PROPERTY_CATEGORY_THRESHOLDS.standard.max) {
    return 'standard';
  } else if (price >= PROPERTY_CATEGORY_THRESHOLDS.premium.min && price <= PROPERTY_CATEGORY_THRESHOLDS.premium.max) {
    return 'premium';
  } else if (price >= PROPERTY_CATEGORY_THRESHOLDS.luxury.min) {
    return 'luxury';
  }
  
  // Fallback for edge cases (between ranges)
  if (price > 300000 && price < 350000) {
    return 'budget'; // Closer to budget range
  } else if (price > 450000 && price < 500000) {
    return 'standard'; // Closer to standard range
  }
  
  return 'standard'; // Default fallback
};

// Helper function to get category display info
export const getCategoryInfo = (category: PropertyCategory) => {
  const thresholds = PROPERTY_CATEGORY_THRESHOLDS[category];
  const ranges = {
    budget: '≤ 300,000 FCFA',
    standard: '350,000 - 450,000 FCFA',
    premium: '500,000 - 650,000 FCFA',
    luxury: '≥ 650,000 FCFA'
  };
  
  return {
    name: category.charAt(0).toUpperCase() + category.slice(1),
    range: ranges[category],
    min: thresholds.min,
    max: thresholds.max
  };
};

// Extract tags from property data for better search indexing
export const extractPropertyTags = (property: any): PropertyTags => {
  const tags: PropertyTags = {
    location: [],
    amenities: [],
    features: [],
    type: []
  };

  // Location tags
  if (property.location) {
    tags.location.push({
      id: `loc_${property.location.toLowerCase().replace(/\s+/g, '_')}`,
      name: property.location,
      category: 'location',
      weight: 1.0
    });
  }

  // Type tags
  if (property.type) {
    tags.type.push({
      id: `type_${property.type}`,
      name: property.type,
      category: 'type',
      weight: 0.8
    });
  }

  // Automatically determine category based on price if not provided
  let category = property.category;
  if (property.price && !category) {
    category = determinePropertyCategory(property.price);
  }

  // Category tags
  if (category) {
    tags.type.push({
      id: `cat_${category}`,
      name: category,
      category: 'type',
      weight: 0.7
    });
  }

  // Amenity tags
  if (property.amenities && Array.isArray(property.amenities)) {
    property.amenities.forEach((amenity: string) => {
      tags.amenities.push({
        id: `amenity_${amenity.toLowerCase().replace(/\s+/g, '_')}`,
        name: amenity,
        category: 'amenity',
        weight: 0.6
      });
    });
  }

  // Feature tags based on property characteristics
  if (property.bedrooms) {
    tags.features.push({
      id: `bedrooms_${property.bedrooms}`,
      name: `${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}`,
      category: 'feature',
      weight: 0.5
    });
  }

  if (property.bathrooms) {
    tags.features.push({
      id: `bathrooms_${property.bathrooms}`,
      name: `${property.bathrooms} bathroom${property.bathrooms > 1 ? 's' : ''}`,
      category: 'feature',
      weight: 0.5
    });
  }

  if (property.area) {
    tags.features.push({
      id: `area_${property.area}`,
      name: `${property.area}m²`,
      category: 'feature',
      weight: 0.4
    });
  }

  return tags;
};

// Search relevance scoring based on tags
export const calculateSearchRelevance = (
  property: any, 
  searchQuery: string
): number => {
  const tags = extractPropertyTags(property);
  const query = searchQuery.toLowerCase();
  let score = 0;

  // Check title and description
  if (property.title?.toLowerCase().includes(query)) {
    score += 2.0;
  }
  if (property.description?.toLowerCase().includes(query)) {
    score += 1.0;
  }

  // Check location tags
  tags.location.forEach(tag => {
    if (tag.name.toLowerCase().includes(query)) {
      score += tag.weight;
    }
  });

  // Check type tags
  tags.type.forEach(tag => {
    if (tag.name.toLowerCase().includes(query)) {
      score += tag.weight;
    }
  });

  // Check amenity tags
  tags.amenities.forEach(tag => {
    if (tag.name.toLowerCase().includes(query)) {
      score += tag.weight;
    }
  });

  // Check feature tags
  tags.features.forEach(tag => {
    if (tag.name.toLowerCase().includes(query)) {
      score += tag.weight;
    }
  });

  return score;
};

// Filter properties based on tags
export const filterPropertiesByTags = (
  properties: any[],
  filters: {
    location?: string[];
    amenities?: string[];
    type?: string[];
    features?: string[];
  }
): any[] => {
  return properties.filter(property => {
    const tags = extractPropertyTags(property);

    // Location filter
    if (filters.location && filters.location.length > 0) {
      const propertyLocations = tags.location.map(tag => tag.name.toLowerCase());
      const hasMatchingLocation = filters.location.some(loc => 
        propertyLocations.includes(loc.toLowerCase())
      );
      if (!hasMatchingLocation) return false;
    }

    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      const propertyAmenities = tags.amenities.map(tag => tag.name.toLowerCase());
      const hasAllAmenities = filters.amenities.every(amenity => 
        propertyAmenities.includes(amenity.toLowerCase())
      );
      if (!hasAllAmenities) return false;
    }

    // Type filter
    if (filters.type && filters.type.length > 0) {
      const propertyTypes = tags.type.map(tag => tag.name.toLowerCase());
      const hasMatchingType = filters.type.some(type => 
        propertyTypes.includes(type.toLowerCase())
      );
      if (!hasMatchingType) return false;
    }

    return true;
  });
};
