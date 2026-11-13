import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toMeters,
  fromMeters,
  toSquareMeters,
  toCubicMeters,
  toKilograms,
  fromKilograms,
  convertUnitValue,
} from './units';
import { calculateConcreteMix } from './calculators.engine';

test('Length conversions accurately translate cm, mm, dm, km, ft, and in to meters', () => {
  assert.equal(toMeters(250, 'cm'), 2.5);
  assert.equal(toMeters(450, 'mm'), 0.45);
  assert.equal(toMeters(15, 'dm'), 1.5);
  assert.equal(toMeters(1.2, 'km'), 1200);
  assert.ok(Math.abs(toMeters(10, 'ft') - 3.048) < 1e-6);
  assert.ok(Math.abs(fromMeters(1, 'cm') - 100) < 1e-6);
});

test('Area, Volume, Mass (including Algerian Quintal), and Stress conversions work accurately', () => {
  assert.equal(toSquareMeters(2, 'ha'), 20000);
  assert.equal(toSquareMeters(10000, 'cm2'), 1);
  assert.equal(toCubicMeters(500, 'L'), 0.5);
  assert.equal(toKilograms(3.5, 'q'), 350);
  assert.equal(fromKilograms(2500, 't'), 2.5);

  const barFromMpa = convertUnitValue('stress', 25, 'MPa', 'bar');
  assert.equal(barFromMpa, 250);

  const kgCm2FromMpa = convertUnitValue('stress', 25, 'MPa', 'kg_cm2');
  assert.ok(Math.abs(kgCm2FromMpa - 254.929) < 0.01);
});

test('Multi-unit concrete input (m + cm + mm) produces exact metric concrete mix results', () => {
  const res = calculateConcreteMix({
    lengthM: toMeters(10, 'm'),
    widthM: toMeters(400, 'cm'),
    thicknessM: toMeters(200, 'mm'),
    dosageKgPerM3: 350,
    wastePercent: 0,
  });

  assert.equal(res.valid, true);
  assert.equal(res.netVolumeM3, 8);
  assert.equal(res.cementBags50kg, 56);
});

test('Non-finite unit inputs return NaN safely', () => {
  assert.equal(Number.isNaN(toMeters(Number.NaN, 'cm')), true);
  assert.equal(Number.isNaN(convertUnitValue('length', Number.POSITIVE_INFINITY, 'm', 'cm')), true);
});
