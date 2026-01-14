<template>
  <q-layout view="hHh lpR fff" class="bg-dark-page">
    <q-header elevated class="header-custom text-white" height-hint="98">
      <q-toolbar class="toolbar-custom">
        <q-toolbar-title class="row items-center no-wrap">
          <q-avatar size="48px" class="q-mr-md logo-avatar">
            <img src="/icons/ginwalkers.png" />
          </q-avatar>
          <span class="text-h5 text-weight-bold tracking-wide">The Ginwalkers</span>
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left" class="tabs-custom" indicator-color="accent" active-color="accent">
        <q-route-tab to="/" label="Overview" icon="dashboard" />
        <q-route-tab to="/war" label="Territory War" icon="military_tech" />
        <q-route-tab to="/battle" label="Territory Battle" icon="public" />
        <q-route-tab to="/counter" label="Counter" icon="verified_user" />
        <q-route-tab to="/strategy" label="Strategy" icon="psychology" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style lang="scss">
/* Global Background */
.bg-dark-page {
  background-color: #0b0b0f; /* Very dark, almost black */
  background-image:
    radial-gradient(circle at 50% 0%, #1a1a2e 0%, transparent 70%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.95));
  color: #e0e0e0;
  font-family: 'Roboto', sans-serif; /* Clean, modern font */
}

/* Header Styling */
.header-custom {
  background: rgba(20, 20, 25, 0.95); /* Semi-transparent dark background */
  backdrop-filter: blur(10px); /* Glassmorphism effect */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1); /* Subtle border */
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
}

.toolbar-custom {
  padding: 0 24px;
  min-height: 70px;
}

.logo-avatar {
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s ease;
}

.logo-avatar:hover {
  transform: scale(1.05);
  border-color: var(--q-accent); /* Use Quasar accent color on hover */
}

.tracking-wide {
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: 'Star Jedi', sans-serif; /* Or a similar Star Wars-esque font if available */
}

/* Tabs Styling */
.tabs-custom {
  background: transparent;
  font-weight: 500;
}

.q-tab {
  min-height: 50px;
  transition:
    background-color 0.3s,
    color 0.3s;
  border-radius: 8px 8px 0 0; /* Rounded top corners */
  margin: 0 4px;
}

.q-tab:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.q-tab--active {
  background: linear-gradient(to top, rgba(var(--q-accent-rgb), 0.1), transparent);
  text-shadow: 0 0 10px var(--q-accent);
}

/* Optional: Scrollbar Styling for the whole page */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #0b0b0f;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
