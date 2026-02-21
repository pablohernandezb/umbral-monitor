import Link from 'next/link'
import { getAllPrisonerStats, getAllReadingRoomItems, getNewsFeed } from '@/lib/data'
import { IS_MOCK_MODE } from '@/lib/supabase'
import { getParticipateStatsAction } from './participate/actions'

export default async function AdminDashboardPage() {
  const { data: prisoners } = await getAllPrisonerStats()
  const { data: readingRoom } = await getAllReadingRoomItems()
  const { data: news } = await getNewsFeed(1000)
  const { data: participateStats } = await getParticipateStatsAction()

  const latestPrisoner = prisoners?.[0]
  const totalPrisoners = latestPrisoner?.total_count || 0
  const totalReadingItems = readingRoom?.length || 0
  const totalNewsItems = news?.length || 0
  const totalSubmissions = (participateStats?.totalExpert || 0) + (participateStats?.totalPublic || 0)
  const pendingExperts = participateStats?.pendingExpert || 0

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of content management</p>
      </div>

      {IS_MOCK_MODE && (
        <div className="mb-8 p-6 bg-amber-950/20 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-amber-200 font-semibold mb-2">Mock Mode Active</h3>
              <p className="text-amber-300/80 text-sm mb-2">
                You are working with temporary in-memory data. All changes will be lost on server restart.
              </p>
              <p className="text-amber-300/80 text-sm">
                To persist changes, configure Supabase credentials in <code className="text-amber-200 font-mono">.env.local</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Prisoners</p>
              <p className="text-white text-2xl font-bold">{totalPrisoners.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">News Items</p>
              <p className="text-white text-2xl font-bold">{totalNewsItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Reading Room Items</p>
              <p className="text-white text-2xl font-bold">{totalReadingItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-950/30 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Submissions</p>
              <p className="text-white text-2xl font-bold">{totalSubmissions}</p>
              {pendingExperts > 0 && (
                <p className="text-amber-400 text-xs mt-1">{pendingExperts} pending review</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-[#111113] border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Link
            href="/admin/prisoners"
            className="p-6 border border-gray-700 hover:border-teal-500/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-teal-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-teal-400 transition-colors">
                  Manage Political Prisoners
                </h3>
                <p className="text-gray-400 text-sm">
                  Create, update, and delete prisoner statistics and organization breakdowns
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/news"
            className="p-6 border border-gray-700 hover:border-amber-500/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-amber-400 transition-colors">
                  Manage News Room
                </h3>
                <p className="text-gray-400 text-sm">
                  Add, edit, and remove news feed items across all categories
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/reading-room"
            className="p-6 border border-gray-700 hover:border-purple-500/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-purple-400 transition-colors">
                  Manage Reading Room
                </h3>
                <p className="text-gray-400 text-sm">
                  Add, edit, and remove books, articles, reports, and journalism resources
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/participate"
            className="p-6 border border-gray-700 hover:border-green-500/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-green-400 transition-colors">
                  Manage Submissions
                </h3>
                <p className="text-gray-400 text-sm">
                  Review expert submissions and moderate public poll responses
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/gdelt-events"
            className="p-6 border border-gray-700 hover:border-sky-500/50 rounded-lg transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sky-950/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1 group-hover:text-sky-400 transition-colors">
                  GDELT Event Timeline
                </h3>
                <p className="text-gray-400 text-sm">
                  Add, edit, and remove key political events shown on the GDELT signal chart
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {latestPrisoner && (
        <div className="mt-8 bg-[#111113] border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Latest Prisoner Data</h2>
          <div className="text-gray-300">
            <p className="mb-2">
              <span className="text-gray-400">Date:</span>{' '}
              <span className="font-mono">{latestPrisoner.date}</span>
            </p>
            <p className="mb-2">
              <span className="text-gray-400">Total:</span>{' '}
              <span className="text-teal-400 font-bold">{latestPrisoner.total_count.toLocaleString()}</span>
            </p>
            <p className="text-gray-400 text-sm mt-4">
              Last updated: {new Date(latestPrisoner.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
