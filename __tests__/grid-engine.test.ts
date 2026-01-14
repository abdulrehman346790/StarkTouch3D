// ============================================
// Grid Math Engine Tests (TDD)
// ============================================

import {
    snapToGrid,
    snapPositionToGrid,
    clamp,
    positionKey,
    generateBlockId,
} from '../src/logic/gridMath';

describe('Grid Math Engine', () => {
    describe('snapToGrid', () => {
        it('should snap 0.4 to 0 with grid size 1', () => {
            expect(snapToGrid(0.4, 1)).toBe(0);
        });

        it('should snap 0.6 to 1 with grid size 1', () => {
            expect(snapToGrid(0.6, 1)).toBe(1);
        });

        it('should snap 0.5 to 1 (rounds up)', () => {
            expect(snapToGrid(0.5, 1)).toBe(1);
        });

        it('should snap negative values correctly', () => {
            expect(snapToGrid(-0.4, 1)).toBe(-0); // -0 and 0 are equal in JS
            expect(snapToGrid(-0.6, 1)).toBe(-1);
        });

        it('should handle grid size of 0.5', () => {
            expect(snapToGrid(0.3, 0.5)).toBe(0.5);
            expect(snapToGrid(0.1, 0.5)).toBe(0);
            expect(snapToGrid(0.74, 0.5)).toBe(0.5);
            expect(snapToGrid(0.76, 0.5)).toBe(1);
        });

        it('should handle grid size of 2', () => {
            expect(snapToGrid(2.9, 2)).toBe(2);
            expect(snapToGrid(3.1, 2)).toBe(4);
        });

        it('should use default grid size of 1', () => {
            expect(snapToGrid(2.3)).toBe(2);
            expect(snapToGrid(2.7)).toBe(3);
        });
    });

    describe('snapPositionToGrid', () => {
        it('should snap all three coordinates', () => {
            const result = snapPositionToGrid(1.3, 2.7, -0.4, 1);
            expect(result).toEqual({ x: 1, y: 3, z: -0 }); // -0 and 0 are equal in JS
        });

        it('should handle custom grid sizes', () => {
            const result = snapPositionToGrid(0.3, 0.8, 1.5, 0.5);
            expect(result).toEqual({ x: 0.5, y: 1, z: 1.5 });
        });
    });

    describe('clamp', () => {
        it('should clamp value below min', () => {
            expect(clamp(-5, 0, 10)).toBe(0);
        });

        it('should clamp value above max', () => {
            expect(clamp(15, 0, 10)).toBe(10);
        });

        it('should not change value within range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
        });

        it('should handle equal min and max', () => {
            expect(clamp(5, 5, 5)).toBe(5);
        });
    });

    describe('positionKey', () => {
        it('should generate consistent key for position', () => {
            expect(positionKey(1, 2, 3)).toBe('1,2,3');
        });

        it('should handle negative coordinates', () => {
            expect(positionKey(-1, -2, -3)).toBe('-1,-2,-3');
        });

        it('should handle zero', () => {
            expect(positionKey(0, 0, 0)).toBe('0,0,0');
        });
    });

    describe('generateBlockId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateBlockId();
            const id2 = generateBlockId();
            expect(id1).not.toBe(id2);
        });

        it('should start with "block_"', () => {
            const id = generateBlockId();
            expect(id.startsWith('block_')).toBe(true);
        });
    });
});
