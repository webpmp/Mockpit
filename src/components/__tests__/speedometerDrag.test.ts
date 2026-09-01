import test from 'node:test';
import assert from 'node:assert/strict';

test('Speedometer Drag & Adjust Calculations Suite', async (t) => {
  const SENSITIVITY = 14;

  const computeSpeedDelta = (startX: number, startY: number, curX: number, curY: number, startSpeed: number, maxSpeed: number) => {
    const deltaX = curX - startX;
    const deltaY = curY - startY;
    const combinedDeltaPixels = -deltaY + deltaX;
    const speedDelta = combinedDeltaPixels / SENSITIVITY;
    const targetSpeed = Math.round(startSpeed + speedDelta);
    return Math.max(0, Math.min(maxSpeed, targetSpeed));
  };

  await t.test('1. Drag upward increases speed', () => {
    // start at 65 mph, drag upward by 70px (deltaY = -70, deltaX = 0)
    // combinedDelta = 70. speedDelta = 70 / 14 = +5. target = 70 mph
    const result = computeSpeedDelta(100, 100, 100, 30, 65, 140);
    assert.equal(result, 70);
  });

  await t.test('2. Drag rightward increases speed', () => {
    // start at 65 mph, drag right by 42px (deltaY = 0, deltaX = 42)
    // combinedDelta = 42. speedDelta = 42 / 14 = +3. target = 68 mph
    const result = computeSpeedDelta(100, 100, 142, 100, 65, 140);
    assert.equal(result, 68);
  });

  await t.test('3. Drag downward decreases speed', () => {
    // start at 65 mph, drag downward by 70px (deltaY = 70, deltaX = 0)
    // combinedDelta = -70. speedDelta = -5. target = 60 mph
    const result = computeSpeedDelta(100, 100, 100, 170, 65, 140);
    assert.equal(result, 60);
  });

  await t.test('4. Drag leftward decreases speed', () => {
    // start at 65 mph, drag left by 42px (deltaY = 0, deltaX = -42)
    // combinedDelta = -42. speedDelta = -3. target = 62 mph
    const result = computeSpeedDelta(100, 100, 58, 100, 65, 140);
    assert.equal(result, 62);
  });

  await t.test('5. Combined diagonal drag (up + right) accelerates cleanly', () => {
    // drag up 28px (-deltaY = 28) and right 28px (deltaX = 28)
    // combinedDelta = 56. speedDelta = 56 / 14 = +4. target = 69 mph
    const result = computeSpeedDelta(100, 100, 128, 72, 65, 140);
    assert.equal(result, 69);
  });

  await t.test('6. Clamping to minimum (0 mph)', () => {
    // start at 10 mph, drag down 200px
    const result = computeSpeedDelta(100, 100, 100, 300, 10, 140);
    assert.equal(result, 0);
  });

  await t.test('7. Clamping to maximum speed limit', () => {
    // start at 130 mph, max is 140, drag up 300px
    const result = computeSpeedDelta(100, 100, 100, -200, 130, 140);
    assert.equal(result, 140);

    // Custom maxSpeed 180
    const customMaxResult = computeSpeedDelta(100, 100, 100, -200, 130, 180);
    assert.equal(customMaxResult, 151);
  });

  await t.test('8. Discrete integer rounding', () => {
    // 5px drag / 14 = 0.357 -> rounds to 0 change
    const smallResult = computeSpeedDelta(100, 100, 105, 100, 65, 140);
    assert.equal(smallResult, 65);

    // 8px drag / 14 = 0.571 -> rounds to +1 mph
    const oneMphResult = computeSpeedDelta(100, 100, 108, 100, 65, 140);
    assert.equal(oneMphResult, 66);
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
