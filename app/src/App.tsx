import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/custom/Sidebar';
import { Header } from '@/components/custom/Header';
import { StatsRow } from '@/components/custom/StatsRow';
import { WalletsCard } from '@/components/custom/WalletsCard';
import { IdentitiesCard } from '@/components/custom/IdentitiesCard';
import { ActivityCard } from '@/components/custom/ActivityCard';
import { PendingApprovals } from '@/components/custom/PendingApprovals';
import { Footer } from '@/components/custom/Footer';
import { ToastContainer } from '@/components/custom/ToastContainer';


function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  // Scroll to section when nav item is clicked
  useEffect(() => {
    const sectionMap: Record<string, string> = {
      dashboard: 'stats-section',
      wallets: 'wallets-section',
      identities: 'identities-section',
      activity: 'activity-section',
    };

    const elementId = sectionMap[activeSection];
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeSection]);

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Main Content */}
      <main className="lg:ml-[260px] min-h-screen">
        <div className="p-5 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <Header />

          {/* Stats Section */}
          <section id="stats-section" className="scroll-mt-8">
            <StatsRow />
          </section>

          {/* Pending Approvals */}
          <section className="mb-8">
            <PendingApprovals />
          </section>

          {/* Wallets & Identities Grid */}
          <section id="wallets-section" className="scroll-mt-8 mb-8">
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <WalletsCard />
              </div>
              <div id="identities-section" className="scroll-mt-8">
                <IdentitiesCard />
              </div>
            </div>
          </section>

          {/* Activity Section */}
          <section id="activity-section" className="scroll-mt-8 mb-8">
            <ActivityCard />
          </section>

          {/* Footer */}
          <Footer />
        </div>
      </main>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
