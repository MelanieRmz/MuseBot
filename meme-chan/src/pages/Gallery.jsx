import React, { useState, useEffect } from "react";
import { Meme } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter, Zap, Calendar, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Gallery() {
  const [memes, setMemes] = useState([]);
  const [filteredMemes, setFilteredMemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMemes();
  }, []);

  useEffect(() => {
    filterAndSortMemes();
  }, [memes, searchTerm, sortBy, filterBy]);

  const loadMemes = async () => {
    setIsLoading(true);
    try {
      const memesData = await Meme.list("-created_date");
      setMemes(memesData);
    } catch (error) {
      console.error("Failed to load memes:", error);
    }
    setIsLoading(false);
  };

  const filterAndSortMemes = () => {
    let filtered = [...memes];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(meme =>
        meme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meme.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (filterBy !== "all") {
      if (filterBy === "minted") {
        filtered = filtered.filter(meme => meme.minted);
      } else if (filterBy === "favorites") {
        filtered = filtered.filter(meme => meme.is_favorite);
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case "price_high":
        filtered.sort((a, b) => (b.mint_price || 0) - (a.mint_price || 0));
        break;
      case "price_low":
        filtered.sort((a, b) => (a.mint_price || 0) - (b.mint_price || 0));
        break;
    }

    setFilteredMemes(filtered);
  };

  const toggleFavorite = async (memeId) => {
    const meme = memes.find(m => m.id === memeId);
    if (meme) {
      await Meme.update(memeId, { is_favorite: !meme.is_favorite });
      loadMemes();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect rounded-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white">Loading your memes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white">
            Meme Gallery
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Browse, manage, and mint your viral creations
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search memes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Memes</SelectItem>
                <SelectItem value="minted">Minted Only</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Filter className="w-4 h-4" />
              <span>{filteredMemes.length} results</span>
            </div>
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <AnimatePresence>
          {filteredMemes.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMemes.map((meme, index) => (
                <motion.div
                  key={meme.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass-effect border-white/10 overflow-hidden group hover:glow-purple transition-all duration-300">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute top-4 right-4 flex space-x-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleFavorite(meme.id)}
                            className={`w-8 h-8 ${meme.is_favorite ? 'text-red-400' : 'text-white/70'} hover:text-red-400`}
                          >
                            <Heart className={`w-4 h-4 ${meme.is_favorite ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        
                        <div className="absolute bottom-4 left-4 right-4">
                          <Link to={createPageUrl("Mint") + `?meme=${meme.id}`}>
                            <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                              <Zap className="w-4 h-4 mr-2" />
                              {meme.minted ? 'View Mint' : 'Mint Now'}
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {meme.minted && (
                          <Badge className="bg-green-500/80 text-white border-0">
                            Minted
                          </Badge>
                        )}
                        {meme.trending_topic && (
                          <Badge className="bg-blue-500/80 text-white border-0">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Trending
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        <h3 className="text-white font-semibold line-clamp-2 text-sm">
                          {meme.title}
                        </h3>
                        
                        <div className="flex flex-wrap gap-1">
                          {meme.keywords?.slice(0, 2).map((keyword, i) => (
                            <Badge key={i} variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                              {keyword.replace('#', '')}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(meme.created_date).toLocaleDateString()}</span>
                        </div>
                        <div className="font-medium text-white">
                          {meme.mint_price?.toFixed(4)} ETH
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="glass-effect rounded-xl p-12 max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No memes found</h3>
                <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
                <Link to={createPageUrl("Home")}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Generate New Memes
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}