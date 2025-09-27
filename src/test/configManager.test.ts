import * as assert from 'assert';
import { ConfigManager } from '../managers/configManager';

suite('ConfigManager Test Suite', () => {
  let configManager: ConfigManager;

  setup(() => {
    configManager = new ConfigManager();
  });

  suite('IP Address Validation', () => {
    test('should validate correct IPv4 addresses', () => {
      const validIps = [
        '192.168.1.1',
        '10.0.0.1',
        '172.16.0.1',
        '127.0.0.1',
        '255.255.255.255',
        '0.0.0.0',
        '8.8.8.8',
        '1.1.1.1'
      ];

      validIps.forEach(ip => {
        assert.strictEqual(
          configManager.validateIpAddress(ip),
          true,
          `IP ${ip} should be valid`
        );
      });
    });

    test('should validate localhost', () => {
      assert.strictEqual(configManager.validateIpAddress('localhost'), true);
      assert.strictEqual(configManager.validateIpAddress('127.0.0.1'), true);
    });

    test('should reject invalid IPv4 addresses', () => {
      const invalidIps = [
        '256.1.1.1',        // octet > 255
        '192.168.1',        // incomplete
        '192.168.1.1.1',    // too many octets
        '192.168.-1.1',     // negative number
        '192.168.1.256',    // octet > 255
        'abc.def.ghi.jkl',  // non-numeric
        '192.168.1.',       // trailing dot
        '.192.168.1.1',     // leading dot
        '192..168.1.1',     // double dot
        '',                 // empty string
        '   ',              // whitespace only
        '192.168.1.01',     // leading zero should be rejected
      ];

      invalidIps.forEach(ip => {
        assert.strictEqual(
          configManager.validateIpAddress(ip),
          false,
          `IP ${ip} should be invalid`
        );
      });
    });

    test('should handle null and undefined IP addresses', () => {
      assert.strictEqual(configManager.validateIpAddress(null as any), false);
      assert.strictEqual(configManager.validateIpAddress(undefined as any), false);
    });

    test('should handle IP addresses with whitespace', () => {
      assert.strictEqual(configManager.validateIpAddress(' 192.168.1.1 '), true);
      assert.strictEqual(configManager.validateIpAddress('\t192.168.1.1\n'), true);
    });
  });

  suite('Port Validation', () => {
    test('should validate correct port numbers', () => {
      const validPorts = [
        '1',
        '80',
        '443',
        '5555',
        '8080',
        '65535'
      ];

      validPorts.forEach(port => {
        assert.strictEqual(
          configManager.validatePort(port),
          true,
          `Port ${port} should be valid`
        );
      });
    });

    test('should validate numeric port values', () => {
      const validPorts = [1, 80, 443, 5555, 8080, 65535];

      validPorts.forEach(port => {
        assert.strictEqual(
          configManager.validatePort(port),
          true,
          `Port ${port} should be valid`
        );
      });
    });

    test('should reject invalid port numbers', () => {
      const invalidPorts = [
        '0',           // port 0 is reserved
        '65536',       // port > 65535
        '-1',          // negative port
        'abc',         // non-numeric
        '80.5',        // decimal
        '',            // empty string
        '   ',         // whitespace only
        '1 2',         // space in middle
      ];

      invalidPorts.forEach(port => {
        assert.strictEqual(
          configManager.validatePort(port),
          false,
          `Port ${port} should be invalid`
        );
      });
    });

    test('should reject invalid numeric port values', () => {
      const invalidPorts = [0, -1, 65536, 100000, NaN, Infinity, -Infinity];

      invalidPorts.forEach(port => {
        assert.strictEqual(
          configManager.validatePort(port),
          false,
          `Port ${port} should be invalid`
        );
      });
    });

    test('should handle null and undefined ports', () => {
      assert.strictEqual(configManager.validatePort(null as any), false);
      assert.strictEqual(configManager.validatePort(undefined as any), false);
    });

    test('should handle ports with whitespace', () => {
      assert.strictEqual(configManager.validatePort(' 5555 '), true);
      assert.strictEqual(configManager.validatePort('\t8080\n'), true);
    });
  });

  suite('Connection Validation', () => {
    test('should validate correct IP and port combinations', () => {
      const validCombinations = [
        { ip: '192.168.1.1', port: '5555' },
        { ip: 'localhost', port: '8080' },
        { ip: '127.0.0.1', port: '1' },
        { ip: '10.0.0.1', port: '65535' }
      ];

      validCombinations.forEach(({ ip, port }) => {
        const result = configManager.validateConnection(ip, port);
        assert.strictEqual(
          result.isValid,
          true,
          `Connection ${ip}:${port} should be valid. Errors: ${result.errors.join(', ')}`
        );
        assert.strictEqual(result.errors.length, 0);
      });
    });

    test('should reject invalid IP and port combinations', () => {
      const invalidCombinations = [
        { ip: '256.1.1.1', port: '5555', expectedErrors: 1 },
        { ip: '192.168.1.1', port: '0', expectedErrors: 1 },
        { ip: '256.1.1.1', port: '0', expectedErrors: 2 },
        { ip: '', port: '', expectedErrors: 2 },
        { ip: 'invalid', port: 'invalid', expectedErrors: 2 }
      ];

      invalidCombinations.forEach(({ ip, port, expectedErrors }) => {
        const result = configManager.validateConnection(ip, port);
        assert.strictEqual(
          result.isValid,
          false,
          `Connection ${ip}:${port} should be invalid`
        );
        assert.strictEqual(
          result.errors.length,
          expectedErrors,
          `Expected ${expectedErrors} errors for ${ip}:${port}, got ${result.errors.length}`
        );
      });
    });

    test('should provide meaningful error messages', () => {
      const result = configManager.validateConnection('256.1.1.1', '0');
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 2);
      assert.ok(result.errors.some(error => error.includes('Invalid IP address')));
      assert.ok(result.errors.some(error => error.includes('Invalid port')));
    });
  });

  suite('Configuration Defaults', () => {
    test('should provide fallback defaults for invalid configuration', () => {
      const config = configManager.getConfigWithDefaults();
      
      // Should return valid defaults
      assert.ok(configManager.validateIpAddress(config.ip));
      assert.ok(configManager.validatePort(config.port));
    });

    test('should handle empty string configurations', () => {
      // Test that empty strings are handled properly
      assert.strictEqual(configManager.validateIpAddress(''), false);
      assert.strictEqual(configManager.validatePort(''), false);
    });
  });

  suite('Edge Cases', () => {
    test('should handle special IP addresses', () => {
      // Test broadcast address
      assert.strictEqual(configManager.validateIpAddress('255.255.255.255'), true);
      
      // Test network address
      assert.strictEqual(configManager.validateIpAddress('0.0.0.0'), true);
      
      // Test private network ranges
      assert.strictEqual(configManager.validateIpAddress('10.0.0.1'), true);
      assert.strictEqual(configManager.validateIpAddress('172.16.0.1'), true);
      assert.strictEqual(configManager.validateIpAddress('192.168.0.1'), true);
    });

    test('should handle edge case ports', () => {
      // Test minimum valid port
      assert.strictEqual(configManager.validatePort('1'), true);
      assert.strictEqual(configManager.validatePort(1), true);
      
      // Test maximum valid port
      assert.strictEqual(configManager.validatePort('65535'), true);
      assert.strictEqual(configManager.validatePort(65535), true);
      
      // Test common ports
      assert.strictEqual(configManager.validatePort('80'), true);
      assert.strictEqual(configManager.validatePort('443'), true);
      assert.strictEqual(configManager.validatePort('5555'), true);
    });

    test('should handle type coercion correctly', () => {
      // Test that string numbers are handled correctly
      assert.strictEqual(configManager.validatePort('123'), true);
      assert.strictEqual(configManager.validatePort('0123'), false); // Leading zeros should be rejected
      
      // Test that non-string, non-number inputs fail
      assert.strictEqual(configManager.validatePort({} as any), false);
      assert.strictEqual(configManager.validatePort([] as any), false);
      assert.strictEqual(configManager.validatePort(true as any), false);
    });
  });

  suite('Configuration Integration', () => {
    test('should validate complete configuration', () => {
      // This test would need to mock vscode.workspace.getConfiguration
      // For now, we'll test the validation logic directly
      const mockConfig = {
        defaultIp: '192.168.1.100',
        defaultPort: '5555',
        customAdbPath: undefined,
        customScrcpyPath: undefined,
        isValid: true,
        errors: []
      };

      // Test that our validation logic would work with this config
      assert.ok(configManager.validateIpAddress(mockConfig.defaultIp));
      assert.ok(configManager.validatePort(mockConfig.defaultPort));
    });
  });
});