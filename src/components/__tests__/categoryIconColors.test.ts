import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_META, getComponentColor } from '../../config/componentMeta';
import {
  CATEGORY_ICON_HEX,
  COMPONENT_TYPE_TO_CATEGORY,
  resolveLayerIconColor,
} from '../../config/categoryColors';
import { ComponentType } from '../../types';

describe('Layer Icon Colors Match Component Library Category Colors', () => {
  const phoneTypes: ComponentType[] = [
    'phone',
    'phoneContacts',
    'phoneDialPad',
    'phoneMessaging',
  ];

  const climateTypes: ComponentType[] = [
    'climateVent',
    'climateTemp',
    'climateSeats',
  ];

  const navigationTypes: ComponentType[] = [
    'map',
    'navHome',
    'navFavorites',
    'navDestination',
    'navSearch',
    'navTripEstimate',
    'navTripSummary',
    'overheadVisualization',
    'miniNav',
  ];

  const vehicleTypes: ComponentType[] = [
    'vehicleExplodedView',
    'vehicleStatusCallout',
    'sendToServiceCenter',
    'tirePressure',
  ];

  const mediaTypes: ComponentType[] = [
    'media',
    'nowPlaying',
    'mediaPlaylists',
    'mediaDiscovery',
    'mediaSearch',
  ];

  const homeTypes: ComponentType[] = [
    'battery',
    'gear',
    'speed',
    'driveMode',
  ];

  it('1. CATEGORY_ICON_HEX defines accurate hex colors matching the component library', () => {
    assert.equal(CATEGORY_ICON_HEX.phone, '#2dd4bf', 'Phone should match text-teal-400 (#2dd4bf)');
    assert.equal(CATEGORY_ICON_HEX.climate, '#fb923c', 'Climate should match text-orange-400 (#fb923c)');
    assert.equal(CATEGORY_ICON_HEX.navigation, '#34d399', 'Navigation should match text-emerald-400 (#34d399)');
    assert.equal(CATEGORY_ICON_HEX.vehicle, '#818cf8', 'Vehicle should match text-indigo-400 (#818cf8)');
    assert.equal(CATEGORY_ICON_HEX.weather, '#38bdf8', 'Weather should match sky-400 (#38bdf8)');
    assert.equal(CATEGORY_ICON_HEX.media, '#ec4899', 'Media should match #ec4899');
    assert.equal(CATEGORY_ICON_HEX.home, '#38bdf8', 'Home/Dashboard should match text-sky-400 (#38bdf8)');
  });

  it('2. COMPONENT_META defaultColor matches category colors for all screens/categories', () => {
    // Phone
    for (const type of phoneTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#2dd4bf',
        `Phone widget ${type} defaultColor must be #2dd4bf`
      );
      assert.equal(
        getComponentColor(type),
        '#2dd4bf',
        `getComponentColor('${type}') without props must return #2dd4bf`
      );
    }

    // Climate
    for (const type of climateTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#fb923c',
        `Climate widget ${type} defaultColor must be #fb923c`
      );
      assert.equal(
        getComponentColor(type),
        '#fb923c',
        `getComponentColor('${type}') without props must return #fb923c`
      );
    }
    assert.equal(COMPONENT_META.climate.defaultColor, '#fb923c');

    // Navigation
    for (const type of navigationTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#34d399',
        `Navigation widget ${type} defaultColor must be #34d399`
      );
      assert.equal(
        getComponentColor(type),
        '#34d399',
        `getComponentColor('${type}') without props must return #34d399`
      );
    }

    // Vehicle
    for (const type of vehicleTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#818cf8',
        `Vehicle widget ${type} defaultColor must be #818cf8`
      );
      assert.equal(
        getComponentColor(type),
        '#818cf8',
        `getComponentColor('${type}') without props must return #818cf8`
      );
    }

    // Media
    for (const type of mediaTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#ec4899',
        `Media widget ${type} defaultColor must be #ec4899`
      );
    }

    // Home
    for (const type of homeTypes) {
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#38bdf8',
        `Home widget ${type} defaultColor must be #38bdf8`
      );
    }
  });

  it('3. COMPONENT_TYPE_TO_CATEGORY accurately maps widgets to their component library category', () => {
    for (const type of phoneTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'phone');
    }
    for (const type of climateTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'climate');
    }
    for (const type of navigationTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'navigation');
    }
    for (const type of vehicleTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'vehicle');
    }
    for (const type of mediaTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'media');
    }
    for (const type of homeTypes) {
      assert.equal(COMPONENT_TYPE_TO_CATEGORY[type], 'home');
    }
  });

  it('4. resolveLayerIconColor resolves Phone layer icons to #2dd4bf', () => {
    for (const type of phoneTypes) {
      assert.equal(resolveLayerIconColor({ type }, 'phone'), '#2dd4bf');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#38bdf8' } }), '#2dd4bf');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#ffffff' } }), '#2dd4bf');
    }
  });

  it('5. resolveLayerIconColor resolves Climate layer icons to #fb923c', () => {
    for (const type of climateTypes) {
      assert.equal(resolveLayerIconColor({ type }, 'climate'), '#fb923c');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#38bdf8' } }), '#fb923c');
    }
    // climate component type on climate screen
    assert.equal(resolveLayerIconColor({ type: 'climate' }, 'climate'), '#fb923c');
  });

  it('6. resolveLayerIconColor resolves Navigation layer icons to #34d399', () => {
    for (const type of navigationTypes) {
      assert.equal(resolveLayerIconColor({ type }, 'navigation'), '#34d399');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#38bdf8' } }), '#34d399');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#f59e0b' } }), '#34d399');
    }
  });

  it('7. resolveLayerIconColor resolves Vehicle layer icons to #818cf8', () => {
    for (const type of vehicleTypes) {
      assert.equal(resolveLayerIconColor({ type }, 'vehicle'), '#818cf8');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#38bdf8' } }), '#818cf8');
      assert.equal(resolveLayerIconColor({ type, staticProps: { color: '#eab308' } }), '#818cf8');
    }
  });

  it('8. resolveLayerIconColor resolves Weather screen layer icons to #38bdf8', () => {
    assert.equal(
      resolveLayerIconColor({ type: 'speed' }, 'weather'),
      '#38bdf8'
    );
  });

  it('9. Gear widget honors home blue (#38bdf8) and custom colors', () => {
    assert.equal(resolveLayerIconColor({ type: 'gear' }), '#38bdf8');
    assert.equal(resolveLayerIconColor({ type: 'gear', staticProps: { color: '#f8fafc' } }), '#38bdf8');
    assert.equal(resolveLayerIconColor({ type: 'gear', staticProps: { color: '#22c55e' } }), '#22c55e');
  });
});
