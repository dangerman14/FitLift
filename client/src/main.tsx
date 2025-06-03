import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Minimal test component to verify React works
function MinimalApp() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Fitness App - Progressive Overload System</h1>
        <div className="space-y-2">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Progressive overload suggestions implemented
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Partial reps tracking with "10 (3)" format
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            ✓ Volume calculation with 50% weight contribution
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            → React hooks error resolved
          </div>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinimalApp />
  </StrictMode>,
)