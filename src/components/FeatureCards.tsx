import { Brain, FileText, Search, Zap, Shield, Globe } from "lucide-react";
import * as React from 'react';


const features = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Advanced machine learning algorithms provide accurate and contextual answers to complex biological questions.",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20"
  },
  {
    icon: FileText,
    title: "Document Analysis",
    description: "Upload research papers, textbooks, and documents for instant analysis and question answering.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20"
  },
  {
    icon: Search,
    title: "Knowledge Search",
    description: "Search through vast biological databases and literature with semantic understanding.",
    gradient: "from-green-500 to-teal-500",
    bgGradient: "from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20"
  },
  {
    icon: Zap,
    title: "Real-time Responses",
    description: "Get instant answers to your questions with our optimized retrieval system.",
    gradient: "from-yellow-500 to-orange-500",
    bgGradient: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
  },
  {
    icon: Shield,
    title: "Reliable Sources",
    description: "All information is sourced from peer-reviewed scientific literature and validated databases.",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"
  },
  {
    icon: Globe,
    title: "Comprehensive Coverage",
    description: "From molecular biology to ecology, covering all major areas of biological science.",
    gradient: "from-emerald-500 to-blue-500",
    bgGradient: "from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20"
  },
];

export const FeatureCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div
          key={index}
          className={`group relative bg-gradient-to-br ${feature.bgGradient} backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 animate-fade-in overflow-hidden`}
          style={{ animationDelay: `${index * 150}ms` }}
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="relative z-10">
            <div className={`bg-gradient-to-r ${feature.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
              {feature.title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {feature.description}
            </p>
          </div>
          
          {/* Shine effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:animate-shine"></div>
        </div>
      ))}
    </div>
  );
};