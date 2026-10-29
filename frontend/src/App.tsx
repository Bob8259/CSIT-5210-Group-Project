import { useState } from 'react'
import { Sparkles, ClipboardList, CheckSquare, BarChart3, Layers } from 'lucide-react'

export default function App() {
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'labeling' | 'recommend' | 'evaluation'>('questionnaire')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                Cold-Start Volunteer RecSys
              </h1>
              <p className="text-xs text-slate-500">CSIT5210 Group 1 Course Project</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('questionnaire')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'questionnaire'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Questionnaire</span>
            </button>
            <button
              onClick={() => setActiveTab('labeling')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'labeling'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Relevance Labels</span>
            </button>
            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'recommend'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Models Comparison</span>
            </button>
            <button
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Evaluation</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'questionnaire' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">1. Onboarding Questionnaire</h2>
            <p className="text-slate-600 text-sm mb-6">
              Simulate cold-start profiles for new users. Collect interests, available times, locations, and time commitments.
            </p>
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Questionnaire form component will be integrated here.
            </div>
          </div>
        )}

        {activeTab === 'labeling' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">2. Ground-Truth Relevance Labeling</h2>
            <p className="text-slate-600 text-sm mb-6">
              Review real volunteer events from the catalog and rate them (Interested / Neutral / Not Interested) to create test labels.
            </p>
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Event rating interface will be integrated here.
            </div>
          </div>
        )}

        {activeTab === 'recommend' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">3. Recommendation Comparison</h2>
            <p className="text-slate-600 text-sm mb-6">
              Compare 3 models: <strong>TF-IDF Baseline</strong> vs. <strong>Semantic Embeddings</strong> vs. <strong>Retrieval + LLM Reranking</strong>.
            </p>
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Side-by-side recommendation view will be integrated here.
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">4. Experimental Evaluation</h2>
            <p className="text-slate-600 text-sm mb-6">
              Evaluate and plot ranking performance across all 5 users using <strong>Recall@K</strong> and <strong>NDCG@K</strong>.
            </p>
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
              Evaluation metrics and chart dashboard will be integrated here.
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
