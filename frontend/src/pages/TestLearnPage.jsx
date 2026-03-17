import React from 'react';

export default function TestLearnPage() {
  return (
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-4">Learn Page Test ✅</h1>
      <p className="text-lg text-gray-300">If you see this page, the routing works!</p>
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Demo Course Structure</h2>
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="font-bold">Section 1: Fundamentals</h3>
            <ul className="ml-4 mt-2 text-gray-300">
              <li>📝 Lecture 1: What is JavaScript?</li>
              <li>📝 Lecture 2: Setup Your Environment</li>
              <li className="text-yellow-400">▶️ Lecture 3: Variables & Data Types (Currently Viewing)</li>
            </ul>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="font-bold">Section 2: Functions</h3>
            <ul className="ml-4 mt-2 text-gray-300">
              <li>📝 Lecture 4: Function Basics</li>
              <li>📝 Lecture 5: Arrow Functions</li>
              <li>📝 Lecture 6: Closures & Scope</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-gray-400">Progress: 2/9 lectures completed (22%)</p>
      </div>
    </div>
  );
}
