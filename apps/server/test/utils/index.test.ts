import test from 'ava'
import helper, { isIpInWhitelist } from '../../src/utils'

test('Helper purify', (t) => {
  t.deepEqual(helper.purify({
    a: null,
    b: 'test',
    c: '',
    d: {
      c: '',
      a: null,
      b: 'test',
    },
  }), {
    b: 'test',
    d: {
      c: '',
      a: null,
      b: 'test',
    },
  })
})

// ─── isIpInWhitelist ──────────────────────────────────────────────────────────

test('isIpInWhitelist: empty whitelist returns false', (t) => {
  t.false(isIpInWhitelist('192.168.1.1', []))
})

test('isIpInWhitelist: exact IPv4 match via /32 CIDR', (t) => {
  t.true(isIpInWhitelist('192.168.1.1', [ { cidr: '192.168.1.1/32' } ]))
})

test('isIpInWhitelist: IPv4 inside a /24 subnet', (t) => {
  t.true(isIpInWhitelist('10.0.0.99', [ { cidr: '10.0.0.0/24' } ]))
})

test('isIpInWhitelist: IPv4 outside a /24 subnet', (t) => {
  t.false(isIpInWhitelist('10.0.1.1', [ { cidr: '10.0.0.0/24' } ]))
})

test('isIpInWhitelist: IPv4 loopback in multiple entries', (t) => {
  t.true(isIpInWhitelist('127.0.0.1', [
    { cidr: '10.0.0.0/8' },
    { cidr: '127.0.0.0/8' },
  ]))
})

test('isIpInWhitelist: exact IPv6 match via /128 CIDR', (t) => {
  t.true(isIpInWhitelist('::1', [ { cidr: '::1/128' } ]))
})

test('isIpInWhitelist: IPv6 inside a /48 subnet', (t) => {
  t.true(isIpInWhitelist('2001:db8::1', [ { cidr: '2001:db8::/48' } ]))
})

test('isIpInWhitelist: IPv6 outside a subnet', (t) => {
  t.false(isIpInWhitelist('2001:db9::1', [ { cidr: '2001:db8::/48' } ]))
})

test('isIpInWhitelist: address-only CIDR (no slash) treated as /32 or /128', (t) => {
  t.true(isIpInWhitelist('172.16.0.1', [ { cidr: '172.16.0.1' } ]))
  t.false(isIpInWhitelist('172.16.0.2', [ { cidr: '172.16.0.1' } ]))
})

test('isIpInWhitelist: malformed CIDR entry is skipped gracefully', (t) => {
  // The bad entry should be skipped; only the valid one is used
  t.true(isIpInWhitelist('1.2.3.4', [
    { cidr: 'not-a-cidr' },
    { cidr: '1.2.3.4/32' },
  ]))
  // When only the malformed entry is present the result is false
  t.false(isIpInWhitelist('1.2.3.4', [ { cidr: 'not-a-cidr' } ]))
})

test('isIpInWhitelist: IPv4 0.0.0.0/0 matches everything', (t) => {
  t.true(isIpInWhitelist('8.8.8.8', [ { cidr: '0.0.0.0/0' } ]))
  t.true(isIpInWhitelist('192.168.100.200', [ { cidr: '0.0.0.0/0' } ]))
})
