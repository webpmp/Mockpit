import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationStackPositionClasses } from '../../utils/notificationPosition';
import { useMockpitStore } from '../../store/useMockpitStore';
import { NotificationStackPosition } from '../../types';

describe('Editor Notification Ghost and Library-Driven Selection — Spec v1 & v1.1 Suite', () => {
  let storageMap: Map<string, string>;
  const origLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    storageMap = new Map();
    globalThis.localStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => {
        storageMap.set(key, String(val));
      },
      removeItem: (key: string) => {
        storageMap.delete(key);
      },
      clear: () => {
        storageMap.clear();
      },
      length: 0,
      key: () => null,
    } as any;

    useMockpitStore.setState({
      notificationLibraryExpandRequest: 0,
      notificationGhostActive: false,
      selectedComponentId: null,
      notificationStackPosition: 'top-center',
    });
  });

  afterEach(() => {
    globalThis.localStorage = origLocalStorage;
  });

  describe('1. Shared Position Source', () => {
    it('returns top-center position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('top-center');
      assert.equal(classes, 'top-12 left-1/2 -translate-x-1/2 flex-col items-center');
    });

    it('returns top-right position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('top-right');
      assert.equal(classes, 'top-12 right-8 flex-col items-end');
    });

    it('returns bottom-center position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('bottom-center');
      assert.equal(classes, 'bottom-[96px] left-1/2 -translate-x-1/2 flex-col-reverse items-center');
    });

    it('falls back to top-center for unknown/unsupported positions', () => {
      const classes = getNotificationStackPositionClasses('unknown' as unknown as NotificationStackPosition);
      assert.equal(classes, 'top-12 left-1/2 -translate-x-1/2 flex-col items-center');
    });
  });

  describe('2. Ghost-to-Library Wiring Signal', () => {
    it('initializes notificationLibraryExpandRequest to 0', () => {
      assert.equal(useMockpitStore.getState().notificationLibraryExpandRequest, 0);
    });

    it('increments notificationLibraryExpandRequest when requestExpandNotificationsLibrary is called', () => {
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationLibraryExpandRequest, 1);

      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationLibraryExpandRequest, 2);
    });
  });

  describe('3. Spec v1.1: Active (Selected-Looking) State & Reset Rules', () => {
    it('initializes notificationGhostActive to false', () => {
      assert.equal(useMockpitStore.getState().notificationGhostActive, false);
    });

    it('requestExpandNotificationsLibrary sets notificationGhostActive to true', () => {
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);
    });

    it('clicking the ghost again while active leaves it active (no toggle)', () => {
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);

      // Call again
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);
    });

    it('selectComponent(null) clears notificationGhostActive to false', () => {
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);

      useMockpitStore.getState().selectComponent(null);
      assert.equal(useMockpitStore.getState().notificationGhostActive, false);
    });

    it('selecting any component clears notificationGhostActive to false', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);

      useMockpitStore.getState().selectComponent(id);
      assert.equal(useMockpitStore.getState().notificationGhostActive, false);

      // Clean up
      useMockpitStore.getState().deleteComponent(id);
    });

    it('addComponent clears notificationGhostActive to false', () => {
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);

      const id = useMockpitStore.getState().addComponent('speed');
      assert.equal(useMockpitStore.getState().notificationGhostActive, false);

      // Clean up
      useMockpitStore.getState().deleteComponent(id);
    });
  });

  describe('4. Default Warning Notification Dimensions', () => {
    it('warning notification default width is 380 and height is 120 matching ghost slot', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      const comp = useMockpitStore.getState().notificationComponents.find((c) => c.id === id);
      assert.ok(comp, 'Notification component should be added to notificationComponents');
      assert.equal(comp?.width, 380);
      assert.equal(comp?.height, 120);

      // Clean up
      useMockpitStore.getState().deleteComponent(id);
    });
  });

  describe('5. Component Resizing for Notification Components', () => {
    it('updateComponentSize correctly resizes notification components', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().updateComponentSize(id, 420, 150);

      const updated = useMockpitStore.getState().notificationComponents.find((c) => c.id === id);
      assert.equal(updated?.width, 420);
      assert.equal(updated?.height, 150);

      // Clean up
      useMockpitStore.getState().deleteComponent(id);
    });
  });

  describe('6. Selection and Deletion for Notification Components', () => {
    it('selectComponent selects and clears notification component ID correctly', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().selectComponent(id);
      assert.equal(useMockpitStore.getState().selectedComponentId, id);

      useMockpitStore.getState().selectComponent(null);
      assert.equal(useMockpitStore.getState().selectedComponentId, null);

      // Clean up
      useMockpitStore.getState().deleteComponent(id);
    });

    it('deleteComponent removes notification and resets selection if selected', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().selectComponent(id);
      assert.equal(useMockpitStore.getState().selectedComponentId, id);

      useMockpitStore.getState().deleteComponent(id);
      assert.equal(useMockpitStore.getState().selectedComponentId, null);
      assert.equal(
        useMockpitStore.getState().notificationComponents.some((c) => c.id === id),
        false
      );
    });
  });
});
