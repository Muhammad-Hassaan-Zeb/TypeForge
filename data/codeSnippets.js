window.TypeForgeData = window.TypeForgeData || {};
window.TypeForgeData.codeSnippets = [
  { category: 'JavaScript', snippet: 'const users = await database.findAll();' },
  { category: 'JavaScript', snippet: 'function forgeScore(wpm, accuracy) { return wpm * (accuracy / 100); }' },
  { category: 'JavaScript', snippet: 'const palette = { accent: "#6366F1", success: "#22C55E" };' },
  { category: 'SQL', snippet: 'SELECT * FROM employees WHERE salary > 5000;' },
  { category: 'SQL', snippet: 'UPDATE employees SET role = "designer" WHERE id = 42;' },
  { category: 'Python', snippet: 'for user in users:\n    print(user.name)' },
  { category: 'Python', snippet: 'def format_score(score):\n    return round(score, 1)' },
  { category: 'Linux', snippet: 'docker compose up --build' },
  { category: 'Linux', snippet: 'ls -la && find . -maxdepth 2 -type f | head' },
  { category: 'Git', snippet: 'git checkout -b feature/update' },
  { category: 'Git', snippet: 'git commit -m "Refine typing experience"' },
  { category: 'Docker', snippet: 'docker build -t typeforge:latest .' },
  { category: 'Docker', snippet: 'docker run -p 3000:3000 typeforge:latest' }
];
