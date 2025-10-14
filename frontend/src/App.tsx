import { useState } from "react";
import { NavBar } from "./components/layout/NavBar";
import { AppSidebar } from "./components/layout/AppSidebar";
import { Dashboard } from "./components/pages/Dashboard";
import { AnalysisResults } from "./components/pages/AnalysisResults";
import { Settings } from "./components/pages/Settings";
import { Upload } from "./components/pages/Upload";
import { EmptyState } from "./components/common/EmptyState";

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "upload":
        return <Upload />;
      case "analytics":
        return <AnalysisResults />;
      case "contracts":
        return (
          <EmptyState
            title="Contract Archive"
            description="Your complete contract library will be displayed here. Deploy your first contract to begin building your archive."
            actionLabel="Deploy Contract"
            onAction={() => setCurrentPage("upload")}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Animated background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-orange-100/40 via-transparent to-amber-50/60 pointer-events-none" />
      
      {/* Top Navigation */}
      <NavBar />

      {/* Main Layout */}
      <div className="relative flex">
        {/* Sidebar */}
        <AppSidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content */}
        <main className="relative flex-1 p-6 lg:ml-64">
          <div className="mx-auto max-w-7xl">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}
