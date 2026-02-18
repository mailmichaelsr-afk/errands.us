// components/PricingCalculator.tsx
// Smart pricing suggestions based on distance, time, and urgency

"use client";
import { useState, useEffect } from "react";

type PricingFactors = {
  distance?: number; // miles
  pickupAddress: string;
  dropoffAddress: string;
  urgency: 'asap' | 'flexible' | 'scheduled';
  scheduledTime?: string;
  itemType?: 'light' | 'medium' | 'heavy' | 'fragile';
};

type PricingSuggestion = {
  base: number;
  distance: number;
  urgency: number;
  timeOfDay: number;
  itemType: number;
  total: number;
  min: number;
  max: number;
};

export function PricingCalculator({ 
  pickupAddress, 
  dropoffAddress, 
  urgency,
  scheduledTime,
  itemType = 'light',
  onPriceCalculated 
}: PricingFactors & { onPriceCalculated?: (price: number) => void }) {
  const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
  const [calculating, setCalculating] = useState(false);

  const calculatePrice = async () => {
    setCalculating(true);

    try {
      // Estimate distance (in real app, use Google Distance Matrix API)
      const estimatedDistance = estimateDistance(pickupAddress, dropoffAddress);

      // Base price
      const base = 5.00;

      // Distance surcharge: $1.50 per mile
      const distanceFee = estimatedDistance * 1.50;

      // Urgency multiplier
      const urgencyFee = urgency === 'asap' ? 5.00 : urgency === 'scheduled' ? 0 : 2.00;

      // Time of day surcharge
      let timeOfDayFee = 0;
      if (scheduledTime) {
        const hour = new Date(scheduledTime).getHours();
        // Rush hours (7-9am, 5-7pm) or late night (10pm-6am) = extra
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
          timeOfDayFee = 3.00; // Rush hour
        } else if (hour >= 22 || hour <= 6) {
          timeOfDayFee = 5.00; // Late night premium
        }
      }

      // Item type surcharge
      const itemTypeFees = { light: 0, medium: 2.00, heavy: 5.00, fragile: 4.00 };
      const itemFee = itemTypeFees[itemType];

      const total = base + distanceFee + urgencyFee + timeOfDayFee + itemFee;
      const min = Math.floor(total * 0.85); // 15% below
      const max = Math.ceil(total * 1.15);  // 15% above

      const result = {
        base,
        distance: distanceFee,
        urgency: urgencyFee,
        timeOfDay: timeOfDayFee,
        itemType: itemFee,
        total: Math.round(total * 100) / 100,
        min,
        max
      };

      setSuggestion(result);
      if (onPriceCalculated) onPriceCalculated(result.total);
    } catch (e) {
      console.error('Price calculation failed:', e);
    }

    setCalculating(false);
  };

  useEffect(() => {
    if (pickupAddress && dropoffAddress) {
      calculatePrice();
    }
  }, [pickupAddress, dropoffAddress, urgency, scheduledTime, itemType]);

  if (!suggestion) return null;

  return (
    <div style={{
      background: '#f0f7f0',
      border: '1.5px solid #7ab87a',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '12px'
    }}>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#2d4a2d', marginBottom: '8px' }}>
        💡 Suggested Price
      </div>
      
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2d4a2d', marginBottom: '8px' }}>
        ${suggestion.total.toFixed(2)}
      </div>

      <div style={{ fontSize: '0.78rem', color: '#666', marginBottom: '12px' }}>
        Typical range: ${suggestion.min} - ${suggestion.max}
      </div>

      <details style={{ fontSize: '0.82rem', color: '#666' }}>
        <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 500 }}>
          See breakdown
        </summary>
        <div style={{ paddingLeft: '12px', lineHeight: 1.8 }}>
          <div>Base fee: ${suggestion.base.toFixed(2)}</div>
          {suggestion.distance > 0 && <div>Distance: +${suggestion.distance.toFixed(2)}</div>}
          {suggestion.urgency > 0 && <div>Urgency: +${suggestion.urgency.toFixed(2)}</div>}
          {suggestion.timeOfDay > 0 && <div>Time premium: +${suggestion.timeOfDay.toFixed(2)}</div>}
          {suggestion.itemType > 0 && <div>Item type: +${suggestion.itemType.toFixed(2)}</div>}
        </div>
      </details>
    </div>
  );
}

// Simple distance estimator (replace with Google Maps API for accuracy)
function estimateDistance(pickup: string, dropoff: string): number {
  // Very rough estimate based on zip code difference
  const pickupZip = pickup.match(/\b\d{5}\b/)?.[0];
  const dropoffZip = dropoff.match(/\b\d{5}\b/)?.[0];
  
  if (!pickupZip || !dropoffZip) return 3; // Default 3 miles
  
  const zipDiff = Math.abs(parseInt(pickupZip) - parseInt(dropoffZip));
  
  // Rough heuristic: zip codes ~100 apart = ~10 miles
  return Math.min(Math.max(zipDiff / 10, 1), 20); // Between 1-20 miles
}
