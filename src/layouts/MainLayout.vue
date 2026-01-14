<template>
  <q-layout view="hHh lpR fff">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="/icons/ginwalkers.png" />
          </q-avatar>
          The Ginwalkers
        </q-toolbar-title>
      </q-toolbar>

      <q-tabs align="left">
        <q-route-tab to="/" label="Overview" />
        <q-route-tab to="/war" label="Territory War" />
        <q-route-tab to="/battle" label="Territory Battle" />
        <q-route-tab to="/counter" label="Counter" />
        <q-route-tab to="/strategy" label="Strategy" />
      </q-tabs>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style>
html {
  background-color: black;
}
</style>
