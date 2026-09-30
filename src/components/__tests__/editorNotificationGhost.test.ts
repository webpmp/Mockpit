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
    it('returns top-left position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('top-left');
      assert.equal(classes, 'top-12 left-8 flex-col items-start');
    });

    it('returns top-center position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('top-center');
      assert.equal(classes, 'top-12 left-1/2 -translate-x-1/2 flex-col items-center');
    });

    it('returns top-right position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('top-right');
      assert.equal(classes, 'top-12 right-8 flex-col items-end');
    });

    it('returns bottom-left position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('bottom-left');
      assert.equal(classes, 'bottom-[96px] left-8 flex-col-reverse items-start');
    });

    it('returns bottom-center position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('bottom-center');
      assert.equal(classes, 'bottom-[96px] left-1/2 -translate-x-1/2 flex-col-reverse items-center');
    });

    it('returns bottom-right position classes matching Presenter styling', () => {
      const classes = getNotificationStackPositionClasses('bottom-right');
      assert.equal(classes, 'bottom-[96px] right-8 flex-col-reverse items-end');
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

    it('deleteComponent clears notificationGhostActive to false', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().requestExpandNotificationsLibrary();
      assert.equal(useMockpitStore.getState().notificationGhostActive, true);

      useMockpitStore.getState().deleteComponent(id);
      assert.equal(useMockpitStore.getState().notificationGhostActive, false);
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

  describe('7. Active Stack Sorting, Filtering, and Array Reordering', () => {
    it('reorderNotificationComponent moves items up and down in array order', () => {
      const notifs = useMockpitStore.getState().notificationComponents;
      if (notifs.length >= 2) {
        const id0 = notifs[0].id;
        const id1 = notifs[1].id;

        // Move item 1 up -> becomes index 0
        useMockpitStore.getState().reorderNotificationComponent(id1, 'up');
        const reordered = useMockpitStore.getState().notificationComponents;
        assert.equal(reordered[0].id, id1);
        assert.equal(reordered[1].id, id0);

        // Move item 1 down -> returns to index 1
        useMockpitStore.getState().reorderNotificationComponent(id1, 'down');
        const restored = useMockpitStore.getState().notificationComponents;
        assert.equal(restored[0].id, id0);
        assert.equal(restored[1].id, id1);
      }
    });

    it('A-Z sort comparator sorts labels case-insensitively with numeric sensitivity', () => {
      const labels = ['Speed Warning 10', 'battery low', 'Alert 2', 'Alert 10', 'Alert 1'];
      const sorted = [...labels].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );
      assert.deepEqual(sorted, [
        'Alert 1',
        'Alert 2',
        'Alert 10',
        'battery low',
        'Speed Warning 10',
      ]);
    });

    it('filter by label substring is case-insensitive', () => {
      const items = [
        { label: 'LOW TIRE PRESSURE' },
        { label: 'Battery Critical' },
        { label: 'Tire Pressure Warning' },
      ];
      const query = 'tire';
      const filtered = items.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      );
      assert.equal(filtered.length, 2);
      assert.equal(filtered[0].label, 'LOW TIRE PRESSURE');
      assert.equal(filtered[1].label, 'Tire Pressure Warning');
    });
  });

  describe('8. Spec v1.1 Markup & Static Class Invariant Verifications', () => {
    it('Editor slot wrapper does not contain transition classes, while Presenter layer does', async () => {
      const fs = await import('node:fs');
      const canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

      // Presenter notification layer must retain transition-all duration-300 ease-out
      const presenterMatch = canvasCode.match(/data-testid="notification-stack-layer"[\s\S]*?className=\{`([^`]+)`\}/);
      assert.ok(presenterMatch, 'Presenter notification-stack-layer must exist');
      assert.ok(
        presenterMatch[1].includes('transition-all duration-300 ease-out'),
        'Presenter notification layer must keep transition-all duration-300 ease-out'
      );

      // Editor notification slot must NOT have transition-all
      const editorSlotMatch = canvasCode.match(/data-testid="notification-editor-slot"[\s\S]*?className=\{`([^`]+)`\}/);
      assert.ok(editorSlotMatch, 'Editor notification-editor-slot must exist');
      assert.ok(
        !editorSlotMatch[1].includes('transition'),
        'Editor notification slot wrapper must not have transition classes'
      );
    });

    it('Ghost element uses border-slate-500, no alpha suffix on border/text, and no transition', async () => {
      const fs = await import('node:fs');
      const canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

      const ghostMatch = canvasCode.match(/data-testid="notification-ghost"[\s\S]*?className=\{`([^`]+)\$\{([\s\S]*?)\}`\}/);
      assert.ok(ghostMatch, 'notification-ghost must exist');
      const baseClasses = ghostMatch[1];
      const ternaryClasses = ghostMatch[2];

      assert.ok(!baseClasses.includes('transition'), 'Ghost element must not have transition classes');
      assert.ok(ternaryClasses.includes('border-dashed border-slate-500 text-slate-400 opacity-60'));
      assert.ok(ternaryClasses.includes('border-solid text-slate-200 opacity-100'));
    });

    it('Sidebar expanded notifications container has data-keep-selection="true"', async () => {
      const fs = await import('node:fs');
      const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

      assert.ok(
        sidebarCode.includes('<div data-keep-selection="true" className="p-3 space-y-3 bg-slate-950/40 border-t border-slate-800/60">'),
        'Sidebar expanded notifications content must have data-keep-selection="true"'
      );
    });
  });

  describe('9. Spec v2: Notification Library Cleanup Suite', () => {
    it('persists and loads all six notification positions from localStorage', () => {
      const positions: NotificationStackPosition[] = [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ];

      for (const pos of positions) {
        useMockpitStore.getState().setNotificationStackPosition(pos);
        assert.equal(useMockpitStore.getState().notificationStackPosition, pos);
      }
    });

    it('Sidebar position selector defines all six options in exact 2-row grid order', async () => {
      const fs = await import('node:fs');
      const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

      // Check grid container
      assert.ok(
        sidebarCode.includes('grid grid-cols-3 gap-1'),
        'Sidebar position options must be in a 3-column grid'
      );

      // Verify exact options array in DOM order
      const expectedOptions = [
        { id: 'top-left', label: 'Top L', title: 'Top Left' },
        { id: 'top-center', label: 'Top Ctr', title: 'Top Center' },
        { id: 'top-right', label: 'Top R', title: 'Top Right' },
        { id: 'bottom-left', label: 'Btm L', title: 'Bottom Left' },
        { id: 'bottom-center', label: 'Btm Ctr', title: 'Bottom Center' },
        { id: 'bottom-right', label: 'Btm R', title: 'Bottom Right' },
      ];

      for (const opt of expectedOptions) {
        assert.ok(
          sidebarCode.includes(`id: '${opt.id}'`),
          `Sidebar must define option id '${opt.id}'`
        );
        assert.ok(
          sidebarCode.includes(`label: '${opt.label}'`),
          `Sidebar must define label '${opt.label}'`
        );
        assert.ok(
          sidebarCode.includes(`title: '${opt.title}'`),
          `Sidebar must define title '${opt.title}'`
        );
      }

      // Check data attributes
      assert.ok(sidebarCode.includes('data-testid="notification-position-option"'));
      assert.ok(sidebarCode.includes('data-position={pos.id}'));
    });

    it('Inspector contains Global Position label, helper text, and 6 options in order', async () => {
      const fs = await import('node:fs');
      const inspectorCode = fs.readFileSync('src/components/Inspector.tsx', 'utf-8');

      assert.ok(inspectorCode.includes('<span>Global Position:</span>'));
      assert.ok(
        inspectorCode.includes(
          'Applies in Editor and Presenter. Change it in the component library&apos;s Notifications section.'
        ) ||
        inspectorCode.includes(
          "Applies in Editor and Presenter. Change it in the component library's Notifications section."
        )
      );

      assert.ok(inspectorCode.includes('<option value="top-left">Top Left</option>'));
      assert.ok(inspectorCode.includes('<option value="top-center">Top Center</option>'));
      assert.ok(inspectorCode.includes('<option value="top-right">Top Right</option>'));
      assert.ok(inspectorCode.includes('<option value="bottom-left">Bottom Left</option>'));
      assert.ok(inspectorCode.includes('<option value="bottom-center">Bottom Center</option>'));
      assert.ok(inspectorCode.includes('<option value="bottom-right">Bottom Right</option>'));
    });

    it('Sidebar contains Active Notifications label and no user-facing Stack Position or summaryText', async () => {
      const fs = await import('node:fs');
      const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

      assert.ok(sidebarCode.includes('Active Notifications ('));
      assert.ok(!sidebarCode.includes('Active Stack ('));
      assert.ok(!sidebarCode.includes('Global Stack Position'));
      assert.ok(!sidebarCode.includes('summaryText'));
      assert.ok(!sidebarCode.includes('Edit &rarr;'));
      assert.ok(sidebarCode.includes('title={label}'));
    });

    it('Inline delete confirmation exists across Sidebar, Inspector, and Editor slot', async () => {
      const fs = await import('node:fs');
      const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');
      const inspectorCode = fs.readFileSync('src/components/Inspector.tsx', 'utf-8');
      const canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

      assert.ok(
        sidebarCode.includes('data-testid="notification-delete-confirm-bar"'),
        'Sidebar must include notification-delete-confirm-bar'
      );
      assert.ok(
        inspectorCode.includes('data-testid="inspector-notification-delete-confirm"'),
        'Inspector must include inspector-notification-delete-confirm'
      );
      assert.ok(
        canvasCode.includes('data-testid="editor-notification-delete-confirm"'),
        'Canvas must include editor-notification-delete-confirm'
      );
    });
  });

  describe('5. Spec v4: Active and Inactive Notifications', () => {
    it('isNotificationEnabled helper correctly resolves enabled state', async () => {
      const { isNotificationEnabled } = await import('../../types');

      assert.equal(isNotificationEnabled({ staticProps: { enabled: 'true' } } as any), true);
      assert.equal(isNotificationEnabled({ staticProps: { enabled: 'false' } } as any), false);
      assert.equal(isNotificationEnabled({ staticProps: {} } as any), true, 'Unset must default to active');
      assert.equal(isNotificationEnabled({} as any), true, 'Empty component must default to active');
      assert.equal(isNotificationEnabled(null), false, 'Null component returns false');
    });

    it('new notifications are created with enabled: "true"', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      const comp = useMockpitStore.getState().notificationComponents.find((c) => c.id === id);
      assert.ok(comp, 'Component should be in notificationComponents');
      assert.equal(comp?.staticProps?.enabled, 'true');
    });

    it('triggerEventNotification only triggers active notifications', () => {
      const idActive = useMockpitStore.getState().addComponent('warning');
      const idInactive = useMockpitStore.getState().addComponent('warning');

      useMockpitStore.getState().updateComponentStaticProps(idActive, {
        triggerMode: 'event',
        triggerEvent: 'test_event_spec4',
        enabled: 'true',
      });
      useMockpitStore.getState().updateComponentStaticProps(idInactive, {
        triggerMode: 'event',
        triggerEvent: 'test_event_spec4',
        enabled: 'false',
      });

      useMockpitStore.getState().triggerEventNotification('test_event_spec4');
      const activeEventIds = useMockpitStore.getState().activeEventNotifIds;

      assert.ok(activeEventIds.includes(idActive), 'Active notification should be triggered');
      assert.ok(!activeEventIds.includes(idInactive), 'Inactive notification must NEVER be triggered');
    });

    it('disabling a currently active event notification removes it from activeEventNotifIds', () => {
      const id = useMockpitStore.getState().addComponent('warning');
      useMockpitStore.getState().updateComponentStaticProps(id, {
        triggerMode: 'event',
        triggerEvent: 'test_dismiss_event',
        enabled: 'true',
      });
      useMockpitStore.getState().triggerEventNotification('test_dismiss_event');
      assert.ok(useMockpitStore.getState().activeEventNotifIds.includes(id));

      useMockpitStore.getState().updateComponentStaticProps(id, {
        enabled: 'false',
      });
      assert.ok(
        !useMockpitStore.getState().activeEventNotifIds.includes(id),
        'Disabling notification must remove it from activeEventNotifIds'
      );
    });

    it('within-section reordering maintains separation between active and inactive items', () => {
      useMockpitStore.setState({ notificationComponents: [] });
      const a1 = useMockpitStore.getState().addComponent('warning');
      const i1 = useMockpitStore.getState().addComponent('warning');
      const a2 = useMockpitStore.getState().addComponent('warning');

      useMockpitStore.getState().updateComponentStaticProps(a1, { message: 'A1', enabled: 'true' });
      useMockpitStore.getState().updateComponentStaticProps(i1, { message: 'I1', enabled: 'false' });
      useMockpitStore.getState().updateComponentStaticProps(a2, { message: 'A2', enabled: 'true' });

      // In active list, order is [A1, A2]. Move A2 up in active section
      useMockpitStore.getState().reorderNotificationComponent(a2, 'up');

      const notifs = useMockpitStore.getState().notificationComponents;
      const activeOnly = notifs.filter((c) => c.staticProps?.enabled !== 'false');
      assert.equal(activeOnly[0].id, a2, 'A2 should now be first in active section');
      assert.equal(activeOnly[1].id, a1, 'A1 should now be second in active section');
    });

    it('Sidebar source includes Active and Inactive section headers and empty states', async () => {
      const fs = await import('node:fs');
      const sidebarCode = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

      assert.ok(sidebarCode.includes('data-testid="active-notifications-header"'));
      assert.ok(sidebarCode.includes('Active Notifications ({activeNotificationComponents.length})'));
      assert.ok(sidebarCode.includes('data-testid="inactive-notifications-header"'));
      assert.ok(sidebarCode.includes('Inactive Notifications ({inactiveNotificationComponents.length})'));
      assert.ok(sidebarCode.includes('data-testid="active-notifications-empty"'));
      assert.ok(sidebarCode.includes('None'));
      assert.ok(sidebarCode.includes('data-testid="inactive-notifications-empty"'));
      assert.ok(sidebarCode.includes('Deactivate a notification to keep it without triggering it'));
      assert.ok(sidebarCode.includes('data-testid="notification-active-toggle"'));
    });

    it('Canvas honors isNotificationEnabled for activePersistentNotifications', async () => {
      const fs = await import('node:fs');
      const canvasCode = fs.readFileSync('src/components/Canvas.tsx', 'utf-8');

      assert.ok(canvasCode.includes('if (!isNotificationEnabled(comp)) return false;'));
    });

    it('Inspector includes Active Status toggle for selected notification', async () => {
      const fs = await import('node:fs');
      const inspectorCode = fs.readFileSync('src/components/Inspector.tsx', 'utf-8');

      assert.ok(inspectorCode.includes('data-testid="inspector-notification-active-toggle"'));
      assert.ok(inspectorCode.includes('Active Status'));
    });

    it('Adjust Dashboard Background Position & Scale button is moved from HeaderNav to SettingsModal', async () => {
      const fs = await import('node:fs');
      const headerCode = fs.readFileSync('src/components/HeaderNav.tsx', 'utf-8');
      const settingsCode = fs.readFileSync('src/components/SettingsModal.tsx', 'utf-8');

      assert.ok(
        !headerCode.includes('title={isAdjustingBackground ?'),
        'HeaderNav must not contain the Adjust Dashboard Background button'
      );
      assert.ok(
        settingsCode.includes('title="Adjust Dashboard Background Position & Scale"'),
        'SettingsModal must contain Adjust Dashboard Background Position & Scale button'
      );
    });
  });
});

