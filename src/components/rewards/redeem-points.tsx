import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRewardsStore } from '@/lib/store/rewards-store';
import { toast } from 'sonner';

const rewardOptions = [
  { points: 500, description: 'Free Breakfast', value: 25 },
  { points: 1000, description: 'Room Upgrade', value: 50 },
  { points: 2000, description: 'Free Night Stay', value: 100 },
  { points: 5000, description: 'Luxury Package', value: 250 },
];

export function RedeemPoints() {
  const { points, redeemPoints, getAvailablePoints } = useRewardsStore();
  const availablePoints = getAvailablePoints();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleRedeem = (pointsCost: number, description: string) => {
    if (availablePoints < pointsCost) {
      toast.error('Not enough points available');
      return;
    }

    redeemPoints(pointsCost, description);
    toast.success(`Successfully redeemed ${description}`);
    setSelectedOption(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Redeem Points</CardTitle>
        <CardDescription>
          Use your points to get amazing rewards and benefits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm flex justify-between items-center pb-2 border-b">
          <span>Available Points</span>
          <span className="font-medium">{availablePoints.toLocaleString()}</span>
        </div>

        <div className="grid gap-4">
          {rewardOptions.map((option, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-all ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedOption(index)}
              role="button"
              tabIndex={0}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{option.description}</h4>
                  <p className="text-sm text-gray-500">Value: ${option.value}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{option.points.toLocaleString()} pts</p>
                  <Button
                    size="sm"
                    variant={availablePoints >= option.points ? "default" : "outline"}
                    disabled={availablePoints < option.points}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRedeem(option.points, option.description);
                    }}
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-4">
          * Points will be deducted immediately upon redemption. All rewards are subject to
          availability and terms & conditions.
        </p>
      </CardContent>
    </Card>
  );
}