import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import CreateActivityModal from "./CreateActivityModal";

const SHOW_FOOTER = false; // Toggle between header and footer navigation

export default function AppLayout() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleActivityCreated = () => {
    setShowCreateModal(false);
    // Note: Activity refresh will be handled by the specific page components
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onCreateClick={handleCreateClick} />

      <main className={`${SHOW_FOOTER ? "pb-20" : "pt-16"} page-transition`}>
        <Outlet />
      </main>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onActivityCreated={handleActivityCreated}
      />
    </div>
  );
}
