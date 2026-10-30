import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  ClipboardList, 
  CheckSquare, 
  Layers, 
  BarChart3, 
  Sliders, 
  Sparkles, 
  LogIn, 
  ArrowRight,
  Heart,
  MapPin,
  Clock,
  UserCheck
} from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'labeling' | 'recommend' | 'evaluation'>('questionnaire')

  return (
    <div className="space-y-6">
      {/* User Onboarding Status Banner */}
      {!user ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sign in to Test Cold-Start Recommendations</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose one of the 10 test accounts to simulate onboarding and compare recommendation models.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In Account</span>
          </Link>
        </div>
      ) : !user.has_preferences ? (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Preferences Required: {user.name}</h3>
              <p className="text-xs text-amber-700 mt-0.5">
                You haven't set your volunteering interests yet. Complete the short questionnaire to build your cold-start profile!
              </p>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shrink-0"
          >
            <span>Complete Onboarding</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">{user.name}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Profile Active
                </span>
              </div>
              <div className="text-slate-600 text-xs mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {user.preferred_causes?.length > 0 && (
                  <span className="flex items-center">
                    <Heart className="w-3 h-3 text-rose-500 mr-1" />
                    {user.preferred_causes.join(', ')}
                  </span>
                )}
                {user.preferred_regions?.length > 0 && (
                  <span className="flex items-center">
                    <MapPin className="w-3 h-3 text-blue-500 mr-1" />
                    {user.preferred_regions.join(', ')}
                  </span>
                )}
                {user.max_duration_hours && (
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 text-purple-500 mr-1" />
                    &le; {user.max_duration_hours}h
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/onboarding"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 px-3 py-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 transition-colors shrink-0"
          >
            Edit Preferences
          </Link>
        </div>
      )}

      {/* Subnav for the 4 workflow steps */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveTab('questionnaire')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
            activeTab === 'questionnaire'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
              : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>1. Questionnaire Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('labeling')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
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
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
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
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">1. Onboarding Questionnaire Profile</h2>
              <p className="text-slate-600 text-sm mt-1">
                Collects explicit preference dimensions (causes, regions, skills, time constraints) to represent the user under cold start.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shrink-0"
            >
              <Sliders className="w-4 h-4" />
              <span>{user?.has_preferences ? 'Update Questionnaire' : 'Start Questionnaire'}</span>
            </Link>
          </div>

          {user?.has_preferences ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Constructed Text Representation (For TF-IDF & Vector Embeddings)
                </h4>
                <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono bg-white p-3.5 rounded-lg border border-slate-200">
                  {user.profile_text || 'No text generated.'}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block">Causes Selected</span>
                  <span className="font-semibold text-sm text-slate-800">
                    {user.preferred_causes?.length || 0} topics
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block">Regions</span>
                  <span className="font-semibold text-sm text-slate-800">
                    {user.preferred_regions?.join(', ') || 'Anywhere'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-500 block">Max Duration</span>
                  <span className="font-semibold text-sm text-slate-800">
                    {user.max_duration_hours ? `${user.max_duration_hours} hours` : 'Flexible'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <Sliders className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Preferences Set for Current User</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Click below to complete the onboarding questionnaire and generate cold-start recommendations.
              </p>
              <Link
                to="/onboarding"
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
              >
                Open Questionnaire
              </Link>
            </div>
          )}
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
            Evaluate and plot ranking performance across all test users using <strong>Recall@K</strong> and <strong>NDCG@K</strong>.
          </p>
          <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400">
            Evaluation metrics and chart dashboard will be integrated here.
          </div>
        </div>
      )}
    </div>
  )
}
