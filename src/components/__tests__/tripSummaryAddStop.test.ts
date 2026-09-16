import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import { ComponentInstance, ScreenDefinition, TripStop } from '../../types';

describe('Trip Summary → Add Stop Navigation & Dynamic Binding Suite', () => {
  beforeEach(() => {
    // Reset state before each test
    const store = useMockpitStore.getState();
    store.clearNavDestinationAction();
    store.cancelTripGuidance();
  });

  it('1. findScreenForComponentType locates navDestination by component type regardless of screen name', () => {
    const store = useMockpitStore.getState();

    // Setup custom screens where navDestination is on a custom-named screen "My Route Planner"
    const customScreens: ScreenDefinition[] = [
      { id: 'dash-main', name: 'Dashboard', order: 0, transitionStyle: 'fade', parentId: null },
      { id: 'screen-route-custom', name: 'My Route Planner', order: 1, transitionStyle: 'fade', parentId: null },
      { id: 'settings-screen', name: 'System Settings', order: 2, transitionStyle: 'fade', parentId: null },
    ];

    const customComponentsByScreen: Record<string, ComponentInstance[]> = {
      'dash-main': [
        { id: 'c1', type: 'navTripSummary', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
        { id: 'c2', type: 'speed', x: 4, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
      ],
      'screen-route-custom': [
        { id: 'c3', type: 'navDestination', x: 0, y: 0, width: 6, height: 6, staticProps: {}, bindings: [] },
      ],
      'settings-screen': [
        { id: 'c4', type: 'battery', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
      ],
    };

    useMockpitStore.setState({
      screens: customScreens,
      componentsByScreen: customComponentsByScreen,
      activeView: 'dash-main',
    });

    // Verify findScreenForComponentType finds 'screen-route-custom'
    const targetScreen = useMockpitStore.getState().findScreenForComponentType('navDestination');
    assert.equal(targetScreen, 'screen-route-custom');
    assert.notEqual(targetScreen, 'navigation');
  });

  it('2. Active screen precedence: prefers current screen if Trip Planner is already on it', () => {
    // Setup both screen A and screen B containing navDestination
    const customScreens: ScreenDefinition[] = [
      { id: 'screen-a', name: 'Screen Alpha', order: 0, transitionStyle: 'fade', parentId: null },
      { id: 'screen-b', name: 'Screen Beta', order: 1, transitionStyle: 'fade', parentId: null },
    ];

    const customComponentsByScreen: Record<string, ComponentInstance[]> = {
      'screen-a': [
        { id: 'c1', type: 'navTripSummary', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
        { id: 'c2', type: 'navDestination', x: 4, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
      ],
      'screen-b': [
        { id: 'c3', type: 'navDestination', x: 0, y: 0, width: 6, height: 6, staticProps: {}, bindings: [] },
      ],
    };

    useMockpitStore.setState({
      screens: customScreens,
      componentsByScreen: customComponentsByScreen,
      activeView: 'screen-a',
    });

    // Helper logic matching TripSummaryWidget's findTripPlannerScreenId
    const findTripPlannerScreen = (activeView: string) => {
      const state = useMockpitStore.getState();
      const currentComps = state.componentsByScreen[activeView] || [];
      if (currentComps.some((c) => c.type === 'navDestination')) {
        return activeView;
      }
      for (const s of state.screens) {
        const screenComps = state.componentsByScreen[s.id] || [];
        if (screenComps.some((c) => c.type === 'navDestination')) {
          return s.id;
        }
      }
      return state.findScreenForComponentType('navDestination');
    };

    const target = findTripPlannerScreen('screen-a');
    assert.equal(target, 'screen-a', 'Should stay on active screen screen-a');
  });

  it('3. Navigates to the correct screen when Trip Planner is on a different screen', () => {
    const customScreens: ScreenDefinition[] = [
      { id: 'screen-summary', name: 'Overview', order: 0, transitionStyle: 'fade', parentId: null },
      { id: 'screen-planner', name: 'Waypoints', order: 1, transitionStyle: 'fade', parentId: null },
    ];

    const customComponentsByScreen: Record<string, ComponentInstance[]> = {
      'screen-summary': [
        { id: 'c1', type: 'navTripSummary', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] },
      ],
      'screen-planner': [
        { id: 'c2', type: 'navDestination', x: 0, y: 0, width: 6, height: 6, staticProps: {}, bindings: [] },
      ],
    };

    useMockpitStore.setState({
      screens: customScreens,
      componentsByScreen: customComponentsByScreen,
      activeView: 'screen-summary',
    });

    const targetScreen = useMockpitStore.getState().findScreenForComponentType('navDestination');
    assert.equal(targetScreen, 'screen-planner');

    // Simulate navigation
    if (targetScreen) {
      useMockpitStore.getState().setActiveView(targetScreen);
    }
    assert.equal(useMockpitStore.getState().activeView, 'screen-planner');
  });

  it('4. Fails gracefully when no Trip Planner component exists on any screen', () => {
    const customScreens: ScreenDefinition[] = [
      { id: 'screen-1', name: 'Screen 1', order: 0, transitionStyle: 'fade', parentId: null },
      { id: 'screen-2', name: 'Screen 2', order: 1, transitionStyle: 'fade', parentId: null },
    ];

    const customComponentsByScreen: Record<string, ComponentInstance[]> = {
      'screen-1': [{ id: 'c1', type: 'speed', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] }],
      'screen-2': [{ id: 'c2', type: 'media', x: 0, y: 0, width: 4, height: 4, staticProps: {}, bindings: [] }],
    };

    useMockpitStore.setState({
      screens: customScreens,
      componentsByScreen: customComponentsByScreen,
      activeView: 'screen-1',
    });

    const targetScreen = useMockpitStore.getState().findScreenForComponentType('navDestination');
    assert.equal(targetScreen, null);

    // No navigation should occur, and activeView remains unchanged
    assert.equal(useMockpitStore.getState().activeView, 'screen-1');
  });

  it('5. Store pendingNavDestinationAction records action and clears correctly', () => {
    const store = useMockpitStore.getState();
    assert.equal(store.pendingNavDestinationAction, null);

    store.triggerNavDestinationAction('addStop');
    const pending = useMockpitStore.getState().pendingNavDestinationAction;
    assert.ok(pending);
    assert.equal(pending?.type, 'addStop');
    assert.ok(typeof pending?.id === 'number');

    store.clearNavDestinationAction();
    assert.equal(useMockpitStore.getState().pendingNavDestinationAction, null);
  });

  it('6. Adding stop to active trip guidance updates trip stop count and preserves data', () => {
    const store = useMockpitStore.getState();
    const initialStops: TripStop[] = [
      { id: 'stop-1', name: 'Charging Hub A', lat: '37.7749', lng: '-122.4194' },
    ];

    store.startTripGuidance({
      destinationName: 'Yosemite National Park',
      destLat: 37.8651,
      destLng: -119.5383,
      stops: initialStops,
    });

    const activeTrip = useMockpitStore.getState().activeTrip;
    assert.ok(activeTrip);
    assert.equal(activeTrip?.stops.length, 1);

    // Add another stop
    const newStop: TripStop = {
      id: `stop-${Date.now()}`,
      name: `Stop ${activeTrip.stops.length + 1}`,
      lat: '37.5000',
      lng: '-120.0000',
    };

    store.startTripGuidance({
      ...activeTrip,
      stops: [...activeTrip.stops, newStop],
    });

    const updatedTrip = useMockpitStore.getState().activeTrip;
    assert.equal(updatedTrip?.stops.length, 2);
    assert.equal(updatedTrip?.stops[1].name, 'Stop 2');
    assert.equal(updatedTrip?.destinationName, 'Yosemite National Park');
  });
});
