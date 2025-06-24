import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Hash, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KeywordInput({ keywords, onKeywordsChange, spiceWords, onSpiceWordsChange }) {
  const [keywordInput, setKeywordInput] = useState("");
  const [spiceInput, setSpiceInput] = useState("");

  // Debug the props received
  useEffect(() => {
    console.log("KeywordInput component props:", {
      keywords,
      spiceWords,
      keywordsLength: keywords?.length,
      spiceWordsLength: spiceWords?.length
    });
  }, [keywords, spiceWords]);

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      // Create a copy to avoid direct state mutation
      const newKeywords = Array.isArray(keywords) ? [...keywords] : [];
      newKeywords.push(keywordInput.trim());
      
      console.log("Adding keyword:", keywordInput.trim(), "New keywords array:", newKeywords);
      onKeywordsChange(newKeywords);
      setKeywordInput("");
    }
  };

  const removeKeyword = (index) => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    console.log("Removing keyword at index", index, "New keywords array:", newKeywords);
    onKeywordsChange(newKeywords);
  };

  const addSpiceWord = () => {
    if (spiceInput.trim() && !spiceWords.includes(spiceInput.trim())) {
      // Create a copy to avoid direct state mutation
      const newSpiceWords = Array.isArray(spiceWords) ? [...spiceWords] : [];
      newSpiceWords.push(spiceInput.trim());
      
      console.log("Adding spice word:", spiceInput.trim(), "New spice words array:", newSpiceWords);
      onSpiceWordsChange(newSpiceWords);
      setSpiceInput("");
    }
  };

  const removeSpiceWord = (index) => {
    const newSpiceWords = spiceWords.filter((_, i) => i !== index);
    console.log("Removing spice word at index", index, "New spice words array:", newSpiceWords);
    onSpiceWordsChange(newSpiceWords);
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleSpiceKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpiceWord();
    }
  };

  return (
    <div className="space-y-6">
      {/* Custom Keywords */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg">Custom Keywords</div>
              <div className="text-sm text-gray-400 font-normal">Add your own trending words</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder="Enter keyword..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
            <Button 
              onClick={addKeyword}
              disabled={!keywordInput.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <AnimatePresence>
            {Array.isArray(keywords) && keywords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {keywords.map((keyword, index) => (
                  <motion.div
                    key={keyword}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 pr-1">
                      {keyword}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyword(index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-red-500/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Spice Words */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg">Spice Words</div>
              <div className="text-sm text-gray-400 font-normal">Add extra flavor to your meme</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={spiceInput}
              onChange={(e) => setSpiceInput(e.target.value)}
              onKeyPress={handleSpiceKeyPress}
              placeholder="e.g., epic, viral, based..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder-gray-400"
            />
            <Button 
              onClick={addSpiceWord}
              disabled={!spiceInput.trim()}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <AnimatePresence>
            {Array.isArray(spiceWords) && spiceWords.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2"
              >
                {spiceWords.map((word, index) => (
                  <motion.div
                    key={word}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 pr-1">
                      {word}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpiceWord(index)}
                        className="ml-1 h-4 w-4 p-0 hover:bg-red-500/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="text-xs text-gray-400">
            💡 Pro tip: Use words like "based", "fire", "no cap", "sus" for viral appeal
          </div>
        </CardContent>
      </Card>
    </div>
  );
}