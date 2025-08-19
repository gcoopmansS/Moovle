import { Outlet } from "react-router-dom";
import Header from "./Header";
import NavigationFooter from "./NavigationFooter";

const SHOW_FOOTER = false; // Toggle between header and footer navigation

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className={`${SHOW_FOOTER ? "pb-20" : "pt-16"}`}>
        <Outlet />
      </main>

      {SHOW_FOOTER && <NavigationFooter />}
    </div>
  );
}
