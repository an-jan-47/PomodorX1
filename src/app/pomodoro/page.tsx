export default function PomodoroPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black pt-20">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
          Pomodoro Timer
        </h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-2xl p-8 mb-8">
            <PomodoroTimer onOpenSettings={() => {}} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <h3 className="text-lg text-muted-foreground mb-2">Today</h3>
              <p className="text-3xl font-bold">{todayStats.sessions}</p>
              <p className="text-sm text-muted-foreground">Sessions completed</p>
            </div>
            
            <div className="glass-card rounded-xl p-6 text-center">
              <h3 className="text-lg text-muted-foreground mb-2">Focus Time</h3>
              <p className="text-3xl font-bold">{formatTime(totalFocusTime)}</p>
              <p className="text-sm text-muted-foreground">Total focus time</p>
            </div>
            
            <div className="glass-card rounded-xl p-6 text-center">
              <h3 className="text-lg text-muted-foreground mb-2">All Time</h3>
              <p className="text-3xl font-bold">{allTimeStats.sessions}</p>
              <p className="text-sm text-muted-foreground">Focus sessions completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}