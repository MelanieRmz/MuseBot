import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Image, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function GenerationProgress({ step }) {
  const steps = [
    { id: 1, label: "Analyzing Trends", icon: Sparkles, description: "Processing viral patterns and keywords" },
    { id: 2, label: "Creating Memes", icon: Image, description: "Generating AI-powered meme images" },
    { id:3, label: "Finalizing", icon: CheckCircle, description: "Optimizing for viral potential" }
  ];

  const getProgress = () => {
    switch (step) {
      case 1: return 33;
      case 2: return 66;
      case 3: return 100;
      default: return 0;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="glass-effect border-white/10">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white">Generating Viral Memes</h2>
            <p className="text-gray-300">Our AI is crafting the perfect memes for maximum viral potential</p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={getProgress()} className="h-2" />
            <div className="text-center text-sm text-gray-400">
              {getProgress()}% Complete
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((stepInfo) => {
              const isActive = step === stepInfo.id;
              const isCompleted = step > stepInfo.id;
              const IconComponent = stepInfo.icon;

              return (
                <motion.div
                  key={stepInfo.id}
                  initial={{ opacity: 0.5 }}
                  animate={{ 
                    opacity: isActive || isCompleted ? 1 : 0.5,
                    scale: isActive ? 1.02 : 1
                  }}
                  className={`flex items-center space-x-4 p-4 rounded-lg ${
                    isActive ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isActive 
                      ? 'bg-purple-500' 
                      : 'bg-gray-600'
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <IconComponent className="w-5 h-5 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isActive || isCompleted ? 'text-white' : 'text-gray-400'
                    }`}>
                      {stepInfo.label}
                    </div>
                    <div className="text-sm text-gray-400">
                      {stepInfo.description}
                    </div>
                  </div>

                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="text-center text-sm text-gray-400">
            This usually takes 30-60 seconds. Please don't close this window.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}