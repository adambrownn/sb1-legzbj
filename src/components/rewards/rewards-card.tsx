import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useRewardsStore } from '@/lib/store/rewards-store';
import { Star, Award, Trophy, Crown } from 'lucide-react';

const tierIcons = {
  BRONZE: Star,
  SILVER: Award,
  GOLD: Trophy,
  PLATINUM: Crown,
};

const tierColors = {
  BRONZE: 'bg-orange-500',
  SILVER: 'bg-gray-400',
  GOLD: 'bg-yellow-500',
  PLATINUM: 'bg-purple-600',
};

const tierBenefits = {
  BRONZE: ['5% off bookings', 'Priority customer support'],
  SILVER: ['10% off bookings', 'Late checkout', 'Welcome drinks'],
  GOLD: ['15% off bookings', 'Room upgrades', 'Airport transfers'],
  PLATINUM: ['20% off bookings', 'Suite upgrades', 'Personal concierge'],
};

export function RewardsCard() {
  const { points, tier, pointsHistory, getAvailablePoints } = useRewardsStore();
  const availablePoints = getAvailablePoints();
  const TierIcon = tierIcons[tier];
  
  const nextTier = {
    BRONZE: { name: 'SILVER', threshold: 1000 },
    SILVER: { name: 'GOLD', threshold: 5000 },
    GOLD: { name: 'PLATINUM', threshold: 10000 },
    PLATINUM: { name: 'PLATINUM', threshold: 10000 },
  }[tier];

  const progress = Math.min((points / nextTier.threshold) * 100, 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">My Rewards</CardTitle>
          <Badge className={`${tierColors[tier]} text-white`}>
            <TierIcon className="w-4 h-4 mr-1" />
            {tier}
          </Badge>
        </div>
        <CardDescription>
          Earn points with every booking and unlock exclusive benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Available Points</span>
            <span className="font-medium">{availablePoints.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Points Earned</span>
            <span className="font-medium">{points.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to {tier === 'PLATINUM' ? 'MAX' : nextTier.name}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {tier !== 'PLATINUM' && (
            <p className="text-sm text-gray-500">
              {(nextTier.threshold - points).toLocaleString()} points needed for {nextTier.name}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Current Tier Benefits</h3>
          <ul className="space-y-1">
            {tierBenefits[tier].map((benefit, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {pointsHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Recent Activity</h3>
            <div className="space-y-1">
              {pointsHistory.slice(-3).map((entry, index) => (
                <div key={index} className="text-sm flex justify-between">
                  <span className="text-gray-600">{entry.description}</span>
                  <span className={entry.points > 0 ? 'text-green-600' : 'text-red-600'}>
                    {entry.points > 0 ? '+' : ''}{entry.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}