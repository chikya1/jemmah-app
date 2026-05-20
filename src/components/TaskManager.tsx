import React from 'react';

export default function TaskManager() {
  const tasks = [
    { id: 1, title: 'Check system updates' },
    { id: 2, title: 'Schedule meeting with team' },
    { id: 3, title: 'Review Jemmah logs' }
  ];

  return (
    <div className="p-6 bg-white h-full">
      <h2 className="text-2xl font-bold mb-4">Your Tasks</h2>
      <ul className="space-y-3">
        {tasks.map(task => (
          <li key={task.id} className="p-4 border rounded-lg shadow-sm flex items-center gap-3">
            <input type="checkbox" className="w-5 h-5" />
            <span className="text-lg">{task.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
