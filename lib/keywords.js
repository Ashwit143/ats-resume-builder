/**
 * keywords.js — Role keyword database (CommonJS)
 * 30-40 keywords per role, used for ATS keyword matching.
 */

const ROLE_KEYWORDS = {
  'frontend-developer': {
    label: 'Frontend Developer',
    keywords: [
      'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular',
      'next.js', 'nuxt', 'svelte', 'tailwind', 'sass', 'scss', 'bootstrap',
      'webpack', 'vite', 'babel', 'eslint', 'npm', 'yarn', 'jest', 'cypress',
      'responsive design', 'accessibility', 'web performance', 'seo', 'pwa',
      'rest api', 'graphql', 'git', 'github', 'ci/cd', 'figma', 'redux',
      'css grid', 'flexbox', 'cross-browser', 'storybook', 'agile'
    ],
    actionVerbs: [
      'built', 'developed', 'designed', 'implemented', 'optimized',
      'improved', 'created', 'migrated', 'refactored', 'launched',
      'integrated', 'deployed', 'maintained', 'enhanced', 'delivered'
    ]
  },

  'backend-developer': {
    label: 'Backend Developer',
    keywords: [
      'node.js', 'python', 'java', 'go', 'ruby', 'php', 'c#', 'rust',
      'express', 'fastapi', 'django', 'flask', 'spring', 'nest.js',
      'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
      'rest api', 'graphql', 'grpc', 'oauth', 'jwt', 'docker', 'kubernetes',
      'aws', 'gcp', 'azure', 'microservices', 'serverless', 'kafka',
      'system design', 'scalability', 'caching', 'ci/cd', 'git',
      'tdd', 'unit testing', 'authentication', 'authorization', 'linux'
    ],
    actionVerbs: [
      'architected', 'built', 'designed', 'implemented', 'optimized',
      'deployed', 'scaled', 'automated', 'integrated', 'developed',
      'maintained', 'migrated', 'reduced', 'improved', 'secured'
    ]
  },

  'full-stack-developer': {
    label: 'Full Stack Developer',
    keywords: [
      'html', 'css', 'javascript', 'typescript', 'react', 'vue', 'angular',
      'next.js', 'tailwind', 'node.js', 'python', 'express', 'rest api',
      'graphql', 'sql', 'mongodb', 'postgresql', 'redis', 'docker',
      'aws', 'gcp', 'ci/cd', 'kubernetes', 'authentication', 'jwt',
      'git', 'github', 'agile', 'scrum', 'microservices', 'api design',
      'system design', 'mvc', 'jest', 'cypress', 'vercel', 'linux', 'nginx'
    ],
    actionVerbs: [
      'built', 'developed', 'architected', 'designed', 'implemented',
      'deployed', 'launched', 'integrated', 'optimized', 'delivered',
      'scaled', 'maintained', 'led', 'collaborated', 'created'
    ]
  },

  'software-engineer': {
    label: 'Software Engineer',
    keywords: [
      'data structures', 'algorithms', 'object-oriented programming',
      'design patterns', 'system design', 'distributed systems',
      'python', 'java', 'c++', 'go', 'rust', 'kotlin', 'javascript',
      'typescript', 'tdd', 'unit testing', 'code review', 'agile', 'scrum',
      'ci/cd', 'refactoring', 'solid principles', 'git', 'docker', 'linux',
      'aws', 'microservices', 'rest', 'grpc', 'sql', 'nosql', 'postgresql',
      'mongodb', 'debugging', 'optimization', 'jira', 'mentoring'
    ],
    actionVerbs: [
      'engineered', 'developed', 'designed', 'implemented', 'optimized',
      'debugged', 'refactored', 'architected', 'built', 'led',
      'mentored', 'reviewed', 'automated', 'improved', 'delivered'
    ]
  },

  'data-analyst': {
    label: 'Data Analyst',
    keywords: [
      'python', 'sql', 'excel', 'r', 'pandas', 'numpy', 'matplotlib',
      'seaborn', 'scipy', 'scikit-learn', 'tableau', 'power bi', 'looker',
      'google data studio', 'plotly', 'mysql', 'postgresql', 'bigquery',
      'snowflake', 'redshift', 'spark', 'statistics', 'regression',
      'hypothesis testing', 'a/b testing', 'data cleaning', 'data wrangling',
      'etl', 'machine learning', 'clustering', 'forecasting', 'kpi',
      'reporting', 'data storytelling', 'aws', 'airflow', 'dbt', 'jupyter'
    ],
    actionVerbs: [
      'analyzed', 'visualized', 'built', 'developed', 'identified',
      'automated', 'reduced', 'improved', 'created', 'designed',
      'reported', 'cleaned', 'modeled', 'predicted', 'delivered'
    ]
  }
};

function getRoles() {
  return Object.keys(ROLE_KEYWORDS);
}

function getRoleConfig(role) {
  return ROLE_KEYWORDS[role] || null;
}

module.exports = { ROLE_KEYWORDS, getRoles, getRoleConfig };
