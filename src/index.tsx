import './index.css';
import { useState } from "react";
import React from "react";
import ReactDOM from "react-dom/client";
import { ChatInterface } from "./components/ChatInterface";
import { Header } from "./components/Header";
import { FeatureCards } from "./components/FeatureCards";
import { FileUpload } from "./components/FileUpload";
import { SearchBar } from "./components/SearchBar";
import { GradientBackground } from "./components/GradientBackground";
import { AppToaster } from "./components/ui/toaster"; // if you've set it up
//import { useToast } from "@/hooks/use-toast"; // optional if you want to use toast
import { ChatProvider } from "./context/ChatContext";
import { DocumentList } from "./components/DocumentList";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <GradientBackground>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 dark:bg-cyan-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      <Header />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent mb-6 animate-fade-in leading-tight">
              Biology Research
              <br />
              <span className="text-6xl">Assistant</span>
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full animate-pulse"></div>
          </div>
          
          <p className="text-xl text-gray-700 dark:text-gray-200 mb-12 max-w-4xl mx-auto animate-fade-in leading-relaxed">
            Your intelligent companion for biological research, powered by <span className="font-semibold text-purple-600 dark:text-purple-400">advanced AI</span>. 
            Ask questions, upload documents, and get instant insights from vast biological knowledge.
          </p>
          
          <div className="flex justify-center mb-16">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/20 dark:border-gray-700/20">
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "chat"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  💬 Chat Assistant
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "search"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  🔍 Search Knowledge
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    activeTab === "upload"
                      ? "bg-gradient-to-r from-pink-600 to-cyan-600 text-white shadow-lg shadow-pink-500/25"
                      : "text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  📄 Upload Documents
                </button>
                <button
                onClick={() => setActiveTab("documents")}
                className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === "documents"
                    ? "bg-gradient-to-r from-cyan-600 to-olive-600 text-white shadow-lg shadow-green-500/25"
                    : "text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                }`}
              >
                📁 Show Documents
              </button>
              </div>
            </div>
          </div>

          {/* Main Interface */}
          <div className="max-w-5xl mx-auto">
            <div className="transform transition-all duration-500 hover:scale-[1.02]">
              {activeTab === "chat" && <ChatInterface />}
              {activeTab === "search" && <SearchBar />}
              {activeTab === "upload" && <FileUpload />}
              {activeTab === "documents" && <DocumentList />}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-white/20 dark:border-gray-700/20">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-600 to-gray-900 dark:from-white dark:via-purple-400 dark:to-white bg-clip-text text-transparent mb-4">
              Powerful Features for Biological Research
            </h2>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-500 to-cyan-500 mx-auto rounded-full"></div>
          </div>
          <FeatureCards />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 dark:from-black dark:via-purple-950 dark:to-black text-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Biology Research Assistant
          </h3>
          <p className="text-gray-300 mb-8 text-lg">
            Advancing biological research through intelligent AI assistance
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400">
            <span className="hover:text-purple-400 transition-colors">© 2025 Biology Assistant</span>
            <span>•</span>
            <span className="hover:text-blue-400 transition-colors">Powered by Advanced AI</span>
            <span>•</span>
            <span className="hover:text-cyan-400 transition-colors">Research Grade</span>
          </div>
        </div>
      </footer>
    </GradientBackground>
  );
};

export default Index;
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <Index />
  </React.StrictMode>
);  