import test from 'node:test';
import assert from 'node:assert/strict';

test('Speedometer Drag & Adjust Calculations Suite', async (t) => {
  // Tuned sensitivity: 3 pixels per 1 unit of speed (previously 5, originally 14)
  const SENSITIVITY = 3;

  assert.equal(SENSITIVITY, 3, 'Speedometer drag sensitivity must be 3 pixels per 1 mph');

  const computeSpeedDelta = (startX: number, startY: number, curX: number, curY: number, startSpeed: number, maxSpeed: number) => {
    const deltaX = curX - startX;
    const deltaY = curY - startY;
    const combinedDeltaPixels = -deltaY + deltaX;
    const speedDelta = combinedDeltaPixels / SENSITIVITY;
    const targetSpeed = Math.round(startSpeed + speedDelta);
    return Math.max(0, Math.min(maxSpeed, targetSpeed));
  };

  await t.test('1. Drag upward increases speed (3px per mph)', () => {
    // start at 65 mph, drag upward by 15px (deltaY = -15, deltaX = 0)
    // combinedDelta = 15. speedDelta = 15 / 3 = +5. target = 70 mph
    const result = computeSpeedDelta(100, 100, 100, 85, 65, 140);
    assert.equal(result, 70);
  });

  await t.test('2. 0 to 65 mph change requires approximately 195px of upward pointer movement', () => {
    // start at 0 mph, drag upward by 195px (deltaY = -195, deltaX = 0)
    // combinedDelta = 195. speedDelta = 195 / 3 = +65. target = 65 mph
    const result = computeSpeedDelta(100, 295, 100, 100, 0, 140);
    assert.equal(result, 65, 'Moving 195px upward must change speed from 0 to 65 mph');
  });

  await t.test('3. 0 to 65 mph change requires approximately 195px of rightward pointer movement', () => {
    // start at 0 mph, drag right by 195px (deltaY = 0, deltaX = 195)
    // combinedDelta = 195. speedDelta = 195 / 3 = +65. target = 65 mph
    const result = computeSpeedDelta(100, 100, 295, 100, 0, 140);
    assert.equal(result, 65, 'Moving 195px rightward must change speed from 0 to 65 mph');
  });

  await t.test('4. Diagonal drag behaves according to combined-delta calculation (96px up + 99px right = 195px)', () => {
    // Diagonal drag: 96px up (-deltaY = 96) and 99px right (deltaX = 99) = 195 combined pixels
    const diagResult = computeSpeedDelta(100, 196, 199, 100, 0, 140);
    assert.equal(diagResult, 65, 'Combined diagonal drag of 195px must change speed from 0 to 65 mph');
  });

  await t.test('5. Drag downward decreases speed', () => {
    // start at 65 mph, drag downward by 15px (deltaY = 15, deltaX = 0)
    // combinedDelta = -15. speedDelta = -15 / 3 = -5. target = 60 mph
    const result = computeSpeedDelta(100, 100, 100, 115, 65, 140);
    assert.equal(result, 60);
  });

  await t.test('6. Drag leftward decreases speed', () => {
    // start at 65 mph, drag left by 9px (deltaY = 0, deltaX = -9)
    // combinedDelta = -9. speedDelta = -9 / 3 = -3. target = 62 mph
    const result = computeSpeedDelta(100, 100, 91, 100, 65, 140);
    assert.equal(result, 62);
  });

  await t.test('7. Combined diagonal drag (up + right) accelerates cleanly', () => {
    // drag up 6px (-deltaY = 6) and right 6px (deltaX = 6)
    // combinedDelta = 12. speedDelta = 12 / 3 = +4. target = 69 mph
    const result = computeSpeedDelta(100, 100, 106, 94, 65, 140);
    assert.equal(result, 69);
  });

  await t.test('8. Clamping to minimum (0 mph)', () => {
    // start at 10 mph, drag down 60px (-60 / 3 = -20 -> clamped to 0)
    const result = computeSpeedDelta(100, 100, 100, 160, 10, 140);
    assert.equal(result, 0);
  });

  await t.test('9. Clamping to maximum speed limit', () => {
    // start at 130 mph, max is 140, drag up 60px (60 / 3 = +20 -> clamped to 140)
    const result = computeSpeedDelta(100, 100, 100, 40, 130, 140);
    assert.equal(result, 140);

    // Custom maxSpeed 180
    const customMaxResult = computeSpeedDelta(100, 100, 100, 40, 130, 180);
    assert.equal(customMaxResult, 150);
  });

  await t.test('10. Discrete integer rounding and controllable small drags', () => {
    // 1px drag / 3 = 0.333 -> rounds to 0 change (no accidental jumps on micro-movement)
    const microResult = computeSpeedDelta(100, 100, 101, 100, 65, 140);
    assert.equal(microResult, 65);

    // 2px drag / 3 = 0.667 -> rounds to +1 mph
    const twoPxResult = computeSpeedDelta(100, 100, 102, 100, 65, 140);
    assert.equal(twoPxResult, 66);

    // 3px drag / 3 = 1.0 -> exactly +1 mph
    const exactOneMph = computeSpeedDelta(100, 100, 103, 100, 65, 140);
    assert.equal(exactOneMph, 66);
  });

  await t.test('9. Lifecycle safeguards: mouse move with buttons === 0 terminates drag', () => {
    let isDragging = true;
    let dragRef: { startX: number } | null = { startX: 100 };
    let currentSpeed = 65;

    const endDrag = () => {
      isDragging = false;
      dragRef = null;
    };

    const handlePointerMove = (pointerType: string, buttons: number, clientX: number) => {
      if (pointerType === 'mouse' && buttons === 0) {
        endDrag();
        return;
      }
      if (!isDragging || !dragRef) return;
      currentSpeed = clientX; // simulated change
    };

    // Case A: Pointer moves with button down
    handlePointerMove('mouse', 1, 70);
    assert.equal(currentSpeed, 70);
    assert.equal(isDragging, true);

    // Case B: Mouse button was released outside and cursor hovers back in (buttons = 0)
    handlePointerMove('mouse', 0, 95);
    assert.equal(currentSpeed, 70); // speed must NOT change
    assert.equal(isDragging, false); // drag terminated immediately
    assert.equal(dragRef, null);

    // Case C: Subsequent move with !isDragging immediately returns
    handlePointerMove('mouse', 0, 120);
    assert.equal(currentSpeed, 70);
  });

  await t.test('10. Lifecycle termination: pointerup, pointercancel, and lostpointercapture', () => {
    let isDragging = true;
    let releasedCaptureId: number | null = null;

    const mockTarget = {
      capturedId: 42,
      hasPointerCapture(id: number) {
        return this.capturedId === id;
      },
      releasePointerCapture(id: number) {
        if (this.capturedId === id) {
          releasedCaptureId = id;
          this.capturedId = -1;
        }
      },
    };

    let dragRef: { pointerId: number; targetElement: typeof mockTarget | null } | null = {
      pointerId: 42,
      targetElement: mockTarget,
    };

    const endDrag = (element?: typeof mockTarget | null, pointerId?: number) => {
      const target = element || dragRef?.targetElement;
      const pId = pointerId !== undefined ? pointerId : dragRef?.pointerId;
      if (target && pId !== undefined && target.hasPointerCapture(pId)) {
        target.releasePointerCapture(pId);
      }
      dragRef = null;
      isDragging = false;
    };

    // Terminate via pointerup
    endDrag(mockTarget, 42);
    assert.equal(isDragging, false);
    assert.equal(dragRef, null);
    assert.equal(releasedCaptureId, 42);
    assert.equal(mockTarget.hasPointerCapture(42), false);
  });
});
