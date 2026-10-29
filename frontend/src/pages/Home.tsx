import { useState } from 'react'
import { ClipboardList, CheckSquare, Layers, BarChart3 } from 'lucide-react'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'labeling' | 'recommend' | 'evaluation'>('questionnaire')

  return (
    <div className="space-y-6">
      {/* Subnav for the 4 workflow steps */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('questionnaire')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'questionnaire'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>1. Questionnaire</span>
        </button>

        <button
          onClick={() => setActiveTab('labeling')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'labeling'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>2. Relevance Labels</span>
        </button>

        <button
          onClick={() => setActiveTab('recommend')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'recommend'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>3. Models Comparison</span>
        </button>

        <button
          onClick={() => setActiveTab('evaluation')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'evaluation'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>4. Evaluation Metrics</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'questionnaire' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">1. Onboarding Questionnaire</h2>
          <p className="text-slate-600 text-sm mb-6">
            Simulate cold-start profiles for new users. Collect interests, available times, locations, and time commitments.
          </p>
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
            Questionnaire form component will be integrated here.
          </div>
        </div>
      )}

      {activeTab === 'labeling' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">2. Ground-Truth Relevance Labeling</h2>
          <p className="text-slate-600 text-sm mb-6">
            Review real volunteer events from the catalog and rate them (Interested / Neutral / Not Interested) to create test labels.
          </p>
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
            Event rating interface will be integrated here.
          </div>
        </div>
      )}

      {activeTab === 'recommend' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">3. Recommendation Comparison</h2>
          <p className="text-slate-600 text-sm mb-6">
            Compare 3 models: <strong>TF-IDF Baseline</strong> vs. <strong>Semantic Embeddings</strong> vs. <strong>Retrieval + LLM Reranking</strong>.
          </p>
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
            Side-by-side recommendation view will be integrated here.
          </div>
        </div>
      )}

      {activeTab === 'evaluation' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">4. Experimental Evaluation</h2>
          <p className="text-slate-600 text-sm mb-6">
            Evaluate and plot ranking performance across all 5 users using <strong>Recall@K</strong> and <strong>NDCG@K</strong>.
          </p>
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
            Evaluation metrics and chart dashboard will be integrated here.
          </div>
        </div>
      )}
    </div>
  )
}

