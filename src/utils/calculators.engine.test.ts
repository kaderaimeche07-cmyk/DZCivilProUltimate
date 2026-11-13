import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateConcreteMix,
  calculateRebarWeight,
  calculateMasonryWall,
  calculateRoadGradient,
  calculateLinearCutFill,
  calculateTrapezoidalSectionArea,
} from './calculators.engine';

test('Concrete 350 kg/m³ mix calculates volume, bags, sand, gravel, and water accurately', () => {
  const res = calculateConcreteMix({
    lengthM: 10,
    widthM: 5,
    thicknessM: 0.2,
    dosageKgPerM3: 350,
    wastePercent: 0,
  });

  assert.equal(res.valid, true);
  assert.equal(res.netVolumeM3, 10);
  assert.equal(res.grossVolumeM3, 10);
  assert.equal(res.cementKg, 3500);
  assert.equal(res.cementBags50kg, 70);
  assert.equal(res.sandM3, 4);
  assert.equal(res.gravelM3, 8);
  assert.equal(res.waterLiters, 1750);
});

test('Concrete calculator rejects zero or negative dimensions', () => {
  const res = calculateConcreteMix({
    lengthM: -2,
    widthM: 5,
    thicknessM: 0.2,
    dosageKgPerM3: 350,
  });
  assert.equal(res.valid, false);
  assert.ok(res.error);
});

test('Rebar T12 weight calculation matches Algerian steel standards', () => {
  const res = calculateRebarWeight({
    diameterMm: 12,
    totalLengthM: 100,
    wastePercent: 0,
  });
  assert.equal(res.valid, true);
  assert.equal(res.unitWeightKgPerM, 0.888);
  assert.equal(res.netWeightKg, 88.8);
  assert.equal(res.grossWeightKg, 88.8);
  assert.equal(res.commercial12mBars, 9);
});

test('Masonry 8-hole brick calculator deducts openings and applies waste', () => {
  const res = calculateMasonryWall({
    wallLengthM: 5,
    wallHeightM: 3,
    openingsAreaM2: 3,
    unitType: 'brick_8',
    wastePercent: 5,
  });
  assert.equal(res.valid, true);
  assert.equal(res.grossAreaM2, 15);
  assert.equal(res.netAreaM2, 12);
  assert.equal(res.netUnits, 192); // 12 * 16
  assert.equal(res.totalUnitsWithWaste, 202); // ceil(192 * 1.05) = 202
});

test('Road gradient calculation identifies slope %, direction, ratio, and compliance', () => {
  const uphill = calculateRoadGradient({
    startChainageM: 0,
    startElevationM: 100,
    endChainageM: 200,
    endElevationM: 108,
  });
  assert.equal(uphill.valid, true);
  assert.equal(uphill.horizontalDistanceM, 200);
  assert.equal(uphill.elevationDiffM, 8);
  assert.equal(uphill.slopePercent, 4);
  assert.equal(uphill.direction, 'rampe');
  assert.equal(uphill.compliance, 'OPTIMAL_HIGHWAY');
  assert.equal(uphill.slopeRatioText, '1 : 25.0');

  const flat = calculateRoadGradient({
    startChainageM: 0,
    startElevationM: 100,
    endChainageM: 500,
    endElevationM: 101,
  });
  assert.equal(flat.slopePercent, 0.2);
  assert.equal(flat.compliance, 'DRAINAGE_WARNING');
});

test('Trapezoidal section area and linear cut/fill earthworks handle zero-crossing transitions', () => {
  // Area for width=8m, sideSlope=1.5, depth=2m => (8 + 1.5*2) * 2 = 22 m²
  assert.equal(calculateTrapezoidalSectionArea(8, 1.5, 2), 22);

  // Symmetric cut-to-fill transition: PK 0 (-2m cut) to PK 100 (+2m fill), width=10m, batter=1:1
  // Zero crossing at PK 50. Cut length=50m, Fill length=50m.
  // Area at ends = (10 + 1*2)*2 = 24 m². Cut vol = (24/2)*50 = 600 m³. Fill vol = (24/2)*50 = 600 m³.
  const earthworks = calculateLinearCutFill({
    roadWidthM: 10,
    sideSlopeRatio: 1,
    swellFactor: 1.2,
    stations: [
      { id: 's1', chainageM: 0, groundElevM: 102, designElevM: 100 },
      { id: 's2', chainageM: 100, groundElevM: 98, designElevM: 100 },
    ],
  });

  assert.equal(earthworks.valid, true);
  assert.equal(earthworks.totalLengthM, 100);
  assert.equal(earthworks.totalCutVolumeM3, 600);
  assert.equal(earthworks.totalFillVolumeM3, 600);
  assert.equal(earthworks.netEarthBalanceM3, 0);
  assert.equal(earthworks.segments[0].hasTransitionPoint, true);
  assert.equal(earthworks.segments[0].transitionChainageM, 50);
});
