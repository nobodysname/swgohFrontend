const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '/', component: () => import('src/pages/OverviewPage.vue') },
      { path: '/strategy', component: () => import('src/pages/StrategyPage.vue') },
      { path: '/battle', component: () => import('src/pages/BattlePage.vue') },
      {
        path: '/opponent-analysis/:id',
        name: 'opponent-analysis',
        component: () => import('pages/OpponentAnalysisPage.vue'),
      },
      { path: '/war', component: () => import('src/pages/WarPage.vue') },
      { path: '/strategy', component: () => import('src/pages/StrategyPage.vue') },
      { path: '/monitoring', component: () => import('src/pages/MonitoringPage.vue') },
      { path: '/counter', component: () => import('src/pages/CounterPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
