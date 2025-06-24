import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Hash, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function TrendSelector({ trends, selectedTrends, onTrendSelect, isLoading = false, maxTrends = 10 }) {
  // Sort trends by popularity and take top ones
  const topTrends = [...trends]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, maxTrends);

  const handleTrendToggle = (trendId) => {
    if (selectedTrends.includes(trendId)) {
      onTrendSelect(selectedTrends.filter(id => id !== trendId));
    } else {
      onTrendSelect([...selectedTrends, trendId]);
    }
  };
  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg">Select Trending Topic</div>
            <div className="text-sm text-gray-400 font-normal">Choose the hottest trend</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
            <p className="text-gray-400">Loading trending topics...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topTrends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-gray-400">No trending topics found. Try again later.</p>
              </div>
            ) : (
              topTrends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => handleTrendToggle(trend.id)}
                >
                  <Checkbox
                    id={trend.id}
                    checked={selectedTrends.includes(trend.id)}
                    className="border-white/30 text-purple-500"
                  />
                  <Label htmlFor={trend.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-white">
                        <Hash className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">{trend.label}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${
                          trend.popularity > 90
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : trend.popularity > 80
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                            : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {trend.popularity}% hot
                      </Badge>
                    </div>
                  </Label>
                </motion.div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}