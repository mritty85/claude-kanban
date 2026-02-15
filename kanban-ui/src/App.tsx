import { useState } from 'react'
import { KanbanBoard } from './components/KanbanBoard'
import { WorkspaceHome } from './components/WorkspaceHome'

type AppView = 'workspace' | 'board';

function App() {
  const [view, setView] = useState<AppView>('workspace');

  return (
    <div className="h-screen bg-[var(--color-bg-base)]">
      {view === 'workspace' ? (
        <WorkspaceHome
          onOpenProject={() => setView('board')}
        />
      ) : (
        <KanbanBoard
          onBackToWorkspace={() => setView('workspace')}
        />
      )}
    </div>
  )
}

export default App
