
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Dashboard from '@/pages/Dashboard';
import Diagnostic from '@/pages/Diagnostic';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function App() {
  const { currentUser } = useCurrentUser();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-semibold">Application</h1>
                <div className="flex space-x-4">
                  <Link to="/" className="text-gray-600 hover:text-gray-900">
                    Tableau de bord
                  </Link>
                  <Link to="/diagnostic" className="text-gray-600 hover:text-gray-900">
                    Diagnostic
                  </Link>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Utilisateur: {currentUser}
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
          </Routes>
        </main>
      </div>
      <Toaster />
    </Router>
  );
}

export default App;
