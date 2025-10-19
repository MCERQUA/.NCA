import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';

interface ContractorCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  logoUrl?: string;
  verified?: boolean;
  specialties?: string[];
  yearsInBusiness?: number;
}

export const ContractorCard: React.FC<ContractorCardProps> = ({
  id,
  name,
  category,
  description,
  location,
  rating,
  reviewCount,
  imageUrl,
  logoUrl,
  verified = false,
  specialties = [],
  yearsInBusiness,
}) => {
  // Prioritize logo for card display, fall back to general image
  const cardImage = logoUrl || imageUrl;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Company Logo/Image */}
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
        {cardImage ? (
          <img
            src={cardImage}
            alt={`${name} logo`}
            className={`w-full h-full ${logoUrl ? 'object-contain p-8' : 'object-cover'} group-hover:scale-105 transition-transform duration-300`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl font-bold text-primary/20">
              {name.charAt(0)}
            </div>
          </div>
        )}
        {verified && (
          <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 flex items-center space-x-1 shadow-md">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-charcoal">Verified</span>
          </div>
        )}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <CardDescription className="flex items-center space-x-2">
              <span className="text-primary font-medium">{category}</span>
              {yearsInBusiness && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm">{yearsInBusiness}+ years</span>
                </>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-slate line-clamp-2">{description}</p>

        {/* Location */}
        <div className="flex items-center text-sm text-slate">
          <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          <span className="text-sm text-slate">({reviewCount} reviews)</span>
        </div>

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {specialties.slice(0, 3).map((specialty, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex space-x-2">
        <a href={`/contractor/${id}`} className="flex-1">
          <Button variant="outline" className="w-full" size="sm">
            View Profile
          </Button>
        </a>
        <a href={`/contractor/${id}`} className="flex-1">
          <Button className="w-full" size="sm">
            Contact
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};
