"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports2, module2) {
    module2.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports2) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports2.getSymbolSize = /* @__PURE__ */ __name(function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    }, "getSymbolSize");
    exports2.getSymbolTotalCodewords = /* @__PURE__ */ __name(function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    }, "getSymbolTotalCodewords");
    exports2.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports2.setToSJISFunction = /* @__PURE__ */ __name(function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    }, "setToSJISFunction");
    exports2.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports2.toSJIS = /* @__PURE__ */ __name(function toSJIS(kanji) {
      return toSJISFunction(kanji);
    }, "toSJIS");
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports2) {
    exports2.L = { bit: 1 };
    exports2.M = { bit: 0 };
    exports2.Q = { bit: 3 };
    exports2.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports2.L;
        case "m":
        case "medium":
          return exports2.M;
        case "q":
        case "quartile":
          return exports2.Q;
        case "h":
        case "high":
          return exports2.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    __name(fromString, "fromString");
    exports2.isValid = /* @__PURE__ */ __name(function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    }, "isValid");
    exports2.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports2.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports2, module2) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    __name(BitBuffer, "BitBuffer");
    BitBuffer.prototype = {
      get: /* @__PURE__ */ __name(function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      }, "get"),
      put: /* @__PURE__ */ __name(function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      }, "put"),
      getLengthInBits: /* @__PURE__ */ __name(function() {
        return this.length;
      }, "getLengthInBits"),
      putBit: /* @__PURE__ */ __name(function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }, "putBit")
    };
    module2.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports2, module2) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    __name(BitMatrix, "BitMatrix");
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module2.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports2) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports2.getRowColCoords = /* @__PURE__ */ __name(function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    }, "getRowColCoords");
    exports2.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const coords = [];
      const pos = exports2.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports2) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports2.getPositions = /* @__PURE__ */ __name(function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    }, "getPositions");
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports2) {
    exports2.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports2.isValid = /* @__PURE__ */ __name(function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    }, "isValid");
    exports2.from = /* @__PURE__ */ __name(function from(value) {
      return exports2.isValid(value) ? parseInt(value, 10) : void 0;
    }, "from");
    exports2.getPenaltyN1 = /* @__PURE__ */ __name(function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module3 = data.get(row, col);
          if (module3 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module3;
            sameCountCol = 1;
          }
          module3 = data.get(col, row);
          if (module3 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module3;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    }, "getPenaltyN1");
    exports2.getPenaltyN2 = /* @__PURE__ */ __name(function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    }, "getPenaltyN2");
    exports2.getPenaltyN3 = /* @__PURE__ */ __name(function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    }, "getPenaltyN3");
    exports2.getPenaltyN4 = /* @__PURE__ */ __name(function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    }, "getPenaltyN4");
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports2.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports2.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports2.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports2.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports2.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports2.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports2.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports2.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    __name(getMaskAt, "getMaskAt");
    exports2.applyMask = /* @__PURE__ */ __name(function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    }, "applyMask");
    exports2.getBestMask = /* @__PURE__ */ __name(function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports2.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports2.applyMask(p, data);
        const penalty = exports2.getPenaltyN1(data) + exports2.getPenaltyN2(data) + exports2.getPenaltyN3(data) + exports2.getPenaltyN4(data);
        exports2.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    }, "getBestMask");
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports2) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports2.getBlocksCount = /* @__PURE__ */ __name(function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getBlocksCount");
    exports2.getTotalCodewordsCount = /* @__PURE__ */ __name(function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    }, "getTotalCodewordsCount");
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports2) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (/* @__PURE__ */ __name(function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    }, "initTables"))();
    exports2.log = /* @__PURE__ */ __name(function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    }, "log");
    exports2.exp = /* @__PURE__ */ __name(function exp(n) {
      return EXP_TABLE[n];
    }, "exp");
    exports2.mul = /* @__PURE__ */ __name(function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    }, "mul");
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports2) {
    var GF = require_galois_field();
    exports2.mul = /* @__PURE__ */ __name(function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    }, "mul");
    exports2.mod = /* @__PURE__ */ __name(function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    }, "mod");
    exports2.generateECPolynomial = /* @__PURE__ */ __name(function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports2.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    }, "generateECPolynomial");
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports2, module2) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    __name(ReedSolomonEncoder, "ReedSolomonEncoder");
    ReedSolomonEncoder.prototype.initialize = /* @__PURE__ */ __name(function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    }, "initialize");
    ReedSolomonEncoder.prototype.encode = /* @__PURE__ */ __name(function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    }, "encode");
    module2.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports2) {
    exports2.isValid = /* @__PURE__ */ __name(function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    }, "isValid");
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports2) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports2.KANJI = new RegExp(kanji, "g");
    exports2.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports2.BYTE = new RegExp(byte, "g");
    exports2.NUMERIC = new RegExp(numeric, "g");
    exports2.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports2.testKanji = /* @__PURE__ */ __name(function testKanji(str) {
      return TEST_KANJI.test(str);
    }, "testKanji");
    exports2.testNumeric = /* @__PURE__ */ __name(function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    }, "testNumeric");
    exports2.testAlphanumeric = /* @__PURE__ */ __name(function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    }, "testAlphanumeric");
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports2) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports2.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports2.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports2.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports2.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports2.MIXED = {
      bit: -1
    };
    exports2.getCharCountIndicator = /* @__PURE__ */ __name(function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    }, "getCharCountIndicator");
    exports2.getBestModeForData = /* @__PURE__ */ __name(function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports2.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports2.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports2.KANJI;
      else return exports2.BYTE;
    }, "getBestModeForData");
    exports2.toString = /* @__PURE__ */ __name(function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    }, "toString");
    exports2.isValid = /* @__PURE__ */ __name(function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    }, "isValid");
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports2.NUMERIC;
        case "alphanumeric":
          return exports2.ALPHANUMERIC;
        case "kanji":
          return exports2.KANJI;
        case "byte":
          return exports2.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    __name(fromString, "fromString");
    exports2.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (exports2.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    }, "from");
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports2) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports2.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForDataLength, "getBestVersionForDataLength");
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    __name(getReservedBitsCount, "getReservedBitsCount");
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    __name(getTotalBitsFromDataArray, "getTotalBitsFromDataArray");
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports2.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    __name(getBestVersionForMixedData, "getBestVersionForMixedData");
    exports2.from = /* @__PURE__ */ __name(function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    }, "from");
    exports2.getCapacity = /* @__PURE__ */ __name(function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    }, "getCapacity");
    exports2.getBestVersionForData = /* @__PURE__ */ __name(function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    }, "getBestVersionForData");
    exports2.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports2) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports2.getEncodedBits = /* @__PURE__ */ __name(function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    }, "getEncodedBits");
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports2, module2) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    __name(NumericData, "NumericData");
    NumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    }, "getBitsLength");
    NumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    NumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    NumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    }, "write");
    module2.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports2, module2) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    __name(AlphanumericData, "AlphanumericData");
    AlphanumericData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    }, "getBitsLength");
    AlphanumericData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    AlphanumericData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    }, "getBitsLength");
    AlphanumericData.prototype.write = /* @__PURE__ */ __name(function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    }, "write");
    module2.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports2, module2) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    __name(ByteData, "ByteData");
    ByteData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 8;
    }, "getBitsLength");
    ByteData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    ByteData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    }, "getBitsLength");
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module2.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports2, module2) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    __name(KanjiData, "KanjiData");
    KanjiData.getBitsLength = /* @__PURE__ */ __name(function getBitsLength(length) {
      return length * 13;
    }, "getBitsLength");
    KanjiData.prototype.getLength = /* @__PURE__ */ __name(function getLength() {
      return this.data.length;
    }, "getLength");
    KanjiData.prototype.getBitsLength = /* @__PURE__ */ __name(function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    }, "getBitsLength");
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module2.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports2, module2) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open = dijkstra.PriorityQueue.make();
        open.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open.empty()) {
          closest = open.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      }, "single_source_shortest_paths"),
      extract_shortest_path_from_predecessor_list: /* @__PURE__ */ __name(function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      }, "extract_shortest_path_from_predecessor_list"),
      find_path: /* @__PURE__ */ __name(function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      }, "find_path"),
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: /* @__PURE__ */ __name(function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        }, "make"),
        default_sorter: /* @__PURE__ */ __name(function(a, b) {
          return a.cost - b.cost;
        }, "default_sorter"),
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: /* @__PURE__ */ __name(function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        }, "push"),
        /**
         * Return the highest priority element in the queue.
         */
        pop: /* @__PURE__ */ __name(function() {
          return this.queue.shift();
        }, "pop"),
        empty: /* @__PURE__ */ __name(function() {
          return this.queue.length === 0;
        }, "empty")
      }
    };
    if (typeof module2 !== "undefined") {
      module2.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports2) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    __name(getStringByteLength, "getStringByteLength");
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    __name(getSegments, "getSegments");
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    __name(getSegmentsFromString, "getSegmentsFromString");
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    __name(getSegmentBitsLength, "getSegmentBitsLength");
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    __name(mergeSegments, "mergeSegments");
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    __name(buildNodes, "buildNodes");
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    __name(buildGraph, "buildGraph");
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    __name(buildSingleSegment, "buildSingleSegment");
    exports2.fromArray = /* @__PURE__ */ __name(function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    }, "fromArray");
    exports2.fromString = /* @__PURE__ */ __name(function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path5 = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path5.length - 1; i++) {
        optimizedSegs.push(graph.table[path5[i]].node);
      }
      return exports2.fromArray(mergeSegments(optimizedSegs));
    }, "fromString");
    exports2.rawSplit = /* @__PURE__ */ __name(function rawSplit(data) {
      return exports2.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    }, "rawSplit");
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports2) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupFinderPattern, "setupFinderPattern");
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    __name(setupTimingPattern, "setupTimingPattern");
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    __name(setupAlignmentPattern, "setupAlignmentPattern");
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    __name(setupVersionInfo, "setupVersionInfo");
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    __name(setupFormatInfo, "setupFormatInfo");
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    __name(setupData, "setupData");
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    __name(createData, "createData");
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    __name(createCodewords, "createCodewords");
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    __name(createSymbol, "createSymbol");
    exports2.create = /* @__PURE__ */ __name(function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    }, "create");
  }
});

// node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "node_modules/pngjs/lib/chunkstream.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var ChunkStream = module2.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "node_modules/pngjs/lib/interlace.js"(exports2) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports2.getImagePasses = function(width, height) {
      let images = [];
      let xLeftOver = width % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i = 0; i < imagePasses.length; i++) {
        let pass = imagePasses[i];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i });
        }
      }
      return images;
    };
    exports2.getInterlaceIterator = function(width) {
      return function(x, y, pass) {
        let outerXLeftOver = x % imagePasses[pass].x.length;
        let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y % imagePasses[pass].y.length;
        let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width * 4;
      };
    };
  }
});

// node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "node_modules/pngjs/lib/paeth-predictor.js"(exports2, module2) {
    "use strict";
    module2.exports = /* @__PURE__ */ __name(function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    }, "paethPredictor");
  }
});

// node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "node_modules/pngjs/lib/filter-parse.js"(exports2, module2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width, bpp, depth) {
      let byteWidth = width * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    __name(getByteWidth, "getByteWidth");
    var Filter = module2.exports = function(bitmapInfo, dependencies) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width, height);
        for (let i = 0; i < passes.length; i++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i].width, bpp, depth),
            height: passes[i].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        unfilteredLine[x] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f2Up = lastLine ? lastLine[x] : 0;
        unfilteredLine[x] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f3Up = lastLine ? lastLine[x] : 0;
        let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f4Up = lastLine ? lastLine[x] : 0;
        let f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "node_modules/pngjs/lib/filter-parse-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module2.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: /* @__PURE__ */ __name(function(buffer) {
          buffers.push(buffer);
        }, "write"),
        complete: /* @__PURE__ */ __name(function() {
          that.emit("complete", Buffer.concat(buffers));
        }, "complete")
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "node_modules/pngjs/lib/constants.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "node_modules/pngjs/lib/crc.js"(exports2, module2) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i = 0; i < 256; i++) {
        let currentCrc = i;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i] = currentCrc;
      }
    })();
    var CrcCalculator = module2.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i = 0; i < data.length; i++) {
        this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// node_modules/pngjs/lib/parser.js
var require_parser = __commonJS({
  "node_modules/pngjs/lib/parser.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser = module2.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser.prototype._parseSignature = function(data) {
      let signature = constants.PNG_SIGNATURE;
      for (let i = 0; i < signature.length; i++) {
        if (data[i] !== signature[i]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(data[i]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i = 0; i < entries; i++) {
        this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i = 0; i < data.length; i++) {
          this._palette[i][3] = data[i];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "node_modules/pngjs/lib/bitmapper.js"(exports2) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i = 0;
      function split() {
        if (i === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i];
        i++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i];
            i++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      __name(split, "split");
      return {
        get: /* @__PURE__ */ __name(function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        }, "get"),
        resetAfterLine: /* @__PURE__ */ __name(function() {
          leftOver.length = 0;
        }, "resetAfterLine"),
        end: /* @__PURE__ */ __name(function() {
          if (i !== data.length) {
            throw new Error("extra data found");
          }
        }, "end")
      };
    }
    __name(bitRetriever, "bitRetriever");
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    __name(mapImage8Bit, "mapImage8Bit");
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    __name(mapImageCustomBit, "mapImageCustomBit");
    exports2.dataToBitMap = function(data, bitmapInfo) {
      let width = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width * height * 4);
      } else {
        pxData = new Uint16Array(width * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = /* @__PURE__ */ __name(function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        }, "getPxPos");
        images = [{ width, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "node_modules/pngjs/lib/format-normaliser.js"(exports2, module2) {
    "use strict";
    function dePalette(indata, outdata, width, height, palette) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = color[i];
          }
          pxPos += 4;
        }
      }
    }
    __name(dePalette, "dePalette");
    function replaceTransparentColor(indata, outdata, width, height, transColor) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i = 0; i < 4; i++) {
              outdata[pxPos + i] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    __name(replaceTransparentColor, "replaceTransparentColor");
    function scaleDepth(indata, outdata, width, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = Math.floor(
              indata[pxPos + i] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    __name(scaleDepth, "scaleDepth");
    module2.exports = function(indata, imageData) {
      let depth = imageData.depth;
      let width = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width, height, transColor);
        }
        if (depth !== 8) {
          if (depth === 16) {
            outdata = Buffer.alloc(width * height * 4);
          }
          scaleDepth(indata, outdata, width, height, depth);
        }
      }
      return outdata;
    };
  }
});

// node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "node_modules/pngjs/lib/parser-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var zlib = require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module2.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
          this._inflate = zlib.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk) {
            if (!leftToInflate) {
              return;
            }
            if (chunk.length > leftToInflate) {
              chunk = chunk.slice(0, leftToInflate);
            }
            leftToInflate -= chunk.length;
            filterWrite(chunk);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "node_modules/pngjs/lib/bitpacker.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    module2.exports = function(dataIn, width, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = (function() {
          let buffer = new ArrayBuffer(2);
          new DataView(buffer).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer)[0] !== 256;
        })();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red;
        let green;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red = data[inIndex];
            green = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red = data[inIndex];
            green = red;
            blue = red;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0),
              maxValue
            );
            green = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red, green, blue, alpha };
      }
      __name(getRGBA, "getRGBA");
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "node_modules/pngjs/lib/filter-pack.js"(exports2, module2) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        rawData[rawPos + x] = pxData[pxPos + x];
      }
    }
    __name(filterNone, "filterNone");
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i = pxPos; i < length; i++) {
        sum += Math.abs(pxData[i]);
      }
      return sum;
    }
    __name(filterSumNone, "filterSumNone");
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        rawData[rawPos + x] = val;
      }
    }
    __name(filterSub, "filterSub");
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    __name(filterSumSub, "filterSumSub");
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - up;
        rawData[rawPos + x] = val;
      }
    }
    __name(filterUp, "filterUp");
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x = pxPos; x < length; x++) {
        let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
        let val = pxData[x] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    __name(filterSumUp, "filterSumUp");
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        rawData[rawPos + x] = val;
      }
    }
    __name(filterAvg, "filterAvg");
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    __name(filterSumAvg, "filterSumAvg");
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        rawData[rawPos + x] = val;
      }
    }
    __name(filterPaeth, "filterPaeth");
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    __name(filterSumPaeth, "filterSumPaeth");
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module2.exports = function(pxData, width, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y = 0; y < height; y++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i = 0; i < filterTypes.length; i++) {
            let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "node_modules/pngjs/lib/packer.js"(exports2, module2) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib = require("zlib");
    var Packer = module2.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width, height) {
      let packedData = bitPacker(data, width, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "node_modules/pngjs/lib/packer-async.js"(exports2, module2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module2.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "node_modules/pngjs/lib/sync-inflate.js"(exports2, module2) {
    "use strict";
    var assert = require("assert").ok;
    var zlib = require("zlib");
    var util = require("util");
    var kMaxLength = require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
        opts.chunkSize = zlib.Z_MIN_CHUNK;
      }
      zlib.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    __name(Inflate, "Inflate");
    function createInflate(opts) {
      return new Inflate(opts);
    }
    __name(createInflate, "createInflate");
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    __name(_close, "_close");
    Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk && chunk.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      __name(handleChunk, "handleChunk");
      assert(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib.Inflate);
    function zlibBufferSync(engine, buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer);
      }
      if (!(buffer instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib.Z_FINISH;
      }
      return engine._processChunk(buffer, flushFlag);
    }
    __name(zlibBufferSync, "zlibBufferSync");
    function inflateSync(buffer, opts) {
      return zlibBufferSync(new Inflate(opts), buffer);
    }
    __name(inflateSync, "inflateSync");
    module2.exports = exports2 = inflateSync;
    exports2.Inflate = Inflate;
    exports2.createInflate = createInflate;
    exports2.inflateSync = inflateSync;
  }
});

// node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "node_modules/pngjs/lib/sync-reader.js"(exports2, module2) {
    "use strict";
    var SyncReader = module2.exports = function(buffer) {
      this._buffer = buffer;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        return new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        return new Error("unrecognised content at end of stream");
      }
    };
  }
});

// node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "node_modules/pngjs/lib/filter-parse-sync.js"(exports2) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports2.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: /* @__PURE__ */ __name(function(bufferPart) {
          outBuffers.push(bufferPart);
        }, "write"),
        complete: /* @__PURE__ */ __name(function() {
        }, "complete")
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "node_modules/pngjs/lib/parser-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module2.exports = function(buffer, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      __name(handleError, "handleError");
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      __name(handleMetaData, "handleMetaData");
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      __name(handleTransColor, "handleTransColor");
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      __name(handlePalette, "handlePalette");
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      __name(handleSimpleTransparency, "handleSimpleTransparency");
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      __name(handleGamma, "handleGamma");
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      __name(handleInflateData, "handleInflateData");
      let reader = new SyncReader(buffer);
      let parser = new Parser(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(bitmapData, metaData);
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "node_modules/pngjs/lib/packer-sync.js"(exports2, module2) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = require("zlib");
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module2.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "node_modules/pngjs/lib/png-sync.js"(exports2) {
    "use strict";
    var parse = require_parser_sync();
    var pack = require_packer_sync();
    exports2.read = function(buffer, options) {
      return parse(buffer, options || {});
    };
    exports2.write = function(png, options) {
      return pack(png, options);
    };
  }
});

// node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "node_modules/pngjs/lib/png.js"(exports2) {
    "use strict";
    var util = require("util");
    var Stream = require("stream");
    var Parser = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG = exports2.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG, Stream);
    PNG.sync = PNGSync;
    PNG.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y = 0; y < height; y++) {
        src.data.copy(
          dst.data,
          (deltaY + y) * dst.width + deltaX << 2,
          (srcY + y) * src.width + srcX << 2,
          (srcY + y) * src.width + srcX + width << 2
        );
      }
    };
    PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) {
      PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
      return this;
    };
    PNG.adjustGamma = function(src) {
      if (src.gamma) {
        for (let y = 0; y < src.height; y++) {
          for (let x = 0; x < src.width; x++) {
            let idx = src.width * y + x << 2;
            for (let i = 0; i < 3; i++) {
              let sample = src.data[idx + i] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src.gamma);
              src.data[idx + i] = Math.round(sample * 255);
            }
          }
        }
        src.gamma = 0;
      }
    };
    PNG.prototype.adjustGamma = function() {
      PNG.adjustGamma(this);
    };
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports2) {
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    __name(hex2rgba, "hex2rgba");
    exports2.getOptions = /* @__PURE__ */ __name(function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width,
        scale: width ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    }, "getOptions");
    exports2.getScale = /* @__PURE__ */ __name(function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    }, "getScale");
    exports2.getImageWidth = /* @__PURE__ */ __name(function getImageWidth(qrSize, opts) {
      const scale = exports2.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    }, "getImageWidth");
    exports2.qrToImageData = /* @__PURE__ */ __name(function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports2.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    }, "qrToImageData");
  }
});

// node_modules/qrcode/lib/renderer/png.js
var require_png2 = __commonJS({
  "node_modules/qrcode/lib/renderer/png.js"(exports2) {
    var fs4 = require("fs");
    var PNG = require_png().PNG;
    var Utils = require_utils2();
    exports2.render = /* @__PURE__ */ __name(function render(qrData, options) {
      const opts = Utils.getOptions(options);
      const pngOpts = opts.rendererOpts;
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      pngOpts.width = size;
      pngOpts.height = size;
      const pngImage = new PNG(pngOpts);
      Utils.qrToImageData(pngImage.data, qrData, opts);
      return pngImage;
    }, "render");
    exports2.renderToDataURL = /* @__PURE__ */ __name(function renderToDataURL(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      exports2.renderToBuffer(qrData, options, function(err, output) {
        if (err) cb(err);
        let url = "data:image/png;base64,";
        url += output.toString("base64");
        cb(null, url);
      });
    }, "renderToDataURL");
    exports2.renderToBuffer = /* @__PURE__ */ __name(function renderToBuffer(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const png = exports2.render(qrData, options);
      const buffer = [];
      png.on("error", cb);
      png.on("data", function(data) {
        buffer.push(data);
      });
      png.on("end", function() {
        cb(null, Buffer.concat(buffer));
      });
      png.pack();
    }, "renderToBuffer");
    exports2.renderToFile = /* @__PURE__ */ __name(function renderToFile(path5, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      let called = false;
      const done = /* @__PURE__ */ __name((...args) => {
        if (called) return;
        called = true;
        cb.apply(null, args);
      }, "done");
      const stream = fs4.createWriteStream(path5);
      stream.on("error", done);
      stream.on("close", done);
      exports2.renderToFileStream(stream, qrData, options);
    }, "renderToFile");
    exports2.renderToFileStream = /* @__PURE__ */ __name(function renderToFileStream(stream, qrData, options) {
      const png = exports2.render(qrData, options);
      png.pack().pipe(stream);
    }, "renderToFileStream");
  }
});

// node_modules/qrcode/lib/renderer/utf8.js
var require_utf8 = __commonJS({
  "node_modules/qrcode/lib/renderer/utf8.js"(exports2) {
    var Utils = require_utils2();
    var BLOCK_CHAR = {
      WW: " ",
      WB: "\u2584",
      BB: "\u2588",
      BW: "\u2580"
    };
    var INVERTED_BLOCK_CHAR = {
      BB: " ",
      BW: "\u2584",
      WW: "\u2588",
      WB: "\u2580"
    };
    function getBlockChar(top, bottom, blocks) {
      if (top && bottom) return blocks.BB;
      if (top && !bottom) return blocks.BW;
      if (!top && bottom) return blocks.WB;
      return blocks.WW;
    }
    __name(getBlockChar, "getBlockChar");
    exports2.render = function(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      let blocks = BLOCK_CHAR;
      if (opts.color.dark.hex === "#ffffff" || opts.color.light.hex === "#000000") {
        blocks = INVERTED_BLOCK_CHAR;
      }
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      let output = "";
      let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW);
      hMargin = Array(opts.margin / 2 + 1).join(hMargin + "\n");
      const vMargin = Array(opts.margin + 1).join(blocks.WW);
      output += hMargin;
      for (let i = 0; i < size; i += 2) {
        output += vMargin;
        for (let j = 0; j < size; j++) {
          const topModule = data[i * size + j];
          const bottomModule = data[(i + 1) * size + j];
          output += getBlockChar(topModule, bottomModule, blocks);
        }
        output += vMargin + "\n";
      }
      output += hMargin.slice(0, -1);
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
    exports2.renderToFile = /* @__PURE__ */ __name(function renderToFile(path5, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs4 = require("fs");
      const utf8 = exports2.render(qrData, options);
      fs4.writeFile(path5, utf8, cb);
    }, "renderToFile");
  }
});

// node_modules/qrcode/lib/renderer/terminal/terminal.js
var require_terminal = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal/terminal.js"(exports2) {
    exports2.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const black = "\x1B[40m  \x1B[0m";
      const white = "\x1B[47m  \x1B[0m";
      let output = "";
      const hMargin = Array(size + 3).join(white);
      const vMargin = Array(2).join(white);
      output += hMargin + "\n";
      for (let i = 0; i < size; ++i) {
        output += white;
        for (let j = 0; j < size; j++) {
          output += data[i * size + j] ? black : white;
        }
        output += vMargin + "\n";
      }
      output += hMargin + "\n";
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// node_modules/qrcode/lib/renderer/terminal/terminal-small.js
var require_terminal_small = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal/terminal-small.js"(exports2) {
    var backgroundWhite = "\x1B[47m";
    var backgroundBlack = "\x1B[40m";
    var foregroundWhite = "\x1B[37m";
    var foregroundBlack = "\x1B[30m";
    var reset = "\x1B[0m";
    var lineSetupNormal = backgroundWhite + foregroundBlack;
    var lineSetupInverse = backgroundBlack + foregroundWhite;
    var createPalette = /* @__PURE__ */ __name(function(lineSetup, foregroundWhite2, foregroundBlack2) {
      return {
        // 1 ... white, 2 ... black, 0 ... transparent (default)
        "00": reset + " " + lineSetup,
        "01": reset + foregroundWhite2 + "\u2584" + lineSetup,
        "02": reset + foregroundBlack2 + "\u2584" + lineSetup,
        10: reset + foregroundWhite2 + "\u2580" + lineSetup,
        11: " ",
        12: "\u2584",
        20: reset + foregroundBlack2 + "\u2580" + lineSetup,
        21: "\u2580",
        22: "\u2588"
      };
    }, "createPalette");
    var mkCodePixel = /* @__PURE__ */ __name(function(modules, size, x, y) {
      const sizePlus = size + 1;
      if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return "0";
      if (x >= size || y >= size || y < 0 || x < 0) return "1";
      const idx = y * size + x;
      return modules[idx] ? "2" : "1";
    }, "mkCodePixel");
    var mkCode = /* @__PURE__ */ __name(function(modules, size, x, y) {
      return mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1);
    }, "mkCode");
    exports2.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const inverse = !!(options && options.inverse);
      const lineSetup = options && options.inverse ? lineSetupInverse : lineSetupNormal;
      const white = inverse ? foregroundBlack : foregroundWhite;
      const black = inverse ? foregroundWhite : foregroundBlack;
      const palette = createPalette(lineSetup, white, black);
      const newLine = reset + "\n" + lineSetup;
      let output = lineSetup;
      for (let y = -1; y < size + 1; y += 2) {
        for (let x = -1; x < size; x++) {
          output += palette[mkCode(data, size, x, y)];
        }
        output += palette[mkCode(data, size, size, y)] + newLine;
      }
      output += reset;
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// node_modules/qrcode/lib/renderer/terminal.js
var require_terminal2 = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal.js"(exports2) {
    var big = require_terminal();
    var small = require_terminal_small();
    exports2.render = function(qrData, options, cb) {
      if (options && options.small) {
        return small.render(qrData, options, cb);
      }
      return big.render(qrData, options, cb);
    };
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports2) {
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    __name(getColorAttrib, "getColorAttrib");
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    __name(svgCmd, "svgCmd");
    function qrToPath(data, size, margin) {
      let path5 = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path5 += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path5 += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path5;
    }
    __name(qrToPath, "qrToPath");
    exports2.render = /* @__PURE__ */ __name(function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path5 = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path5 + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    }, "render");
  }
});

// node_modules/qrcode/lib/renderer/svg.js
var require_svg = __commonJS({
  "node_modules/qrcode/lib/renderer/svg.js"(exports2) {
    var svgTagRenderer = require_svg_tag();
    exports2.render = svgTagRenderer.render;
    exports2.renderToFile = /* @__PURE__ */ __name(function renderToFile(path5, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs4 = require("fs");
      const svgTag = exports2.render(qrData, options);
      const xmlStr = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + svgTag;
      fs4.writeFile(path5, xmlStr, cb);
    }, "renderToFile");
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports2) {
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    __name(clearCanvas, "clearCanvas");
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    __name(getCanvasElement, "getCanvasElement");
    exports2.render = /* @__PURE__ */ __name(function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    }, "render");
    exports2.renderToDataURL = /* @__PURE__ */ __name(function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports2.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    }, "renderToDataURL");
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports2) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    __name(renderCanvas, "renderCanvas");
    exports2.create = QRCode2.create;
    exports2.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports2.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports2.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// node_modules/qrcode/lib/server.js
var require_server = __commonJS({
  "node_modules/qrcode/lib/server.js"(exports2) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var PngRenderer = require_png2();
    var Utf8Renderer = require_utf8();
    var TerminalRenderer = require_terminal2();
    var SvgRenderer = require_svg();
    function checkParams(text, opts, cb) {
      if (typeof text === "undefined") {
        throw new Error("String required as first argument");
      }
      if (typeof cb === "undefined") {
        cb = opts;
        opts = {};
      }
      if (typeof cb !== "function") {
        if (!canPromise()) {
          throw new Error("Callback required as last argument");
        } else {
          opts = cb || {};
          cb = null;
        }
      }
      return {
        opts,
        cb
      };
    }
    __name(checkParams, "checkParams");
    function getTypeFromFilename(path5) {
      return path5.slice((path5.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    }
    __name(getTypeFromFilename, "getTypeFromFilename");
    function getRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "txt":
        case "utf8":
          return Utf8Renderer;
        case "png":
        case "image/png":
        default:
          return PngRenderer;
      }
    }
    __name(getRendererFromType, "getRendererFromType");
    function getStringRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "terminal":
          return TerminalRenderer;
        case "utf8":
        default:
          return Utf8Renderer;
      }
    }
    __name(getStringRendererFromType, "getStringRendererFromType");
    function render(renderFunc, text, params) {
      if (!params.cb) {
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, params.opts);
            return renderFunc(data, params.opts, function(err, data2) {
              return err ? reject(err) : resolve(data2);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, params.opts);
        return renderFunc(data, params.opts, params.cb);
      } catch (e) {
        params.cb(e);
      }
    }
    __name(render, "render");
    exports2.create = QRCode2.create;
    exports2.toCanvas = require_browser().toCanvas;
    exports2.toString = /* @__PURE__ */ __name(function toString(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const type = params.opts ? params.opts.type : void 0;
      const renderer = getStringRendererFromType(type);
      return render(renderer.render, text, params);
    }, "toString");
    exports2.toDataURL = /* @__PURE__ */ __name(function toDataURL(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToDataURL, text, params);
    }, "toDataURL");
    exports2.toBuffer = /* @__PURE__ */ __name(function toBuffer(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToBuffer, text, params);
    }, "toBuffer");
    exports2.toFile = /* @__PURE__ */ __name(function toFile(path5, text, opts, cb) {
      if (typeof path5 !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
      }
      if (arguments.length < 3 && !canPromise()) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, cb);
      const type = params.opts.type || getTypeFromFilename(path5);
      const renderer = getRendererFromType(type);
      const renderToFile = renderer.renderToFile.bind(null, path5);
      return render(renderToFile, text, params);
    }, "toFile");
    exports2.toFileStream = /* @__PURE__ */ __name(function toFileStream(stream, text, opts) {
      if (arguments.length < 2) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
      const renderer = getRendererFromType("png");
      const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
      render(renderToFileStream, text, params);
    }, "toFileStream");
  }
});

// node_modules/qrcode/lib/index.js
var require_lib = __commonJS({
  "node_modules/qrcode/lib/index.js"(exports2, module2) {
    module2.exports = require_server();
  }
});

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate,
  getExtensionState: () => getExtensionState,
  getLogger: () => getLogger,
  isExtensionInitialized: () => isExtensionInitialized
});
module.exports = __toCommonJS(extension_exports);

// src/utils/errorHandler.ts
var vscode = __toESM(require("vscode"));
var ErrorCategory = /* @__PURE__ */ ((ErrorCategory2) => {
  ErrorCategory2["CONFIGURATION"] = "configuration";
  ErrorCategory2["CONNECTION"] = "connection";
  ErrorCategory2["PROCESS"] = "process";
  ErrorCategory2["SYSTEM"] = "system";
  ErrorCategory2["VALIDATION"] = "validation";
  ErrorCategory2["BINARY"] = "binary";
  ErrorCategory2["UNKNOWN"] = "unknown";
  return ErrorCategory2;
})(ErrorCategory || {});
var ErrorSeverity = /* @__PURE__ */ ((ErrorSeverity2) => {
  ErrorSeverity2["LOW"] = "low";
  ErrorSeverity2["MEDIUM"] = "medium";
  ErrorSeverity2["HIGH"] = "high";
  ErrorSeverity2["CRITICAL"] = "critical";
  return ErrorSeverity2;
})(ErrorSeverity || {});
var _ErrorHandler = class _ErrorHandler {
  logger;
  activeProgressOperations = /* @__PURE__ */ new Map();
  errorStats = /* @__PURE__ */ new Map();
  config = {
    showNotifications: true,
    logLevel: "info"
  };
  constructor(logger2) {
    this.logger = logger2;
    Object.values(ErrorCategory).forEach((category) => {
      this.errorStats.set(category, 0);
    });
  }
  /**
   * Handle configuration-related errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleConfigurationError(error, setting) {
    const errorInfo = {
      category: "configuration" /* CONFIGURATION */,
      severity: "medium" /* MEDIUM */,
      message: `Configuration error${setting ? ` in ${setting}` : ""}`,
      userMessage: "Invalid configuration detected",
      suggestedActions: [
        "Check your extension settings",
        "Verify IP address and port format",
        "Reset to default values if needed"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (error.message.includes("IP address")) {
      errorInfo.userMessage = "Invalid IP address format";
      errorInfo.suggestedActions = [
        "Use format: 192.168.1.100 or localhost",
        "Check your device's IP address in settings",
        "Ensure device is on the same network"
      ];
    } else if (error.message.includes("port")) {
      errorInfo.userMessage = "Invalid port number";
      errorInfo.suggestedActions = [
        "Use a port number between 1 and 65535",
        "Common ADB ports: 5555, 5037",
        "Check your device's wireless debugging port"
      ];
    } else if (error.message.includes("binary") || error.message.includes("path")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.userMessage = "Binary path configuration error";
      errorInfo.suggestedActions = [
        "Check if custom binary paths exist",
        "Verify file permissions",
        "Reset to use bundled binaries"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle connection-related errors
   * Requirement 8.5: Handle offline devices and network issues
   */
  handleConnectionError(error, context) {
    const target = context ? `${context.ip}:${context.port}` : "device";
    const errorInfo = {
      category: "connection" /* CONNECTION */,
      severity: "high" /* HIGH */,
      message: `Connection failed to ${target}`,
      userMessage: "Failed to connect to Android device",
      suggestedActions: [
        "Check device IP address and port",
        "Ensure device is on the same network",
        "Enable wireless debugging on device",
        "Try connecting via USB first"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes("connection refused")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device refused connection";
      errorInfo.suggestedActions = [
        "Enable wireless debugging on your device",
        "Check if the port is correct",
        "Restart ADB on your device",
        "Try pairing the device first"
      ];
    } else if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
      errorInfo.severity = "medium" /* MEDIUM */;
      errorInfo.userMessage = "Connection timeout";
      errorInfo.suggestedActions = [
        "Check network connectivity",
        "Move device closer to router",
        "Restart wireless debugging",
        "Try a different network"
      ];
    } else if (errorMessage.includes("no route to host")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device not reachable";
      errorInfo.suggestedActions = [
        "Verify the IP address is correct",
        "Check if device is on the same network",
        "Ping the device to test connectivity",
        "Check firewall settings"
      ];
    } else if (errorMessage.includes("unauthorized")) {
      errorInfo.severity = "medium" /* MEDIUM */;
      errorInfo.userMessage = "Device authorization required";
      errorInfo.suggestedActions = [
        "Accept debugging authorization on device",
        "Check device screen for permission dialog",
        "Try connecting via USB first",
        "Clear ADB keys and reconnect"
      ];
    } else if (errorMessage.includes("offline")) {
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Device is offline";
      errorInfo.suggestedActions = [
        "Check device connection",
        "Restart wireless debugging",
        "Reconnect device to network",
        "Try USB connection"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle process execution errors
   * Requirement 8.6: Handle process failures
   */
  handleProcessError(error, processName, context) {
    const errorInfo = {
      category: "process" /* PROCESS */,
      severity: "high" /* HIGH */,
      message: `${processName} process failed`,
      userMessage: `Failed to execute ${processName}`,
      suggestedActions: [
        "Check if binaries are properly installed",
        "Verify file permissions",
        "Try restarting the extension",
        "Check the logs for more details"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (processName.toLowerCase().includes("adb")) {
      errorInfo.userMessage = "ADB command failed";
      errorInfo.suggestedActions = [
        "Check if ADB is properly installed",
        "Verify device connection",
        "Restart ADB server",
        "Check device authorization"
      ];
    } else if (processName.toLowerCase().includes("scrcpy")) {
      if (error.message.includes("already running")) {
        errorInfo.severity = "medium" /* MEDIUM */;
        errorInfo.userMessage = "Screen mirroring already active";
        errorInfo.suggestedActions = [
          "Stop the current scrcpy instance first",
          "Check for existing scrcpy windows",
          "Wait a moment and try again"
        ];
      } else if (error.message.toLowerCase().includes("device not found")) {
        errorInfo.severity = "high" /* HIGH */;
        errorInfo.userMessage = "No device found for screen mirroring";
        errorInfo.suggestedActions = [
          "Connect to device first",
          "Check device connection status",
          "Enable USB debugging",
          "Try reconnecting the device"
        ];
      } else {
        errorInfo.userMessage = "Screen mirroring failed";
        errorInfo.suggestedActions = [
          "Check if scrcpy is properly installed",
          "Verify device supports screen mirroring",
          "Try connecting device via USB",
          "Check device permissions"
        ];
      }
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle system-level errors
   */
  handleSystemError(error, context) {
    const errorInfo = {
      category: "system" /* SYSTEM */,
      severity: "critical" /* CRITICAL */,
      message: `System error${context ? ` in ${context}` : ""}`,
      userMessage: "System error occurred",
      suggestedActions: [
        "Restart VSCode",
        "Check system resources",
        "Update the extension",
        "Report the issue if it persists"
      ],
      technicalDetails: error.message,
      originalError: error
    };
    if (error.message.toLowerCase().includes("permission")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Permission denied";
      errorInfo.suggestedActions = [
        "Check file permissions",
        "Run VSCode with appropriate permissions",
        "Verify binary executable permissions",
        "Check antivirus software"
      ];
    } else if (error.message.includes("ENOENT") || error.message.includes("not found")) {
      errorInfo.category = "binary" /* BINARY */;
      errorInfo.severity = "high" /* HIGH */;
      errorInfo.userMessage = "Required file not found";
      errorInfo.suggestedActions = [
        "Reinstall the extension",
        "Check if binaries are present",
        "Verify installation integrity",
        "Check custom binary paths"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Handle validation errors
   * Requirement 8.4: Handle invalid inputs
   */
  handleValidationError(field, value, expectedFormat) {
    const errorInfo = {
      category: "validation" /* VALIDATION */,
      severity: "medium" /* MEDIUM */,
      message: `Validation failed for ${field}`,
      userMessage: `Invalid ${field} format`,
      suggestedActions: [
        expectedFormat ? `Use format: ${expectedFormat}` : "Check the input format",
        "Refer to documentation for examples",
        "Use default values if unsure"
      ],
      technicalDetails: `Invalid value: ${value}`
    };
    if (field.toLowerCase().includes("ip")) {
      errorInfo.suggestedActions = [
        "Use format: 192.168.1.100",
        'Use "localhost" for local connections',
        "Check device network settings"
      ];
    } else if (field.toLowerCase().includes("port")) {
      errorInfo.suggestedActions = [
        "Use a number between 1 and 65535",
        "Common ADB port: 5555",
        "Check device wireless debugging settings"
      ];
    }
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Show progress indicator for long-running operations
   * Requirement 8.1: Show appropriate progress indicators
   */
  async showProgress(operation, context, operationId) {
    if (operationId && this.activeProgressOperations.has(operationId)) {
      const existingToken = this.activeProgressOperations.get(operationId);
      existingToken == null ? void 0 : existingToken.cancel();
      this.activeProgressOperations.delete(operationId);
    }
    const tokenSource = new vscode.CancellationTokenSource();
    if (operationId) {
      this.activeProgressOperations.set(operationId, tokenSource);
    }
    try {
      this.logger.info(`Starting progress operation: ${context.title}`);
      const result = await vscode.window.withProgress(
        {
          location: context.location,
          title: context.title,
          cancellable: context.cancellable
        },
        async (progress, token) => {
          if (token.isCancellationRequested || tokenSource.token.isCancellationRequested) {
            throw new Error("Operation cancelled by user");
          }
          return await operation(progress, token);
        }
      );
      this.logger.info(`Progress operation completed: ${context.title}`);
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info(`Progress operation cancelled: ${context.title}`);
        this.showWarning("Operation cancelled by user");
      } else {
        this.logger.error(`Progress operation failed: ${context.title}`, error instanceof Error ? error : void 0);
      }
      throw error;
    } finally {
      if (operationId) {
        this.activeProgressOperations.delete(operationId);
      }
      tokenSource.dispose();
    }
  }
  /**
   * Cancel a specific progress operation
   */
  cancelProgress(operationId) {
    const tokenSource = this.activeProgressOperations.get(operationId);
    if (tokenSource) {
      tokenSource.cancel();
      this.activeProgressOperations.delete(operationId);
      this.logger.info(`Cancelled progress operation: ${operationId}`);
    }
  }
  /**
   * Cancel all active progress operations
   */
  cancelAllProgress() {
    for (const [operationId, tokenSource] of this.activeProgressOperations) {
      tokenSource.cancel();
      this.logger.info(`Cancelled progress operation: ${operationId}`);
    }
    this.activeProgressOperations.clear();
  }
  /**
   * Show success notification with consistent formatting
   * Requirement 8.2: Show success notifications with descriptive messages
   */
  showSuccess(message, details) {
    const fullMessage = details ? `${message} - ${details}` : message;
    this.logger.showSuccess(fullMessage);
  }
  /**
   * Show error notification with user-friendly message and actions
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message, actions) {
    this.logger.showError(message);
    if (actions && actions.length > 0) {
      const actionMessage = `Suggested actions: ${actions.join(", ")}`;
      this.logger.info(actionMessage);
    }
  }
  /**
   * Show warning notification
   */
  showWarning(message) {
    this.logger.showWarning(message);
  }
  /**
   * Show information notification
   */
  showInfo(message) {
    vscode.window.showInformationMessage(message);
    this.logger.info(message);
  }
  /**
   * Show error with action buttons
   */
  async showErrorWithActions(message, actions) {
    const actionTitles = actions.map((a) => a.title);
    const selectedAction = await vscode.window.showErrorMessage(message, ...actionTitles);
    if (selectedAction) {
      const action = actions.find((a) => a.title === selectedAction);
      if (action) {
        try {
          await action.action();
        } catch (error) {
          this.logger.error("Action execution failed", error instanceof Error ? error : void 0);
        }
      }
    }
  }
  /**
   * Validate and handle edge cases for user inputs
   * Requirement 8.4: Handle edge cases like invalid inputs
   */
  validateAndHandleInput(input, type, fieldName) {
    if (!input || input.trim().length === 0) {
      const error = this.handleValidationError(fieldName, input, `Non-empty ${type}`);
      return { isValid: false, error };
    }
    const trimmedInput = input.trim();
    if (type === "ip") {
      if (trimmedInput === "localhost" || trimmedInput === "127.0.0.1") {
        return { isValid: true };
      }
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (!ipRegex.test(trimmedInput)) {
        const error = this.handleValidationError(fieldName, trimmedInput, "192.168.1.100 or localhost");
        return { isValid: false, error };
      }
    } else if (type === "port") {
      const portNum = parseInt(trimmedInput, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        const error = this.handleValidationError(fieldName, trimmedInput, "1-65535");
        return { isValid: false, error };
      }
    }
    return { isValid: true };
  }
  /**
   * Handle multiple errors with categorization
   */
  handleMultipleErrors(errors, context) {
    const errorInfos = [];
    for (const error of errors) {
      let errorInfo;
      if (error.message.includes("Connection failed") || error.message.includes("network")) {
        errorInfo = this.handleConnectionError(error);
      } else if (error.message.includes("Invalid configuration") || error.message.includes("config")) {
        errorInfo = this.handleConfigurationError(error);
      } else if (error.message.includes("Process spawn error") || error.message.includes("spawn")) {
        errorInfo = this.handleSystemError(error, context);
      } else {
        errorInfo = this.handleSystemError(error, context);
      }
      errorInfos.push(errorInfo);
    }
    if (errorInfos.length > 1) {
      const summary = `Multiple errors occurred in ${context}: ${errorInfos.length} issues found`;
      this.showError(summary);
    }
    return errorInfos;
  }
  /**
   * Categorize error based on its message and type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("connection") || message.includes("network") || message.includes("timeout") || message.includes("refused") || message.includes("unreachable") || message.includes("offline") || message.includes("no route to host") || message.includes("timed out")) {
      return "connection" /* CONNECTION */;
    }
    if (message.includes("permission") || message.includes("enoent") || message.includes("eacces") || message.includes("binary") || message.includes("not found") || message.includes("exec format error") || message.includes("operation not permitted")) {
      return "system" /* SYSTEM */;
    }
    if (message.includes("spawn") || message.includes("process") || message.includes("exited") || message.includes("emfile") || message.includes("crashed") || message.includes("memory")) {
      return "process" /* PROCESS */;
    }
    if (message.includes("invalid") || message.includes("format") || message.includes("port out of range") || message.includes("config") || message.includes("setting")) {
      return "configuration" /* CONFIGURATION */;
    }
    return "unknown" /* UNKNOWN */;
  }
  /**
   * Assess error severity based on its impact
   */
  assessSeverity(error) {
    const message = error.message.toLowerCase();
    if (message.includes("spawn enoent") || message.includes("corrupted") || message.includes("memory") || message.includes("exec format error")) {
      return "critical" /* CRITICAL */;
    }
    if (message.includes("process exited") || message.includes("device not found") || message.includes("unauthorized") || message.includes("enoent") || message.includes("no such file") || message.includes("eacces") || message.includes("permission denied")) {
      return "high" /* HIGH */;
    }
    if (message.includes("timeout") || message.includes("timed out") || message.includes("already running") || message.includes("invalid format") || message.includes("network unreachable")) {
      return "medium" /* MEDIUM */;
    }
    return "low" /* LOW */;
  }
  /**
   * Generate user-friendly error message
   */
  getUserFriendlyMessage(error) {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    switch (category) {
      case "connection" /* CONNECTION */:
        if (message.includes("refused")) {
          return "Device refused the connection. Check if wireless debugging is enabled.";
        }
        if (message.includes("timeout")) {
          return "Connection timed out. Check your network connection.";
        }
        if (message.includes("unreachable")) {
          return "Device is not reachable. Verify the IP address.";
        }
        if (message.includes("offline")) {
          return "Device appears to be offline. Check device connection.";
        }
        return "Failed to connect to device. Check network and device settings.";
      case "process" /* PROCESS */:
        if (message.includes("spawn enoent")) {
          return "Required program not found. Check binary installation.";
        }
        if (message.includes("exited")) {
          return "Process stopped unexpectedly. Check device connection.";
        }
        if (message.includes("emfile")) {
          return "Too many files open. Close some applications and try again.";
        }
        if (message.includes("memory")) {
          return "Not enough memory available. Close some applications.";
        }
        return "Process execution failed. Check system resources.";
      case "configuration" /* CONFIGURATION */:
        if (message.includes("ip") || message.includes("address")) {
          return "Invalid IP address format. Use format like 192.168.1.100.";
        }
        if (message.includes("port")) {
          return "Invalid port number. Use a number between 1 and 65535.";
        }
        return "Configuration error. Check your settings.";
      case "system" /* SYSTEM */:
        if (message.includes("permission")) {
          return "Permission denied. Check file permissions or run as administrator.";
        }
        if (message.includes("not found")) {
          return "Required file not found. Reinstall the extension.";
        }
        return "System error occurred. Try restarting the application.";
      default:
        return "An unexpected error occurred. Check the logs for details.";
    }
  }
  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error) {
    const category = this.categorizeError(error);
    const message = error.message.toLowerCase();
    switch (category) {
      case "connection" /* CONNECTION */:
        if (message.includes("refused")) {
          return [
            "Enable wireless debugging on your Android device",
            "Check if the port number is correct",
            "Try pairing the device first",
            "Restart ADB on your device"
          ];
        }
        if (message.includes("timeout")) {
          return [
            "Check your network connection",
            "Move device closer to the router",
            "Try a different network",
            "Restart wireless debugging"
          ];
        }
        return [
          "Verify device IP address and port",
          "Check network connectivity",
          "Enable wireless debugging",
          "Try USB connection first"
        ];
      case "process" /* PROCESS */:
        return [
          "Check if required binaries are installed",
          "Verify file permissions",
          "Restart the application",
          "Check system resources"
        ];
      case "configuration" /* CONFIGURATION */:
        return [
          "Check extension settings",
          "Verify input format",
          "Reset to default values",
          "Refer to documentation"
        ];
      case "system" /* SYSTEM */:
        return [
          "Restart the application",
          "Check file permissions",
          "Reinstall the extension",
          "Contact support if issue persists"
        ];
      default:
        return [
          "Check the logs for more details",
          "Restart the application",
          "Report the issue"
        ];
    }
  }
  /**
   * Handle error with full context and categorization
   */
  handleError(error, context) {
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error);
    const userMessage = this.getUserFriendlyMessage(error);
    const suggestedActions = this.getRecoverySuggestions(error);
    const errorInfo = {
      category,
      severity,
      message: context ? `${context}: ${error.message}` : error.message,
      userMessage,
      suggestedActions,
      technicalDetails: error.stack || error.message,
      originalError: error
    };
    this.trackError(error);
    this.logAndNotifyError(errorInfo);
    return errorInfo;
  }
  /**
   * Track error for statistics and pattern analysis
   */
  trackError(error) {
    const category = this.categorizeError(error);
    const currentCount = this.errorStats.get(category) || 0;
    this.errorStats.set(category, currentCount + 1);
  }
  /**
   * Configure error handler behavior
   */
  configure(options) {
    if (options.showNotifications !== void 0) {
      this.config.showNotifications = options.showNotifications;
    }
    if (options.logLevel !== void 0) {
      this.config.logLevel = options.logLevel;
    }
  }
  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics() {
    const stats = {};
    Object.values(ErrorCategory).forEach((category) => {
      stats[category] = this.errorStats.get(category) || 0;
    });
    return stats;
  }
  /**
   * Log error and show appropriate user notification
   */
  logAndNotifyError(errorInfo) {
    this.logger.error(
      `[${errorInfo.category.toUpperCase()}] ${errorInfo.message}`,
      errorInfo.originalError
    );
    if (!this.config.showNotifications) {
      return;
    }
    switch (errorInfo.severity) {
      case "critical" /* CRITICAL */:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case "high" /* HIGH */:
        this.showError(errorInfo.userMessage, errorInfo.suggestedActions);
        break;
      case "medium" /* MEDIUM */:
        this.showWarning(errorInfo.userMessage);
        break;
      case "low" /* LOW */:
        this.showInfo(errorInfo.userMessage);
        break;
    }
  }
  /**
   * Get error statistics (alias for getErrorStatistics)
   */
  getErrorStats() {
    return this.getErrorStatistics();
  }
  /**
   * Get recurring error patterns
   */
  getRecurringPatterns() {
    const patterns = [];
    return patterns;
  }
  /**
   * Get error summary for debugging
   */
  getErrorSummary() {
    const stats = this.getErrorStatistics();
    const totalErrors = Object.values(stats).reduce((sum, count) => sum + count, 0);
    return {
      totalErrors,
      byCategory: stats,
      recentErrors: []
      // Would contain recent error messages in real implementation
    };
  }
  /**
   * Get current configuration
   */
  getConfiguration() {
    return { ...this.config };
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.cancelAllProgress();
  }
};
__name(_ErrorHandler, "ErrorHandler");
var ErrorHandler = _ErrorHandler;

// src/managers/commandManager.ts
var vscode2 = __toESM(require("vscode"));
var import_qrcode = __toESM(require_lib());
var _CommandManager = class _CommandManager {
  processManager;
  configManager;
  logger;
  binaryManager;
  errorHandler;
  sidebarProvider;
  // Will be properly typed when sidebar provider is available
  statusUpdateInterval;
  constructor(processManager2, configManager2, logger2, binaryManager2, sidebarProvider2) {
    this.processManager = processManager2;
    this.configManager = configManager2;
    this.logger = logger2;
    this.binaryManager = binaryManager2;
    this.errorHandler = new ErrorHandler(logger2);
    this.sidebarProvider = sidebarProvider2;
    if (this.sidebarProvider) {
      this.startStatusUpdates();
    }
  }
  /**
   * Register all DroidBridge commands with VSCode
   * Requirement 4.6: Register all commands with VSCode
   */
  registerCommands(context) {
    const commands3 = [
      // Requirement 4.1: Connect to Device command
      vscode2.commands.registerCommand("droidbridge.connectDevice", (ip, port) => this.connectDeviceCommand(ip, port)),
      // Requirement 4.2: Disconnect Device command
      vscode2.commands.registerCommand("droidbridge.disconnectDevice", () => this.disconnectDeviceCommand()),
      // Requirement 4.3: Launch Scrcpy command
      vscode2.commands.registerCommand("droidbridge.launchScrcpy", () => this.launchScrcpyCommand()),
      // Launch Scrcpy Screen Off command (additional functionality)
      vscode2.commands.registerCommand("droidbridge.launchScrcpyScreenOff", () => this.launchScrcpyScreenOffCommand()),
      // Requirement 4.4: Stop Scrcpy command
      vscode2.commands.registerCommand("droidbridge.stopScrcpy", () => this.stopScrcpyCommand()),
      // Requirement 4.5: Show Logs command
      vscode2.commands.registerCommand("droidbridge.showLogs", () => this.showLogsCommand()),
      // Binary management commands
      vscode2.commands.registerCommand("droidbridge.checkBinaries", () => this.checkBinariesCommand()),
      vscode2.commands.registerCommand("droidbridge.downloadBinaries", () => this.downloadBinariesCommand()),
      vscode2.commands.registerCommand("droidbridge.refreshBinaries", () => this.refreshBinariesCommand()),
      // Pairing support
      vscode2.commands.registerCommand("droidbridge.pairDevice", (hostPort, code) => this.pairDeviceCommand(hostPort, code)),
      vscode2.commands.registerCommand("droidbridge.pairFromQr", (payload) => this.pairFromQrCommand(payload)),
      vscode2.commands.registerCommand("droidbridge.generatePairingQr", () => this.generatePairingQrCommand()),
      vscode2.commands.registerCommand("droidbridge.cancelPairingQr", () => this.cancelPairingQrCommand())
    ];
    commands3.forEach((command) => context.subscriptions.push(command));
    this.logger.info("All DroidBridge commands registered successfully");
  }
  /**
   * Connect to Android device via ADB
   * Requirement 4.1: Provide "DroidBridge: Connect to Device" command
   */
  async connectDeviceCommand(providedIp, providedPort) {
    try {
      this.logger.info("Connect Device command executed");
      const config = this.configManager.getConfigWithDefaults();
      let ip = providedIp || config.ip;
      let port = providedPort || config.port;
      if (!providedIp || !providedPort) {
        const inputIp = await vscode2.window.showInputBox({
          prompt: "Enter the IP address of your Android device",
          value: ip,
          validateInput: /* @__PURE__ */ __name((value) => {
            if (!value.trim()) {
              return "IP address cannot be empty";
            }
            if (!this.configManager.validateIpAddress(value.trim())) {
              return "Please enter a valid IP address (e.g., 192.168.1.100 or localhost)";
            }
            return null;
          }, "validateInput")
        });
        if (inputIp === void 0) {
          this.logger.info("Connect Device command cancelled by user");
          return;
        }
        ip = inputIp.trim();
        const inputPort = await vscode2.window.showInputBox({
          prompt: "Enter the port number for ADB connection",
          value: port,
          validateInput: /* @__PURE__ */ __name((value) => {
            if (!value.trim()) {
              return "Port cannot be empty";
            }
            if (!this.configManager.validatePort(value.trim())) {
              return "Please enter a valid port number (1-65535)";
            }
            return null;
          }, "validateInput")
        });
        if (inputPort === void 0) {
          this.logger.info("Connect Device command cancelled by user");
          return;
        }
        port = inputPort.trim();
      }
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, "ip", "IP address");
      if (!ipValidation.isValid) {
        return;
      }
      const portValidation = this.errorHandler.validateAndHandleInput(port, "port", "Port number");
      if (!portValidation.isValid) {
        return;
      }
      const progressContext = {
        title: `\u{1F50C} Connecting to ${ip}:${port}...`,
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Connection cancelled by user");
          }
          progress.report({ message: "Establishing connection..." });
          const success = await this.connectDevice(ip, port);
          if (success) {
            progress.report({ message: "Connected successfully", increment: 100 });
            this.logger.showSuccess(`\u2705 Device connected to ${ip}:${port}`);
          }
          return success;
        },
        progressContext,
        "connect-device"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Connect Device command cancelled by user");
        return;
      }
      this.logger.error("Failed to execute Connect Device command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Connect Device command");
    }
  }
  /**
   * Disconnect from Android device
   * Requirement 4.2: Provide "DroidBridge: Disconnect Device" command
   */
  async disconnectDeviceCommand() {
    try {
      this.logger.info("Disconnect Device command executed");
      if (!this.processManager.isDeviceConnected()) {
        this.logger.showWarning("No device is currently connected");
        return;
      }
      const connectionState = this.processManager.getConnectionState();
      const target = connectionState.deviceIp && connectionState.devicePort ? `${connectionState.deviceIp}:${connectionState.devicePort}` : "device";
      const progressContext = {
        title: `\u{1F50C} Disconnecting from ${target}...`,
        cancellable: false,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: "Disconnecting device..." });
          const success = await this.disconnectDevice();
          if (success) {
            progress.report({ message: "Disconnected successfully", increment: 100 });
            this.logger.showSuccess(`\u2705 Device disconnected from ${target}`);
          }
          return success;
        },
        progressContext,
        "disconnect-device"
      );
    } catch (error) {
      this.logger.error("Failed to execute Disconnect Device command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Disconnect Device command");
    }
  }
  /**
   * Launch scrcpy screen mirroring
   * Requirement 4.3: Provide "DroidBridge: Launch Scrcpy" command
   */
  async launchScrcpyCommand() {
    try {
      this.logger.info("Launch Scrcpy command executed");
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return;
      }
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode2.window.showWarningMessage(
          "No device is connected. Would you like to connect to a device first?",
          { title: "Connect Device" },
          { title: "Launch Anyway" }
        );
        if ((shouldConnect == null ? void 0 : shouldConnect.title) === "Connect Device") {
          await this.connectDeviceCommand();
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }
      const progressContext = {
        title: "\u{1F4F1} Launching scrcpy...",
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Scrcpy launch cancelled by user");
          }
          progress.report({ message: "Starting screen mirroring..." });
          const success = await this.launchScrcpy();
          if (success) {
            progress.report({ message: "Screen mirroring started", increment: 100 });
            this.logger.showSuccess("\u2705 Scrcpy launched successfully");
          }
          return success;
        },
        progressContext,
        "launch-scrcpy"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Launch Scrcpy command cancelled by user");
        return;
      }
      this.logger.error("Failed to execute Launch Scrcpy command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Launch Scrcpy command");
    }
  }
  /**
   * Launch scrcpy with screen off functionality
   * Additional command for enhanced functionality
   */
  async launchScrcpyScreenOffCommand() {
    try {
      this.logger.info("Launch Scrcpy Screen Off command executed");
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return;
      }
      if (!this.processManager.isDeviceConnected()) {
        const shouldConnect = await vscode2.window.showWarningMessage(
          "No device is connected. Would you like to connect to a device first?",
          { title: "Connect Device" },
          { title: "Launch Anyway" }
        );
        if ((shouldConnect == null ? void 0 : shouldConnect.title) === "Connect Device") {
          await this.connectDeviceCommand();
          if (!this.processManager.isDeviceConnected()) {
            return;
          }
        }
      }
      const progressContext = {
        title: "\u{1F4F1} Launching scrcpy with screen off...",
        cancellable: true,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress, token) => {
          if (token.isCancellationRequested) {
            throw new Error("Scrcpy screen off launch cancelled by user");
          }
          progress.report({ message: "Starting screen mirroring with screen off..." });
          const success = await this.launchScrcpyScreenOff();
          if (success) {
            progress.report({ message: "Screen mirroring started with screen off", increment: 100 });
            this.logger.showSuccess("\u2705 Scrcpy launched successfully with screen off");
          }
          return success;
        },
        progressContext,
        "launch-scrcpy-screen-off"
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("cancelled")) {
        this.logger.info("Launch Scrcpy Screen Off command cancelled by user");
        return;
      }
      this.logger.error("Failed to execute Launch Scrcpy Screen Off command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Launch Scrcpy Screen Off command");
    }
  }
  /**
   * Stop scrcpy screen mirroring
   * Requirement 4.4: Provide "DroidBridge: Stop Scrcpy" command
   */
  async stopScrcpyCommand() {
    try {
      this.logger.info("Stop Scrcpy command executed");
      if (!this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is not currently running");
        return;
      }
      const progressContext = {
        title: "\u{1F4F1} Stopping scrcpy...",
        cancellable: false,
        location: vscode2.ProgressLocation.Notification
      };
      await this.errorHandler.showProgress(
        async (progress) => {
          progress.report({ message: "Stopping screen mirroring..." });
          const success = await this.stopScrcpy();
          if (success) {
            progress.report({ message: "Screen mirroring stopped", increment: 100 });
            this.logger.showSuccess("\u2705 Scrcpy stopped successfully");
          }
          return success;
        },
        progressContext,
        "stop-scrcpy"
      );
    } catch (error) {
      this.logger.error("Failed to execute Stop Scrcpy command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Stop Scrcpy command");
    }
  }
  /**
   * Show the DroidBridge logs output channel
   * Requirement 4.5: Provide "DroidBridge: Show Logs" command
   */
  showLogsCommand() {
    try {
      this.logger.info("Show Logs command executed");
      this.logger.show();
    } catch (error) {
      this.logger.error("Failed to execute Show Logs command", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to execute Show Logs command");
    }
  }
  /**
   * Connect to device with validation and error handling
   * Internal method used by command and sidebar
   */
  async connectDevice(ip, port) {
    const config = this.configManager.getConfigWithDefaults();
    const targetIp = ip || config.ip;
    const targetPort = port || config.port;
    try {
      const validation = this.configManager.validateConnection(targetIp, targetPort);
      if (!validation.isValid) {
        const errorMessage = `Invalid connection parameters: ${validation.errors.join(", ")}`;
        this.logger.showError(errorMessage);
        return false;
      }
      const success = await this.processManager.connectDevice(targetIp, targetPort);
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const errorMessage = connectionState.connectionError || "Failed to connect to device";
        this.logger.showError(`\u274C ${errorMessage}`);
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(true, targetIp, targetPort);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error("Unknown connection error"),
        { ip: targetIp, port: targetPort }
      );
      return false;
    }
  }
  /**
   * Disconnect from device with error handling
   * Internal method used by command and sidebar
   */
  async disconnectDevice() {
    try {
      const success = await this.processManager.disconnectDevice();
      if (!success) {
        const connectionState = this.processManager.getConnectionState();
        const errorMessage = connectionState.connectionError || "Failed to disconnect from device";
        this.logger.showError(`\u274C ${errorMessage}`);
        if (this.sidebarProvider) {
          this.sidebarProvider.updateConnectionStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateConnectionStatus(false);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleConnectionError(
        error instanceof Error ? error : new Error("Unknown disconnection error")
      );
      return false;
    }
  }
  /**
   * Launch scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async launchScrcpy() {
    try {
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return false;
      }
      const process2 = await this.processManager.launchScrcpy();
      if (!process2 || !process2.pid) {
        const processError = new Error("Failed to launch scrcpy - invalid process");
        this.errorHandler.handleProcessError(processError, "scrcpy");
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy launch error"),
        "scrcpy"
      );
      return false;
    }
  }
  /**
   * Launch scrcpy with screen off functionality
   * Internal method used by command and sidebar
   */
  async launchScrcpyScreenOff() {
    try {
      if (this.processManager.isScrcpyRunning()) {
        this.logger.showWarning("Scrcpy is already running. Stop the current instance first.");
        return false;
      }
      const process2 = await this.processManager.launchScrcpyScreenOff();
      if (!process2 || !process2.pid) {
        const processError = new Error("Failed to launch scrcpy with screen off - invalid process");
        this.errorHandler.handleProcessError(processError, "scrcpy screen off");
        if (this.sidebarProvider) {
          this.sidebarProvider.updateScrcpyStatus(false);
        }
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(true);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy screen off launch error"),
        "scrcpy screen off"
      );
      return false;
    }
  }
  /**
   * Stop scrcpy with error handling
   * Internal method used by command and sidebar
   */
  async stopScrcpy() {
    try {
      const success = await this.processManager.stopScrcpy();
      if (!success) {
        this.logger.showError("\u274C Failed to stop scrcpy");
        return false;
      }
      if (this.sidebarProvider) {
        this.sidebarProvider.updateScrcpyStatus(false);
      }
      return true;
    } catch (error) {
      this.errorHandler.handleProcessError(
        error instanceof Error ? error : new Error("Unknown scrcpy stop error"),
        "scrcpy"
      );
      return false;
    }
  }
  /**
   * Get current connection status for UI updates
   */
  isDeviceConnected() {
    return this.processManager.isDeviceConnected();
  }
  /**
   * Get current scrcpy status for UI updates
   */
  isScrcpyRunning() {
    return this.processManager.isScrcpyRunning();
  }
  /**
   * Get connection state for UI updates
   */
  getConnectionState() {
    return this.processManager.getConnectionState();
  }
  /**
   * Get scrcpy state for UI updates
   */
  getScrcpyState() {
    return this.processManager.getScrcpyState();
  }
  /**
   * Set the sidebar provider for real-time updates
   */
  setSidebarProvider(sidebarProvider2) {
    this.sidebarProvider = sidebarProvider2;
    if (!this.statusUpdateInterval) {
      this.startStatusUpdates();
    }
    this.updateSidebarState();
  }
  /**
   * Start periodic status updates to keep sidebar in sync
   */
  startStatusUpdates() {
    if (this.statusUpdateInterval) {
      return;
    }
    this.statusUpdateInterval = setInterval(() => {
      this.updateSidebarState();
    }, 2e3);
  }
  /**
   * Stop periodic status updates
   */
  stopStatusUpdates() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = void 0;
    }
  }
  /**
   * Update sidebar state with current process states
   */
  updateSidebarState() {
    if (!this.sidebarProvider) {
      return;
    }
    try {
      const connectionState = this.processManager.getConnectionState();
      const scrcpyState = this.processManager.getScrcpyState();
      this.sidebarProvider.synchronizeState(connectionState, scrcpyState);
    } catch (error) {
      this.logger.error("Failed to update sidebar state", error instanceof Error ? error : void 0);
    }
  }
  /**
   * Force immediate sidebar state update
   */
  refreshSidebarState() {
    this.updateSidebarState();
  }
  /**
   * Check binary status and show information
   */
  async checkBinariesCommand() {
    try {
      this.logger.info("Check Binaries command executed");
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Checking binary status...",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Detecting installed binaries..." });
        const detectionStatus = await this.binaryManager.getDetectionStatus();
        const binaryInfo = await this.binaryManager.getBinaryInfo();
        const downloadInfo = await this.binaryManager.needsDownload();
        progress.report({ message: "Analysis complete", increment: 100 });
        const statusLines = [];
        statusLines.push("=== DroidBridge Binary Status ===\n");
        const adbStatus = detectionStatus.get("adb");
        statusLines.push(`ADB: ${(adbStatus == null ? void 0 : adbStatus.found) ? "\u2705 Found" : "\u274C Not Found"}`);
        if (adbStatus == null ? void 0 : adbStatus.found) {
          statusLines.push(`  Path: ${adbStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(adbStatus.source)}`);
          if (adbStatus.version) {
            statusLines.push(`  Version: ${adbStatus.version}`);
          }
        }
        const scrcpyStatus = detectionStatus.get("scrcpy");
        statusLines.push(`
Scrcpy: ${(scrcpyStatus == null ? void 0 : scrcpyStatus.found) ? "\u2705 Found" : "\u274C Not Found"}`);
        if (scrcpyStatus == null ? void 0 : scrcpyStatus.found) {
          statusLines.push(`  Path: ${scrcpyStatus.path}`);
          statusLines.push(`  Source: ${this.getSourceDescription(scrcpyStatus.source)}`);
          if (scrcpyStatus.version) {
            statusLines.push(`  Version: ${scrcpyStatus.version}`);
          }
        }
        if (downloadInfo.needed) {
          statusLines.push(`
\u26A0\uFE0F  Missing binaries: ${downloadInfo.binaries.join(", ")}`);
          statusLines.push('Use "DroidBridge: Download Binaries" to download missing binaries.');
        } else {
          statusLines.push("\n\u2705 All required binaries are available");
        }
        const statusReport = statusLines.join("\n");
        this.logger.info("Binary status check completed");
        this.logger.info(statusReport);
        const action = downloadInfo.needed ? "Download Missing" : "Show Logs";
        const selection = await vscode2.window.showInformationMessage(
          downloadInfo.needed ? `Missing binaries: ${downloadInfo.binaries.join(", ")}. Download them now?` : "All binaries are available. Check logs for details.",
          action,
          "Show Logs"
        );
        if (selection === "Download Missing") {
          await this.downloadBinariesCommand();
        } else if (selection === "Show Logs") {
          this.logger.show();
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown binary check error"),
        "Check Binaries command"
      );
    }
  }
  /**
   * Download missing binaries
   */
  async downloadBinariesCommand() {
    try {
      this.logger.info("Download Binaries command executed");
      const downloadInfo = await this.binaryManager.needsDownload();
      if (!downloadInfo.needed) {
        vscode2.window.showInformationMessage("All required binaries are already available.");
        return;
      }
      const proceed = await vscode2.window.showWarningMessage(
        `This will download missing binaries: ${downloadInfo.binaries.join(", ")}. Continue?`,
        { modal: true },
        "Download",
        "Cancel"
      );
      if (proceed !== "Download") {
        this.logger.info("Download Binaries command cancelled by user");
        return;
      }
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Downloading binaries...",
        cancellable: false
      }, async (progress) => {
        this.binaryManager.setDownloadProgressCallback((downloadProgress) => {
          progress.report({
            message: `Downloading ${downloadProgress.binary}: ${downloadProgress.percentage}%`,
            increment: downloadProgress.percentage / downloadInfo.binaries.length
          });
        });
        const result = await this.binaryManager.ensureBinariesAvailable();
        if (result.success) {
          progress.report({ message: "Download completed successfully", increment: 100 });
          this.errorHandler.showSuccess("All binaries downloaded successfully");
          if (this.sidebarProvider) {
            this.sidebarProvider.refresh();
          }
        } else {
          throw new Error(`Download failed: ${result.errors.join(", ")}`);
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown download error"),
        "Download Binaries command"
      );
    }
  }
  /**
   * Refresh binary detection (clear cache and re-detect)
   */
  async refreshBinariesCommand() {
    try {
      this.logger.info("Refresh Binaries command executed");
      await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Refreshing binary detection...",
        cancellable: false
      }, async (progress) => {
        progress.report({ message: "Clearing detection cache..." });
        await this.binaryManager.refreshDetection();
        progress.report({ message: "Re-detecting binaries...", increment: 50 });
        const detectionStatus = await this.binaryManager.getDetectionStatus();
        progress.report({ message: "Detection refreshed", increment: 100 });
        const foundBinaries = Array.from(detectionStatus.entries()).filter(([_, status]) => status.found).map(([name, _]) => name);
        this.errorHandler.showSuccess(
          foundBinaries.length > 0 ? `Binary detection refreshed. Found: ${foundBinaries.join(", ")}` : "Binary detection refreshed. No binaries found."
        );
        if (this.sidebarProvider) {
          this.sidebarProvider.refresh();
        }
      });
    } catch (error) {
      this.errorHandler.handleSystemError(
        error instanceof Error ? error : new Error("Unknown refresh error"),
        "Refresh Binaries command"
      );
    }
  }
  /**
   * Get user-friendly description for binary source
   */
  getSourceDescription(source) {
    switch (source) {
      case "system":
        return "System PATH";
      case "bundled":
        return "Bundled with extension";
      case "downloaded":
        return "Downloaded by extension";
      case "custom":
        return "Custom path (user configured)";
      case "not-found":
        return "Not found";
      default:
        return source;
    }
  }
  /** Pair device via host:port + 6-digit code */
  async pairDeviceCommand(hostPortArg, codeArg) {
    try {
      let hostPort = hostPortArg;
      let code = codeArg;
      if (!hostPort) {
        hostPort = await vscode2.window.showInputBox({
          prompt: "Enter pairing host:port (e.g. 192.168.1.50:37123)",
          validateInput: /* @__PURE__ */ __name((v) => /.+:\d+/.test(v.trim()) ? null : "Format must be host:port", "validateInput")
        }) || void 0;
      }
      if (!hostPort) {
        return;
      }
      if (!code) {
        code = await vscode2.window.showInputBox({
          prompt: "Enter 6-digit pairing code",
          validateInput: /* @__PURE__ */ __name((v) => /^\d{6}$/.test(v.trim()) ? null : "Must be 6 digits", "validateInput")
        }) || void 0;
      }
      if (!code) {
        return;
      }
      const [host, port] = hostPort.trim().split(":");
      const result = await this.processManager.pairDevice(code.trim(), host, port);
      if (result.success) {
        vscode2.window.showInformationMessage(result.message);
        this.logger.info(result.message);
        vscode2.window.withProgress(
          { location: vscode2.ProgressLocation.Notification, title: "Attempting auto-connection..." },
          async () => {
            const autoConnectResult = await this.processManager.tryAutoConnectAfterPairing(host);
            if (autoConnectResult.success) {
              vscode2.window.showInformationMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection successful: ${autoConnectResult.message}`);
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort(autoConnectResult.connectedPort || "5555");
              }
            } else {
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(host);
                this.sidebarProvider.updatePort("5555");
              }
              vscode2.window.showWarningMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection failed, manual connection needed: ${autoConnectResult.message}`);
            }
          }
        );
      } else {
        const errorMessage = `\u274C Pairing failed: ${result.message}`;
        vscode2.window.showErrorMessage(errorMessage);
        this.logger.error(errorMessage);
      }
    } catch (e) {
      this.logger.error("Pairing command failed", e);
      vscode2.window.showErrorMessage("Pairing failed. See logs.");
    }
  }
  /** Pair using pasted QR payload host:port:code */
  async pairFromQrCommand(payloadArg) {
    var _a2, _b2;
    try {
      let payload = payloadArg;
      if (!payload) {
        payload = await vscode2.window.showInputBox({
          prompt: "Paste QR payload (host:port:code or host:port code)",
          validateInput: /* @__PURE__ */ __name((v) => v.trim() ? null : "Required", "validateInput")
        }) || void 0;
      }
      if (!payload) {
        return;
      }
      const parsed = (_b2 = (_a2 = this.processManager).parseQrPairingPayload) == null ? void 0 : _b2.call(_a2, payload);
      if (!parsed) {
        vscode2.window.showErrorMessage("Could not parse payload. Expected host:port:code");
        return;
      }
      const result = await this.processManager.pairDevice(parsed.code, parsed.host, parsed.port);
      if (result.success) {
        vscode2.window.showInformationMessage(result.message);
        this.logger.info(result.message);
        if (parsed.adbPort && parsed.deviceIp) {
          const autoConnect = await vscode2.window.showInformationMessage("Attempt to connect to device after pairing?", "Connect", "Skip");
          if (autoConnect === "Connect") {
            await this.connectDevice(parsed.deviceIp, parsed.adbPort);
            return;
          }
        }
        vscode2.window.withProgress(
          { location: vscode2.ProgressLocation.Notification, title: "Attempting auto-connection..." },
          async () => {
            const autoConnectResult = await this.processManager.tryAutoConnectAfterPairing(parsed.host);
            if (autoConnectResult.success) {
              vscode2.window.showInformationMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection successful: ${autoConnectResult.message}`);
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(parsed.host);
                this.sidebarProvider.updatePort(autoConnectResult.connectedPort || "5555");
              }
            } else {
              if (this.sidebarProvider) {
                this.sidebarProvider.updateIpAddress(parsed.host);
                this.sidebarProvider.updatePort("5555");
              }
              vscode2.window.showWarningMessage(autoConnectResult.message);
              this.logger.info(`Auto-connection failed, manual connection needed: ${autoConnectResult.message}`);
            }
          }
        );
      } else {
        const errorMessage = `\u274C QR Pairing failed: ${result.message}`;
        vscode2.window.showErrorMessage(errorMessage);
        this.logger.error(errorMessage);
      }
    } catch (e) {
      this.logger.error("QR pairing command failed", e);
      vscode2.window.showErrorMessage("QR pairing failed. See logs.");
    }
  }
  /** Begin QR pairing session and surface QR code in sidebar */
  async generatePairingQrCommand() {
    var _a2, _b2, _c, _d, _e, _f, _g, _h, _i;
    try {
      if (this.processManager.isQrPairingSessionActive()) {
        const choice = await vscode2.window.showWarningMessage(
          "A wireless pairing QR session is already active.",
          "Show Existing QR",
          "Cancel Session"
        );
        if (choice === "Cancel Session") {
          await this.cancelPairingQrCommand();
        } else if (choice === "Show Existing QR") {
          (_b2 = (_a2 = this.sidebarProvider) == null ? void 0 : _a2.revealQrPairing) == null ? void 0 : _b2.call(_a2);
        }
        return;
      }
      const session = await vscode2.window.withProgress({
        location: vscode2.ProgressLocation.Notification,
        title: "Starting wireless pairing session..."
      }, async () => this.processManager.startQrPairingSession());
      if (!session.success || !session.payload) {
        const message = session.message || "Failed to start wireless pairing session. See logs for details.";
        this.logger.showError(message);
        (_d = (_c = this.sidebarProvider) == null ? void 0 : _c.showQrPairing) == null ? void 0 : _d.call(_c, { active: false, message });
        return;
      }
      const dataUrl = await import_qrcode.default.toDataURL(session.payload, { margin: 1, scale: 8 });
      (_f = (_e = this.sidebarProvider) == null ? void 0 : _e.revealQrPairing) == null ? void 0 : _f.call(_e);
      (_h = (_g = this.sidebarProvider) == null ? void 0 : _g.showQrPairing) == null ? void 0 : _h.call(_g, {
        active: true,
        dataUrl,
        payload: session.payload,
        host: session.host,
        port: session.port,
        code: session.code,
        ssid: session.ssid,
        expiresInSeconds: session.expiresInSeconds,
        message: session.message
      });
      const pairingWindow = session.expiresInSeconds ? `${session.expiresInSeconds} seconds` : "about 60 seconds";
      const instructions = ((_i = session.message) == null ? void 0 : _i.includes("example")) ? `\u26A0\uFE0F QR generated with example values. On your Android device:
        1. Go to Developer Options \u2192 Wireless debugging
        2. Tap "Pair device with pairing code" 
        3. Replace the QR values: Host=${session.host}, Port=${session.port}, Code=${session.code}
        4. Use manual pairing with those actual values, or update the QR and scan it.` : `Wireless pairing session ready. On Android 11+ go to Developer Options \u2192 Wireless debugging \u2192 Pair device with QR code and scan the QR. Session expires in ${pairingWindow}.`;
      vscode2.window.showInformationMessage(instructions);
      const process2 = session.process;
      if (process2) {
        process2.once("close", () => {
          var _a3, _b3;
          (_b3 = (_a3 = this.sidebarProvider) == null ? void 0 : _a3.showQrPairing) == null ? void 0 : _b3.call(_a3, {
            active: false,
            message: "QR pairing session ended. If pairing did not complete, start a new session.",
            dataUrl: void 0,
            payload: void 0,
            host: session.host,
            port: session.port,
            code: session.code
          });
        });
      }
    } catch (error) {
      this.logger.error("Failed to generate wireless pairing QR", error instanceof Error ? error : void 0);
      this.logger.showError("Failed to generate wireless pairing QR. See logs for details.");
    }
  }
  /** Cancel any running QR pairing session */
  async cancelPairingQrCommand() {
    var _a2, _b2;
    try {
      await this.processManager.stopQrPairingSession();
      (_b2 = (_a2 = this.sidebarProvider) == null ? void 0 : _a2.showQrPairing) == null ? void 0 : _b2.call(_a2, {
        active: false,
        message: "QR pairing session cancelled. Start a new session when you are ready.",
        dataUrl: void 0,
        payload: void 0
      });
      vscode2.window.showInformationMessage("Wireless pairing QR session cancelled.");
    } catch (error) {
      this.logger.error("Failed to cancel wireless pairing QR session", error instanceof Error ? error : void 0);
      this.logger.showError("Could not cancel wireless pairing session. See logs for details.");
    }
  }
  /**
   * Clean up resources
   */
  dispose() {
    this.stopStatusUpdates();
    this.errorHandler.dispose();
  }
};
__name(_CommandManager, "CommandManager");
var CommandManager = _CommandManager;

// src/utils/platformUtils.ts
var os = __toESM(require("os"));
var path = __toESM(require("path"));
var _PlatformUtils = class _PlatformUtils {
  /**
   * Get the binary file extension for the current platform
   */
  static getBinaryExtension() {
    return os.platform() === "win32" ? ".exe" : "";
  }
  /**
   * Get the binary path with platform-appropriate extension
   */
  static getBinaryPath(name) {
    return `${name}${this.getBinaryExtension()}`;
  }
  /**
   * Make a file executable (Unix systems only)
   */
  static async makeExecutable(filePath) {
    if (os.platform() !== "win32") {
      const fs4 = await import("fs/promises");
      try {
        const stats = await fs4.stat(filePath);
        const currentMode = stats.mode;
        const executableMode = currentMode | 73;
        if (currentMode !== executableMode) {
          await fs4.chmod(filePath, executableMode);
        }
      } catch (error) {
        throw new Error(`Failed to make ${filePath} executable: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  /**
   * Check if a file has executable permissions (Unix systems only)
   */
  static async isExecutable(filePath) {
    if (os.platform() === "win32") {
      const fs5 = await import("fs/promises");
      try {
        await fs5.access(filePath);
        return true;
      } catch {
        return false;
      }
    }
    const fs4 = await import("fs/promises");
    try {
      await fs4.access(filePath, fs4.constants.F_OK | fs4.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get platform-specific spawn options for process execution
   */
  static getPlatformSpecificOptions(options = {}) {
    const baseOptions = {
      stdio: ["pipe", "pipe", "pipe"],
      ...options
    };
    const platform2 = os.platform();
    switch (platform2) {
      case "win32":
        return {
          ...baseOptions,
          shell: true,
          windowsHide: true,
          // Ensure proper handling of Windows paths
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      case "darwin":
        return {
          ...baseOptions,
          // macOS specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      case "linux":
        return {
          ...baseOptions,
          // Linux specific options
          env: {
            ...process.env,
            ...baseOptions.env
          }
        };
      default:
        return baseOptions;
    }
  }
  /**
   * Get the current platform identifier
   */
  static getCurrentPlatform() {
    const platform2 = os.platform();
    switch (platform2) {
      case "win32":
        return "win32";
      case "darwin":
        return "darwin";
      case "linux":
        return "linux";
      default:
        throw new Error(`Unsupported platform: ${platform2}`);
    }
  }
  /**
   * Get platform-specific architecture identifier
   */
  static getCurrentArchitecture() {
    const arch2 = os.arch();
    switch (arch2) {
      case "x64":
        return "x64";
      case "arm64":
        return "arm64";
      case "ia32":
        return "x86";
      default:
        return arch2;
    }
  }
  /**
   * Get platform-specific binary directory name
   */
  static getPlatformBinaryDir() {
    const platform2 = this.getCurrentPlatform();
    const arch2 = this.getCurrentArchitecture();
    return platform2;
  }
  /**
   * Normalize file paths for the current platform
   */
  static normalizePath(filePath) {
    return path.normalize(filePath);
  }
  /**
   * Check if the current platform supports a specific feature
   */
  static supportsFeature(feature) {
    const platform2 = os.platform();
    switch (feature) {
      case "executable-permissions":
        return platform2 !== "win32";
      case "shell-execution":
        return true;
      // All platforms support shell execution
      case "process-signals":
        return platform2 !== "win32";
      // Windows has limited signal support
      default:
        return false;
    }
  }
  /**
   * Get platform-specific process termination signal
   */
  static getTerminationSignal() {
    return os.platform() === "win32" ? "SIGTERM" : "SIGTERM";
  }
  /**
   * Get platform-specific force kill signal
   */
  static getForceKillSignal() {
    return os.platform() === "win32" ? "SIGKILL" : "SIGKILL";
  }
  /**
   * Get platform-specific temporary directory
   */
  static getTempDir() {
    return os.tmpdir();
  }
  /**
   * Check if running on a supported platform
   */
  static isSupportedPlatform() {
    try {
      this.getCurrentPlatform();
      return true;
    } catch {
      return false;
    }
  }
};
__name(_PlatformUtils, "PlatformUtils");
var PlatformUtils = _PlatformUtils;

// src/managers/processManager.ts
var import_child_process2 = require("child_process");
var _ProcessManager = class _ProcessManager {
  scrcpyProcess = null;
  managedProcesses = /* @__PURE__ */ new Set();
  binaryManager;
  logger;
  errorHandler;
  connectionState;
  scrcpyState;
  qrPairingProcess = null;
  qrPairingTimeout;
  constructor(binaryManager2, logger2) {
    this.binaryManager = binaryManager2;
    this.logger = logger2;
    this.errorHandler = new ErrorHandler(logger2);
    this.connectionState = {
      connected: false
    };
    this.scrcpyState = {
      running: false
    };
  }
  /**
   * Execute an ADB command with the given arguments
   */
  async executeAdbCommand(args) {
    var _a2, _b2, _c, _d;
    let adbPath;
    try {
      adbPath = await this.binaryManager.getAdbPath();
    } catch (error) {
      adbPath = ((_b2 = (_a2 = this.binaryManager).getAdbPathSync) == null ? void 0 : _b2.call(_a2)) || ((_d = (_c = this.binaryManager).getBundledBinaryPath) == null ? void 0 : _d.call(_c, "adb")) || "adb";
    }
    return new Promise((resolve) => {
      var _a3, _b3;
      let stdout = "";
      let stderr = "";
      this.logger.info(`Executing ADB command: ${adbPath} ${args.join(" ")}`);
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"]
      });
      const process2 = (0, import_child_process2.spawn)(adbPath, args, spawnOptions);
      this.managedProcesses.add(process2);
      (_a3 = process2.stdout) == null ? void 0 : _a3.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        this.logger.logProcessOutput("adb", output);
      });
      (_b3 = process2.stderr) == null ? void 0 : _b3.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        this.logger.logProcessOutput("adb", output);
      });
      process2.on("close", (code) => {
        this.managedProcesses.delete(process2);
        const exitCode = code ?? -1;
        const success = exitCode === 0;
        const result = {
          success,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode
        };
        this.logger.info(`ADB command completed with exit code: ${exitCode}`);
        resolve(result);
      });
      process2.on("error", (error) => {
        this.managedProcesses.delete(process2);
        this.logger.error(`ADB process error: ${error.message}`, error);
        resolve({
          success: false,
          stdout: stdout.trim(),
          stderr: error.message,
          exitCode: -1
        });
      });
    });
  }
  /**
   * Connect to an Android device via ADB using IP and port
   */
  async connectDevice(ip, port) {
    var _a2, _b2;
    try {
      const ipValidation = this.errorHandler.validateAndHandleInput(ip, "ip", "IP address");
      if (!ipValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ((_a2 = ipValidation.error) == null ? void 0 : _a2.userMessage) || "Invalid IP address"
        };
        return false;
      }
      const portValidation = this.errorHandler.validateAndHandleInput(port, "port", "Port number");
      if (!portValidation.isValid) {
        this.connectionState = {
          connected: false,
          connectionError: ((_b2 = portValidation.error) == null ? void 0 : _b2.userMessage) || "Invalid port number"
        };
        return false;
      }
      const target = `${ip}:${port}`;
      this.logger.info(`Attempting to connect to device at ${target}`);
      const result = await this.executeAdbCommand(["connect", target]);
      if (result.success) {
        const isConnected = this.parseConnectResult(result.stdout, target);
        if (isConnected) {
          this.connectionState = {
            connected: true,
            deviceIp: ip,
            devicePort: port,
            lastConnected: /* @__PURE__ */ new Date(),
            connectionError: void 0
          };
          this.logger.info(`Successfully connected to device at ${target}`);
          return true;
        } else {
          const error = this.extractConnectionError(result.stdout, result.stderr);
          this.connectionState = {
            connected: false,
            connectionError: error
          };
          this.logger.error(`Failed to connect to device at ${target}: ${error}`);
          return false;
        }
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        this.logger.error(`ADB connect command failed: ${error}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connection attempt failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Pair with a device over Wi‑Fi (Android 11+ wireless debugging)
   * Expects pairing code (6 digits) and host:port of pairing service (usually shown in device Wireless debugging screen)
   */
  async pairDevice(pairingCode, host, port, attempt = 0) {
    try {
      const code = pairingCode.trim();
      if (!/^[0-9]{6}$/.test(code)) {
        return { success: false, message: "Invalid pairing code. Expected 6 digits." };
      }
      const target = `${host}:${port}`;
      this.logger.info(`Attempting ADB pairing with ${target}`);
      const result = await this.executeAdbCommandWithTimeout(["pair", target, code], 3e4);
      const stdout = result.stdout || "";
      const stderr = result.stderr || "";
      const combined = `${stdout} ${stderr}`.toLowerCase();
      const indicatesSuccess = /successfully paired|pairing code accepted/i.test(stdout);
      const hasProtocolFault = /protocol fault.*couldn't read status message/i.test(stderr);
      const hasSuccessInFault = hasProtocolFault && /success/i.test(stderr);
      const indicatesFailure = /failed|unable|timeout|refused|unreachable|invalid|incorrect/i.test(combined);
      let isProtocolFaultSuccess = false;
      if (hasSuccessInFault && !indicatesFailure && !indicatesSuccess) {
        this.logger.info("Protocol fault with Success detected - verifying pairing status...");
        await new Promise((resolve) => setTimeout(resolve, 2e3));
        const verifyResult = await this.executeAdbCommandWithTimeout(["devices"], 5e3);
        const baseIp = target.split(":")[0];
        const hasDeviceInList = verifyResult.stdout.includes(baseIp) || verifyResult.stdout.includes("device") || verifyResult.stdout.includes("unauthorized");
        this.logger.info(`Pairing verification: devices output contains connection = ${hasDeviceInList}`);
        if (hasDeviceInList) {
          isProtocolFaultSuccess = true;
        } else {
          this.logger.info("No device found in list, attempting connection verification...");
          isProtocolFaultSuccess = await this.tryQuickConnectVerification(baseIp);
          this.logger.info(`Connection verification result: ${isProtocolFaultSuccess}`);
        }
      }
      this.logger.info(`Pairing result - Exit: ${result.exitCode}, Success: ${result.success}`);
      this.logger.info(`Stdout: ${stdout}`);
      this.logger.info(`Stderr: ${stderr}`);
      this.logger.info(`Success detected: ${indicatesSuccess}, Failure detected: ${indicatesFailure}, Protocol fault with success: ${isProtocolFaultSuccess}`);
      if (indicatesSuccess || isProtocolFaultSuccess) {
        this.logger.info(`Successfully paired with ${target}`);
        const baseIp = target.split(":")[0];
        if (isProtocolFaultSuccess && !indicatesSuccess) {
          this.logger.info("Verifying protocol fault pairing by attempting connection...");
          const verifyConnection = await this.tryQuickConnectVerification(baseIp);
          if (!verifyConnection) {
            this.logger.error("Protocol fault pairing verification failed - treating as failure");
            if (attempt < 1) {
              this.logger.info("Restarting ADB server and retrying pairing once more due to protocol fault...");
              await this.restartAdbServer();
              await new Promise((resolve) => setTimeout(resolve, 1500));
              return this.pairDevice(pairingCode, host, port, attempt + 1);
            }
            return {
              success: false,
              message: "Pairing failed - the protocol fault indicates communication was interrupted. The pairing code popup is likely still showing on your device. Please:\n1. Dismiss the current pairing popup\n2. Generate a new pairing code\n3. Try pairing again immediately while the code is fresh\n4. Ensure both devices stay connected to Wi-Fi during pairing"
            };
          }
        }
        const cleanMessage = stdout.split("\n").find((line) => line.includes("Successfully paired")) || (isProtocolFaultSuccess ? `\u2705 Paired successfully! The pairing code popup should have disappeared on your device. Check "Paired devices" for the ADB port, then use the Connect section above.` : `\u2705 Paired successfully! Check your device's "Paired devices" section for the ADB port (usually 5555), then use the Connect section above.`);
        return { success: true, message: cleanMessage };
      }
      let errorMsg = stderr || stdout || "Pairing failed";
      if (combined.includes("timeout") || !stdout && !stderr) {
        errorMsg = "Pairing timed out. The pairing code may have expired. Generate a new pairing code on your device and try again.";
      } else if (combined.includes("refused")) {
        errorMsg = "Connection refused. Make sure Wireless debugging is enabled and the pairing service is running on your device.";
      } else if (combined.includes("unreachable")) {
        errorMsg = "Host unreachable. Verify the IP address and ensure both devices are connected to the same Wi-Fi network.";
      } else if (combined.includes("invalid") || combined.includes("incorrect")) {
        errorMsg = "Invalid pairing code. The 6-digit code may have expired or been mistyped. Generate a fresh code on your device.";
      } else if (hasProtocolFault && hasSuccessInFault) {
        errorMsg = "Pairing communication failed (protocol fault). This happens when the pairing code expires during the handshake or there's a network interruption. The pairing popup should still be visible on your device. Please generate a fresh pairing code and try again.";
        if (attempt < 1) {
          this.logger.info("Protocol fault detected with failure - restarting ADB server and retrying pairing once.");
          await this.restartAdbServer();
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return this.pairDevice(pairingCode, host, port, attempt + 1);
        }
      } else if (hasProtocolFault) {
        errorMsg = "Protocol fault occurred during pairing. This usually means the pairing code expired or there was a network issue. Please generate a new pairing code and try again.";
      }
      this.logger.error(`Pairing failed: ${errorMsg}`);
      return { success: false, message: errorMsg };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error during pairing";
      this.logger.error("Pairing error", e);
      return { success: false, message };
    }
  }
  /**
   * Quick verification to check if pairing actually worked by attempting connection
   */
  async tryQuickConnectVerification(ip) {
    const commonPorts = ["5555", "5556", "37115"];
    for (const port of commonPorts) {
      try {
        const result = await this.executeAdbCommandWithTimeout(["connect", `${ip}:${port}`], 5e3);
        if (result.stdout.includes("connected") || result.stdout.includes("already connected")) {
          await this.executeAdbCommandWithTimeout(["disconnect", `${ip}:${port}`], 3e3);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    return false;
  }
  /**
   * Restart the ADB server to recover from protocol faults
   */
  async restartAdbServer() {
    this.logger.info("Restarting ADB server (kill-server \u2192 start-server)");
    await this.executeAdbCommandWithTimeout(["kill-server"], 5e3).catch(() => void 0);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await this.executeAdbCommandWithTimeout(["start-server"], 5e3).catch(() => void 0);
  }
  /**
   * Attempt to auto-connect after successful pairing using common ADB ports
   */
  async tryAutoConnectAfterPairing(ip) {
    const commonPorts = ["5555", "5556", "37115"];
    this.logger.info(`Attempting auto-connection to ${ip} on common ports...`);
    for (const port of commonPorts) {
      try {
        this.logger.info(`Trying ${ip}:${port}...`);
        const connected = await this.connectDevice(ip, port);
        if (connected) {
          return {
            success: true,
            message: `\u{1F389} Auto-connected to ${ip}:${port}! Device is ready for debugging.`,
            connectedPort: port
          };
        }
      } catch (error) {
        this.logger.debug(`Failed to connect to ${ip}:${port}: ${error}`);
        continue;
      }
    }
    return {
      success: false,
      message: `Could not auto-connect. Please check your device's "Paired devices" section for the correct port and connect manually.`
    };
  }
  /**
   * Execute ADB command with timeout to prevent hanging
   */
  async executeAdbCommandWithTimeout(args, timeoutMs) {
    return new Promise(async (resolve) => {
      let isResolved = false;
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          resolve({
            success: false,
            stdout: "",
            stderr: "Command timed out",
            exitCode: -1
          });
        }
      }, timeoutMs);
      try {
        const result = await this.executeAdbCommand(args);
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      } catch (error) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve({
            success: false,
            stdout: "",
            stderr: error instanceof Error ? error.message : "Unknown error",
            exitCode: -1
          });
        }
      }
    });
  }
  /**
   * Parse a QR payload exported from Android Wireless debugging.
   * Supported forms observed across Android versions:
   * 1. host:pairPort:code
   * 2. host:pairPort code
   * 3. adbpair://host:pairPort?code=XXXXXX&adb_port=YYYY&ipaddr=AAA.BBB.CCC.DDD
   * 4. host:pairPort:code:adbPort  (some OEM / older tooling conventions)
   * 5. WIFIADB:host:pairPort:code:adbPort (rare prefix variants – ignored prefix)
   * Returns pairing service host/port/code and optional device IP + adbPort for auto-connect.
   */
  parseQrPairingPayload(payload) {
    if (!payload) {
      return void 0;
    }
    const trimmed = payload.trim();
    try {
      if (/^adbpair:\/\//i.test(trimmed)) {
        const url = new URL(trimmed);
        const host = url.hostname;
        const port = url.port || "37123";
        const code = url.searchParams.get("code") || "";
        const adbPort = url.searchParams.get("adb_port") || void 0;
        const deviceIp = url.searchParams.get("ipaddr") || void 0;
        if (/^[0-9]{6}$/.test(code) && host && port) {
          return { host, port, code, adbPort, deviceIp };
        }
      }
    } catch {
    }
    const noPrefix = trimmed.replace(/^(?:WIFIADB:)/i, "");
    let m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+):(?<code>\d{6}):(?<adbPort>\d{2,5})$/);
    if (m == null ? void 0 : m.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code, adbPort: m.groups.adbPort };
    }
    m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+):(?<code>\d{6})$/);
    if (m == null ? void 0 : m.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code };
    }
    m = noPrefix.match(/^(?<host>[a-zA-Z0-9_.-]+):(?<pairPort>\d+)\s+(?<code>\d{6})$/);
    if (m == null ? void 0 : m.groups) {
      return { host: m.groups.host, port: m.groups.pairPort, code: m.groups.code };
    }
    return void 0;
  }
  /**
   * Starts a QR pairing session. First tries `adb pair --qr`, but falls back to generating
   * a manual QR if the ADB version doesn't support it or prompts for manual input.
   */
  async startQrPairingSession() {
    var _a2, _b2, _c, _d;
    if (this.qrPairingProcess) {
      return {
        success: false,
        message: "A QR pairing session is already running. Cancel it before starting a new one."
      };
    }
    let adbPath;
    try {
      adbPath = await this.binaryManager.getAdbPath();
    } catch (error) {
      adbPath = ((_b2 = (_a2 = this.binaryManager).getAdbPathSync) == null ? void 0 : _b2.call(_a2)) || ((_d = (_c = this.binaryManager).getBundledBinaryPath) == null ? void 0 : _d.call(_c, "adb")) || "adb";
    }
    const qrResult = await this.tryAdbQrPairing(adbPath);
    if (qrResult.success) {
      return qrResult;
    }
    this.logger.info("ADB QR pairing not supported or failed. Generating manual QR with example values.");
    const fallbackHost = "192.168.1.50";
    const fallbackPort = "37153";
    const fallbackCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const fallbackSsid = "ADB-Pair";
    const payload = `WIFI:T:ADB;S:${fallbackSsid};P:${fallbackCode};IP:${fallbackHost}:${fallbackPort};;`;
    return {
      success: true,
      message: "Generated example QR. Replace host/port/code with actual values from your device's Wireless debugging screen.",
      payload,
      host: fallbackHost,
      port: fallbackPort,
      code: fallbackCode,
      ssid: fallbackSsid,
      expiresInSeconds: 60
    };
  }
  async tryAdbQrPairing(adbPath) {
    return new Promise((resolve) => {
      var _a2, _b2;
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"]
      });
      this.logger.info("Trying QR pairing with `adb pair --qr`");
      const process2 = (0, import_child_process2.spawn)(adbPath, ["pair", "--qr"], spawnOptions);
      this.qrPairingProcess = process2;
      this.managedProcesses.add(process2);
      let resolved = false;
      let stdout = "";
      let stderr = "";
      const finalize = /* @__PURE__ */ __name((result) => {
        if (!resolved) {
          resolved = true;
          this.qrPairingProcess = null;
          this.managedProcesses.delete(process2);
          resolve(result);
        }
      }, "finalize");
      const handleChunk = /* @__PURE__ */ __name((chunk) => {
        stdout += chunk;
        this.logger.logProcessOutput("adb", chunk);
        if (chunk.includes("Enter pairing code") || chunk.includes("Pairing code:")) {
          this.logger.info("ADB is requesting manual pairing code input - QR mode not supported");
          process2.kill(PlatformUtils.getTerminationSignal());
          finalize({ success: false, message: "ADB QR mode not supported by this version" });
          return;
        }
        const parsed = this.extractQrSessionInfo(stdout);
        if (parsed && parsed.payload) {
          finalize({ success: true, process: process2, rawOutput: stdout, ...parsed });
        }
      }, "handleChunk");
      (_a2 = process2.stdout) == null ? void 0 : _a2.on("data", (data) => handleChunk(data.toString()));
      (_b2 = process2.stderr) == null ? void 0 : _b2.on("data", (data) => {
        const text = data.toString();
        stderr += text;
        this.logger.logProcessOutput("adb", text);
        handleChunk(text);
      });
      process2.on("close", (code) => {
        if (!resolved) {
          finalize({
            success: false,
            message: "ADB QR pairing session ended without producing a QR payload",
            rawOutput: stdout || stderr
          });
        }
      });
      process2.on("error", (error) => {
        this.logger.error(`ADB QR pairing error: ${error.message}`, error);
        finalize({ success: false, message: error.message, rawOutput: stdout || stderr });
      });
      setTimeout(() => {
        if (!resolved) {
          this.logger.info("ADB QR pairing timed out - likely not supported");
          process2.kill(PlatformUtils.getTerminationSignal());
          finalize({ success: false, message: "ADB QR pairing timeout - unsupported" });
        }
      }, 5e3);
    });
  }
  /** Cancel any running `adb pair --qr` session */
  async stopQrPairingSession() {
    if (!this.qrPairingProcess) {
      return;
    }
    this.logger.info("Stopping active QR pairing session");
    const process2 = this.qrPairingProcess;
    this.qrPairingProcess = null;
    if (this.qrPairingTimeout) {
      clearTimeout(this.qrPairingTimeout);
      this.qrPairingTimeout = void 0;
    }
    if (process2) {
      this.managedProcesses.delete(process2);
    }
    if (process2 && !process2.killed) {
      const terminationSignal = PlatformUtils.getTerminationSignal();
      process2.kill(terminationSignal);
      setTimeout(() => {
        if (!process2.killed) {
          process2.kill(PlatformUtils.getForceKillSignal());
        }
      }, 2e3);
    }
  }
  /** Indicates if an `adb pair --qr` session is currently running */
  isQrPairingSessionActive() {
    return !!this.qrPairingProcess;
  }
  extractQrSessionInfo(output) {
    if (!output) {
      return void 0;
    }
    const cleaned = output.replace(/\u001b\[[0-9;]*m/g, "");
    const wifiMatch = cleaned.match(/WIFI:[\s\S]*?;;/);
    const codeMatch = cleaned.match(/Pairing code:\s*(\d{6})/i) || cleaned.match(/Code:\s*(\d{6})/i);
    const hostMatch = cleaned.match(/IP (?:Address|addr):\s*([\d.]+)/i) || cleaned.match(/Host:\s*([\d.]+)/i);
    const portMatch = cleaned.match(/Port:\s*(\d{2,5})/i) || cleaned.match(/pairing port:\s*(\d{2,5})/i);
    const ssidMatch = cleaned.match(/SSID:\s*([\w\-]+)/i);
    const expiryMatch = cleaned.match(/Expires in (\d+)s/i);
    let payload = wifiMatch ? wifiMatch[0].replace(/\s+/g, "") : void 0;
    let host;
    let port;
    let code;
    let ssid;
    if (payload) {
      const payloadHost = payload.match(/IP:([^;]+)/);
      const payloadCode = payload.match(/P:(\d{6})/);
      const payloadSsid = payload.match(/S:([^;]+)/);
      if (payloadHost == null ? void 0 : payloadHost[1]) {
        host = payloadHost[1].split(":")[0];
        const portPart = payloadHost[1].split(":")[1];
        if (portPart) {
          port = portPart;
        }
      }
      if (payloadCode == null ? void 0 : payloadCode[1]) {
        code = payloadCode[1];
      }
      if (payloadSsid == null ? void 0 : payloadSsid[1]) {
        ssid = payloadSsid[1];
      }
    }
    if (codeMatch == null ? void 0 : codeMatch[1]) {
      code = codeMatch[1];
    }
    if (hostMatch == null ? void 0 : hostMatch[1]) {
      host = hostMatch[1];
    }
    if (portMatch == null ? void 0 : portMatch[1]) {
      port = portMatch[1];
    }
    if (ssidMatch == null ? void 0 : ssidMatch[1]) {
      ssid = ssidMatch[1];
    }
    if (!payload && host && port && code) {
      payload = `WIFI:T:ADB;S:${ssid || "ADB-Pair"};P:${code};IP:${host}:${port};;`;
    }
    if (!payload) {
      return void 0;
    }
    const expiresInSeconds = (expiryMatch == null ? void 0 : expiryMatch[1]) ? parseInt(expiryMatch[1], 10) : void 0;
    return { payload, host, port, code, ssid, expiresInSeconds };
  }
  /**
   * Disconnect from the currently connected Android device
   */
  async disconnectDevice() {
    try {
      if (!this.connectionState.connected || !this.connectionState.deviceIp || !this.connectionState.devicePort) {
        this.logger.info("No device currently connected");
        return true;
      }
      const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
      this.logger.info(`Attempting to disconnect from device at ${target}`);
      const result = await this.executeAdbCommand(["disconnect", target]);
      if (result.success) {
        this.connectionState = {
          connected: false,
          connectionError: void 0
        };
        this.logger.info(`Successfully disconnected from device at ${target}`);
        return true;
      } else {
        const error = this.extractConnectionError(result.stdout, result.stderr);
        this.logger.error(`Failed to disconnect from device: ${error}`);
        this.connectionState = {
          connected: false,
          connectionError: error
        };
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Disconnect attempt failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Check if a device is currently connected and reachable
   */
  async checkDeviceConnectivity() {
    try {
      this.logger.info("Checking device connectivity");
      const result = await this.executeAdbCommand(["devices"]);
      if (!result.success) {
        this.logger.error("Failed to check device connectivity");
        this.connectionState = {
          ...this.connectionState,
          connected: false,
          connectionError: "Failed to query ADB devices"
        };
        return false;
      }
      const isConnected = this.parseDevicesOutput(result.stdout);
      if (isConnected !== this.connectionState.connected) {
        this.connectionState = {
          ...this.connectionState,
          connected: isConnected,
          connectionError: isConnected ? void 0 : "Device no longer connected"
        };
        this.logger.info(`Device connectivity status updated: ${isConnected ? "connected" : "disconnected"}`);
      }
      return isConnected;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`Connectivity check failed: ${errorMessage}`, error instanceof Error ? error : void 0);
      this.connectionState = {
        ...this.connectionState,
        connected: false,
        connectionError: errorMessage
      };
      return false;
    }
  }
  /**
   * Get the current connection state
   */
  getConnectionState() {
    return { ...this.connectionState };
  }
  /**
   * Check if a device is currently connected
   */
  isDeviceConnected() {
    return this.connectionState.connected;
  }
  /**
   * Launch scrcpy with optional configuration
   */
  async launchScrcpy(options) {
    return this.launchScrcpyWithCustomArgs(options);
  }
  /**
   * Stop the current scrcpy process
   */
  async stopScrcpy() {
    if (!this.scrcpyProcess) {
      this.scrcpyState = {
        running: false
      };
      return true;
    }
    return new Promise((resolve) => {
      const process2 = this.scrcpyProcess;
      this.logger.info("Stopping scrcpy process");
      const cleanup = /* @__PURE__ */ __name(() => {
        this.managedProcesses.delete(process2);
        this.scrcpyProcess = null;
        this.scrcpyState = {
          running: false
        };
        this.logger.info("Scrcpy process stopped successfully");
        resolve(true);
      }, "cleanup");
      const timeout = setTimeout(() => {
        if (process2 && !process2.killed) {
          this.logger.info("Force killing scrcpy process");
          const forceKillSignal = PlatformUtils.getForceKillSignal();
          process2.kill(forceKillSignal);
        }
        cleanup();
      }, 3e3);
      process2.on("close", () => {
        clearTimeout(timeout);
        cleanup();
      });
      if (process2 && !process2.killed) {
        const terminationSignal = PlatformUtils.getTerminationSignal();
        process2.kill(terminationSignal);
      } else {
        clearTimeout(timeout);
        cleanup();
      }
    });
  }
  /**
   * Check if scrcpy is currently running
   */
  isScrcpyRunning() {
    const processRunning = this.scrcpyProcess !== null && !this.scrcpyProcess.killed;
    if (this.scrcpyState.running !== processRunning) {
      this.scrcpyState = {
        ...this.scrcpyState,
        running: processRunning
      };
    }
    return processRunning;
  }
  /**
   * Get the current scrcpy state
   */
  getScrcpyState() {
    this.isScrcpyRunning();
    return { ...this.scrcpyState };
  }
  /**
   * Get scrcpy process uptime in milliseconds
   */
  getScrcpyUptime() {
    if (!this.isScrcpyRunning() || !this.scrcpyState.startTime) {
      return null;
    }
    return Date.now() - this.scrcpyState.startTime.getTime();
  }
  /**
   * Monitor scrcpy process health and update state accordingly
   */
  monitorScrcpyProcess() {
    if (!this.scrcpyProcess) {
      return;
    }
    const process2 = this.scrcpyProcess;
    if (process2.killed || process2.exitCode !== null) {
      this.logger.info("Detected scrcpy process termination during monitoring");
      this.managedProcesses.delete(process2);
      this.scrcpyProcess = null;
      this.scrcpyState = {
        running: false
      };
    }
  }
  /**
   * Clean up all managed processes
   */
  async cleanup() {
    this.logger.info("Cleaning up all managed processes");
    const cleanupPromises = [];
    if (this.isScrcpyRunning()) {
      cleanupPromises.push(this.stopScrcpy().then(() => {
      }));
    }
    for (const process2 of this.managedProcesses) {
      if (!process2.killed) {
        cleanupPromises.push(
          new Promise((resolve) => {
            process2.on("close", () => resolve());
            const terminationSignal = PlatformUtils.getTerminationSignal();
            process2.kill(terminationSignal);
            setTimeout(() => {
              if (!process2.killed) {
                const forceKillSignal = PlatformUtils.getForceKillSignal();
                process2.kill(forceKillSignal);
              }
              resolve();
            }, 2e3);
          })
        );
      }
    }
    await Promise.all(cleanupPromises);
    this.managedProcesses.clear();
    this.scrcpyProcess = null;
    this.scrcpyState = {
      running: false
    };
    this.logger.info("Process cleanup completed");
  }
  /**
   * Validate IP address format
   */
  isValidIpAddress(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }
  /**
   * Validate port number
   */
  isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
  }
  /**
   * Parse the result of ADB connect command to determine if connection was successful
   */
  parseConnectResult(stdout, target) {
    const output = stdout.toLowerCase();
    if (output.includes("connected to") || output.includes("already connected")) {
      return true;
    }
    if (output.includes("failed to connect") || output.includes("cannot connect") || output.includes("connection refused") || output.includes("no route to host") || output.includes("timeout")) {
      return false;
    }
    return false;
  }
  /**
   * Parse ADB devices output to check if our target device is connected
   */
  parseDevicesOutput(stdout) {
    if (!this.connectionState.deviceIp || !this.connectionState.devicePort) {
      return false;
    }
    const target = `${this.connectionState.deviceIp}:${this.connectionState.devicePort}`;
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith(target) && trimmedLine.includes("device")) {
        return true;
      }
    }
    return false;
  }
  /**
   * Extract meaningful error message from ADB command output
   */
  extractConnectionError(stdout, stderr) {
    const output = (stdout + " " + stderr).toLowerCase();
    if (output.includes("connection refused")) {
      return "Connection refused. Make sure the device is reachable and ADB debugging is enabled.";
    }
    if (output.includes("no route to host")) {
      return "No route to host. Check the IP address and network connectivity.";
    }
    if (output.includes("timeout") || output.includes("timed out")) {
      return "Connection timeout. The device may be unreachable or busy.";
    }
    if (output.includes("failed to connect")) {
      return "Failed to connect to device. Verify the IP address and port are correct.";
    }
    if (output.includes("cannot connect")) {
      return "Cannot connect to device. Check if wireless debugging is enabled.";
    }
    if (output.includes("device offline")) {
      return "Device is offline. Try reconnecting the device.";
    }
    if (output.includes("unauthorized")) {
      return "Device unauthorized. Please accept the debugging authorization on your device.";
    }
    const errorOutput = stderr.trim() || stdout.trim();
    return errorOutput || "Unknown connection error occurred.";
  }
  /**
   * Launch scrcpy with screen off functionality
   */
  async launchScrcpyScreenOff(options) {
    const screenOffOptions = {
      ...options
    };
    this.logger.info("Launching scrcpy with screen off functionality");
    return this.launchScrcpyWithCustomArgs(screenOffOptions, ["--turn-screen-off"]);
  }
  /**
   * Launch scrcpy with custom additional arguments
   */
  async launchScrcpyWithCustomArgs(options, additionalArgs = []) {
    var _a2, _b2, _c, _d;
    if (this.isScrcpyRunning()) {
      throw new Error(
        "Scrcpy is already running. Stop the current instance first."
      );
    }
    let scrcpyPath;
    try {
      scrcpyPath = await this.binaryManager.getScrcpyPath();
    } catch (error) {
      scrcpyPath = ((_b2 = (_a2 = this.binaryManager).getScrcpyPathSync) == null ? void 0 : _b2.call(_a2)) || ((_d = (_c = this.binaryManager).getBundledBinaryPath) == null ? void 0 : _d.call(_c, "scrcpy")) || "scrcpy";
    }
    let args = [...this.buildScrcpyArgs(options), ...additionalArgs];
    const deviceArgs = await this.getDeviceSelectionArgs();
    if (deviceArgs.length > 0) {
      args = [...deviceArgs, ...args];
      this.logger.info(`Added device selection: ${deviceArgs.join(" ")}`);
    }
    this.logger.info(`Launching scrcpy: ${scrcpyPath} ${args.join(" ")}`);
    this.scrcpyState = {
      running: false,
      startTime: /* @__PURE__ */ new Date(),
      options: options ? { ...options } : void 0
    };
    return new Promise((resolve, reject) => {
      var _a3, _b3;
      const spawnOptions = PlatformUtils.getPlatformSpecificOptions({
        stdio: ["pipe", "pipe", "pipe"],
        detached: false
      });
      const process2 = (0, import_child_process2.spawn)(scrcpyPath, args, spawnOptions);
      this.scrcpyProcess = process2;
      this.managedProcesses.add(process2);
      let hasResolved = false;
      const onData = /* @__PURE__ */ __name((data) => {
        const output = data.toString();
        this.logger.logProcessOutput("scrcpy", output);
        if (!hasResolved) {
          hasResolved = true;
          this.scrcpyState = {
            running: true,
            process: process2,
            startTime: this.scrcpyState.startTime,
            options: this.scrcpyState.options
          };
          this.logger.info("Scrcpy process started successfully");
          resolve(process2);
        }
      }, "onData");
      (_a3 = process2.stdout) == null ? void 0 : _a3.on("data", onData);
      (_b3 = process2.stderr) == null ? void 0 : _b3.on("data", onData);
      process2.on("close", (code) => {
        this.managedProcesses.delete(process2);
        if (this.scrcpyProcess === process2) {
          this.scrcpyProcess = null;
          this.scrcpyState = {
            running: false
          };
        }
        this.logger.info(`Scrcpy process closed with exit code: ${code}`);
      });
      process2.on("error", (error) => {
        this.managedProcesses.delete(process2);
        if (this.scrcpyProcess === process2) {
          this.scrcpyProcess = null;
          this.scrcpyState = {
            running: false
          };
        }
        this.logger.error(`Scrcpy process error: ${error.message}`, error);
        if (!hasResolved) {
          hasResolved = true;
          reject(error);
        }
      });
      setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.scrcpyState = {
            running: false
          };
          reject(new Error("Scrcpy failed to start within timeout period"));
        }
      }, 5e3);
    });
  }
  /**
   * Get device selection arguments for scrcpy when multiple devices are available
   */
  async getDeviceSelectionArgs() {
    try {
      const result = await this.executeAdbCommand(["devices"]);
      if (!result.success) {
        this.logger.error("Failed to get device list for scrcpy selection");
        return [];
      }
      const devices = this.parseAllDevices(result.stdout);
      if (devices.length <= 1) {
        return [];
      }
      this.logger.info(`Multiple devices found (${devices.length}), selecting device for scrcpy...`);
      const wirelessDevice = devices.find((device) => device.includes(":"));
      if (wirelessDevice) {
        this.logger.info(`Selected wireless device: ${wirelessDevice}`);
        return ["-s", wirelessDevice];
      }
      this.logger.info(`Selected first available device: ${devices[0]}`);
      return ["-s", devices[0]];
    } catch (error) {
      this.logger.error("Failed to get device selection args:", error instanceof Error ? error : new Error(String(error)));
      return [];
    }
  }
  /**
   * Parse all connected devices from ADB devices output
   */
  parseAllDevices(stdout) {
    const devices = [];
    const lines = stdout.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("List of devices") && trimmedLine.includes("	")) {
        const parts = trimmedLine.split("	");
        if (parts.length >= 2 && parts[1].includes("device")) {
          devices.push(parts[0]);
        }
      }
    }
    return devices;
  }
  /**
   * Build command line arguments for scrcpy based on options
   */
  buildScrcpyArgs(options) {
    const args = [];
    if (options == null ? void 0 : options.bitrate) {
      args.push("--bit-rate", options.bitrate.toString());
    }
    if (options == null ? void 0 : options.maxSize) {
      args.push("--max-size", options.maxSize.toString());
    }
    if (options == null ? void 0 : options.crop) {
      args.push("--crop", options.crop);
    }
    if (options == null ? void 0 : options.recordFile) {
      args.push("--record", options.recordFile);
    }
    return args;
  }
};
__name(_ProcessManager, "ProcessManager");
var ProcessManager2 = _ProcessManager;

// src/managers/configManager.ts
var vscode3 = __toESM(require("vscode"));
var _ConfigManager = class _ConfigManager {
  /**
   * Get the default IP address for ADB connections
   */
  getDefaultIp() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const ip = config.get("defaultIp", _ConfigManager.DEFAULT_IP);
    return ip.trim() || _ConfigManager.DEFAULT_IP;
  }
  /**
   * Get the default port for ADB connections
   */
  getDefaultPort() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const port = config.get("defaultPort", _ConfigManager.DEFAULT_PORT);
    return port.trim() || _ConfigManager.DEFAULT_PORT;
  }
  /**
   * Get custom ADB binary path if configured
   */
  getCustomAdbPath() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path5 = config.get("adbPath", "");
    return path5.trim() || void 0;
  }
  /**
   * Get custom scrcpy binary path if configured
   */
  getCustomScrcpyPath() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    const path5 = config.get("scrcpyPath", "");
    return path5.trim() || void 0;
  }
  /**
   * Get all configuration values with validation
   */
  getValidatedConfig() {
    const defaultIp = this.getDefaultIp();
    const defaultPort = this.getDefaultPort();
    const customAdbPath = this.getCustomAdbPath();
    const customScrcpyPath = this.getCustomScrcpyPath();
    const errors = [];
    if (!this.validateIpAddress(defaultIp)) {
      errors.push(`Invalid IP address: ${defaultIp}`);
    }
    if (!this.validatePort(defaultPort)) {
      errors.push(`Invalid port: ${defaultPort}`);
    }
    return {
      defaultIp,
      defaultPort,
      customAdbPath,
      customScrcpyPath,
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Validate an IP address format
   * Supports IPv4 addresses including localhost and private network ranges
   */
  validateIpAddress(ip) {
    if (!ip || typeof ip !== "string") {
      return false;
    }
    const trimmedIp = ip.trim();
    if (trimmedIp === "localhost" || trimmedIp === "127.0.0.1") {
      return true;
    }
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9]?[0-9])$/;
    if (!ipv4Regex.test(trimmedIp)) {
      return false;
    }
    const parts = trimmedIp.split(".");
    return parts.every((part) => {
      if (part.length > 1 && part.startsWith("0")) {
        return false;
      }
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }
  /**
   * Validate a port number
   * Must be between 1 and 65535 (inclusive)
   */
  validatePort(port) {
    if (port === null || port === void 0) {
      return false;
    }
    let portNum;
    if (typeof port === "string") {
      const trimmedPort = port.trim();
      if (trimmedPort === "") {
        return false;
      }
      if (trimmedPort.includes(".")) {
        return false;
      }
      if (!/^\d+$/.test(trimmedPort)) {
        return false;
      }
      if (trimmedPort.length > 1 && trimmedPort.startsWith("0")) {
        return false;
      }
      portNum = parseInt(trimmedPort, 10);
    } else {
      portNum = port;
    }
    return !isNaN(portNum) && Number.isInteger(portNum) && portNum >= 1 && portNum <= 65535;
  }
  /**
   * Validate IP and port combination
   */
  validateConnection(ip, port) {
    const errors = [];
    if (!this.validateIpAddress(ip)) {
      errors.push(`Invalid IP address: ${ip}. Must be a valid IPv4 address or 'localhost'.`);
    }
    if (!this.validatePort(port)) {
      errors.push(`Invalid port: ${port}. Must be a number between 1 and 65535.`);
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Get configuration with fallback to defaults
   */
  getConfigWithDefaults() {
    const ip = this.getDefaultIp();
    const port = this.getDefaultPort();
    return {
      ip: this.validateIpAddress(ip) ? ip : _ConfigManager.DEFAULT_IP,
      port: this.validatePort(port) ? port : _ConfigManager.DEFAULT_PORT
    };
  }
  /**
   * Register a callback for configuration changes
   */
  onConfigurationChanged(callback) {
    return vscode3.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(_ConfigManager.CONFIG_SECTION)) {
        callback();
      }
    });
  }
  /**
   * Update configuration value
   */
  async updateConfig(key, value, target = vscode3.ConfigurationTarget.Workspace) {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await config.update(key, value, target);
  }
  /**
   * Reset configuration to defaults
   */
  async resetToDefaults() {
    const config = vscode3.workspace.getConfiguration(_ConfigManager.CONFIG_SECTION);
    await Promise.all([
      config.update("defaultIp", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("defaultPort", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("adbPath", void 0, vscode3.ConfigurationTarget.Workspace),
      config.update("scrcpyPath", void 0, vscode3.ConfigurationTarget.Workspace)
    ]);
  }
};
__name(_ConfigManager, "ConfigManager");
__publicField(_ConfigManager, "CONFIG_SECTION", "droidbridge");
__publicField(_ConfigManager, "DEFAULT_IP", "192.168.1.100");
__publicField(_ConfigManager, "DEFAULT_PORT", "5555");
var ConfigManager2 = _ConfigManager;

// src/config/binaryConfig.ts
var BINARY_CONFIG = [
  {
    name: "adb",
    downloadUrls: {
      // GitHub releases - repository
      github: "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      // Direct download URLs - CDN (optional, not ready yet)
      // direct: 'https://lusansapkota.com.np/droidbridge/binaries',
      // Fallback to official sources (may require extraction)
      fallback: "https://dl.google.com/android/repository/platform-tools-latest"
    },
    version: "latest"
  },
  {
    name: "scrcpy",
    downloadUrls: {
      // GitHub releases - repository
      github: "https://github.com/Lusan-sapkota/droidbridge-binaries/releases/latest/download",
      // Direct download URLs - CDN (optional, not ready yet)
      // direct: 'https://lusansapkota.com.np/droidbridge/binaries',
      // Fallback to official releases
      fallback: "https://github.com/Genymobile/scrcpy/releases/latest/download"
    },
    version: "latest"
  }
];
function getBinaryConfig(name) {
  return BINARY_CONFIG.find((config) => config.name === name);
}
__name(getBinaryConfig, "getBinaryConfig");
function getDownloadUrl(name, preference = "github") {
  const config = getBinaryConfig(name);
  if (!config) {
    return void 0;
  }
  return config.downloadUrls[preference] || config.downloadUrls.github || config.downloadUrls.direct;
}
__name(getDownloadUrl, "getDownloadUrl");
var BINARY_PATTERNS = {
  adb: {
    win32: "adb-windows-{arch}.exe",
    darwin: "adb-macos-{arch}",
    linux: "adb-linux-{arch}"
  },
  scrcpy: {
    win32: "scrcpy-windows-{arch}.exe",
    darwin: "scrcpy-macos-{arch}",
    linux: "scrcpy-linux-{arch}"
  }
};
function getBinaryPattern(name, platform2, arch2) {
  var _a2;
  const pattern = (_a2 = BINARY_PATTERNS[name]) == null ? void 0 : _a2[platform2];
  if (!pattern) {
    const extension = platform2 === "win32" ? ".exe" : "";
    return `${name}-${platform2}-${arch2}${extension}`;
  }
  return pattern.replace("{arch}", arch2);
}
__name(getBinaryPattern, "getBinaryPattern");

// src/managers/binaryDetector.ts
var import_child_process3 = require("child_process");
var import_util = require("util");
var path2 = __toESM(require("path"));
var fs = __toESM(require("fs/promises"));
var _a, _b;
var execAsync = (0, import_util.promisify)(import_child_process3.exec);
var _BinaryDetector = class _BinaryDetector {
  downloadDir;
  constructor(extensionPath) {
    this.downloadDir = path2.join(extensionPath, "downloaded-binaries");
  }
  /**
   * Detect all required binaries and determine what needs to be downloaded
   */
  async detectBinaries() {
    const results = /* @__PURE__ */ new Map();
    for (const requirement of _BinaryDetector.BINARY_REQUIREMENTS) {
      const result = await this.detectSingleBinary(requirement.name);
      results.set(requirement.name, result);
    }
    return results;
  }
  /**
   * Detect a single binary on the system
   */
  async detectSingleBinary(binaryName) {
    const systemResult = await this.checkSystemPath(binaryName);
    if (systemResult.found) {
      return systemResult;
    }
    const downloadedResult = await this.checkDownloadedBinary(binaryName);
    if (downloadedResult.found) {
      return downloadedResult;
    }
    const commonPathResult = await this.checkCommonPaths(binaryName);
    if (commonPathResult.found) {
      return commonPathResult;
    }
    return {
      found: false,
      source: "not-found"
    };
  }
  /**
   * Get missing binaries that need to be downloaded
   */
  async getMissingBinaries() {
    const detectionResults = await this.detectBinaries();
    const missing = [];
    for (const requirement of _BinaryDetector.BINARY_REQUIREMENTS) {
      const result = detectionResults.get(requirement.name);
      if (!(result == null ? void 0 : result.found) && requirement.required) {
        missing.push(requirement);
      }
    }
    return missing;
  }
  /**
   * Check if binary exists in system PATH
   */
  async checkSystemPath(binaryName) {
    try {
      const command = PlatformUtils.getCurrentPlatform() === "win32" ? "where" : "which";
      const { stdout } = await execAsync(`${command} ${binaryName}`);
      const binaryPath = stdout.trim().split("\n")[0];
      if (binaryPath) {
        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: "system"
        };
      }
    } catch (error) {
    }
    return { found: false, source: "not-found" };
  }
  /**
   * Check if we have a downloaded version of the binary
   */
  async checkDownloadedBinary(binaryName) {
    try {
      const platform2 = PlatformUtils.getCurrentPlatform();
      const extension = PlatformUtils.getBinaryExtension();
      const binaryPath = path2.join(this.downloadDir, platform2, `${binaryName}${extension}`);
      await fs.access(binaryPath);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          return { found: false, source: "not-found" };
        }
      }
      const version = await this.getBinaryVersion(binaryName, binaryPath);
      return {
        found: true,
        path: binaryPath,
        version,
        source: "downloaded"
      };
    } catch (error) {
      return { found: false, source: "not-found" };
    }
  }
  /**
   * Check common installation paths for binaries
   */
  async checkCommonPaths(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    let commonPaths = [];
    switch (platform2) {
      case "win32":
        commonPaths = [
          `C:\\Program Files\\${binaryName}\\${binaryName}${extension}`,
          `C:\\Program Files (x86)\\${binaryName}\\${binaryName}${extension}`,
          `C:\\${binaryName}\\${binaryName}${extension}`,
          `C:\\tools\\${binaryName}\\${binaryName}${extension}`
        ];
        break;
      case "darwin":
        commonPaths = [
          `/usr/local/bin/${binaryName}`,
          `/opt/homebrew/bin/${binaryName}`,
          `/Applications/${binaryName}/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
      case "linux":
        commonPaths = [
          `/usr/bin/${binaryName}`,
          `/usr/local/bin/${binaryName}`,
          `/opt/${binaryName}/${binaryName}`,
          `${process.env.HOME}/.local/bin/${binaryName}`,
          `${process.env.HOME}/bin/${binaryName}`
        ];
        break;
    }
    for (const binaryPath of commonPaths) {
      try {
        await fs.access(binaryPath);
        if (PlatformUtils.supportsFeature("executable-permissions")) {
          const isExecutable = await PlatformUtils.isExecutable(binaryPath);
          if (!isExecutable) {
            continue;
          }
        }
        const version = await this.getBinaryVersion(binaryName, binaryPath);
        return {
          found: true,
          path: binaryPath,
          version,
          source: "system"
        };
      } catch (error) {
      }
    }
    return { found: false, source: "not-found" };
  }
  /**
   * Get version information for a binary
   */
  async getBinaryVersion(binaryName, binaryPath) {
    try {
      let versionCommand;
      switch (binaryName) {
        case "adb":
          versionCommand = `"${binaryPath}" version`;
          break;
        case "scrcpy":
          versionCommand = `"${binaryPath}" --version`;
          break;
        default:
          return void 0;
      }
      const { stdout } = await execAsync(versionCommand);
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      return versionMatch ? versionMatch[1] : stdout.trim().split("\n")[0];
    } catch (error) {
      return void 0;
    }
  }
  /**
   * Get the download directory path
   */
  getDownloadDir() {
    return this.downloadDir;
  }
  /**
   * Get binary requirements
   */
  static getBinaryRequirements() {
    return [..._BinaryDetector.BINARY_REQUIREMENTS];
  }
};
__name(_BinaryDetector, "BinaryDetector");
__publicField(_BinaryDetector, "BINARY_REQUIREMENTS", [
  {
    name: "adb",
    required: true,
    downloadUrl: (_a = getBinaryConfig("adb")) == null ? void 0 : _a.downloadUrls.github
  },
  {
    name: "scrcpy",
    required: true,
    downloadUrl: (_b = getBinaryConfig("scrcpy")) == null ? void 0 : _b.downloadUrls.github
  }
]);
var BinaryDetector = _BinaryDetector;

// src/managers/binaryDownloader.ts
var https = __toESM(require("https"));
var http = __toESM(require("http"));
var fs2 = __toESM(require("fs/promises"));
var path3 = __toESM(require("path"));
var import_fs = require("fs");
var _BinaryDownloader = class _BinaryDownloader {
  downloadDir;
  progressCallback;
  constructor(downloadDir) {
    this.downloadDir = downloadDir;
  }
  /**
   * Set progress callback for download updates
   */
  setProgressCallback(callback) {
    this.progressCallback = callback;
  }
  /**
   * Download multiple binaries
   */
  async downloadBinaries(requirements) {
    const results = [];
    await this.ensureDownloadDirectory();
    for (const requirement of requirements) {
      const result = await this.downloadSingleBinary(requirement);
      results.push(result);
    }
    return results;
  }
  /**
   * Download a single binary
   */
  async downloadSingleBinary(requirement) {
    try {
      if (!requirement.downloadUrl) {
        return {
          success: false,
          binary: requirement.name,
          error: "No download URL provided"
        };
      }
      const downloadUrl = this.getDownloadUrl(requirement);
      const outputPath = this.getOutputPath(requirement.name);
      await fs2.mkdir(path3.dirname(outputPath), { recursive: true });
      await this.downloadFile(downloadUrl, outputPath, requirement.name);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        await PlatformUtils.makeExecutable(outputPath);
      }
      return {
        success: true,
        binary: requirement.name,
        path: outputPath
      };
    } catch (error) {
      return {
        success: false,
        binary: requirement.name,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  /**
   * Check if a binary is already downloaded
   */
  async isBinaryDownloaded(binaryName) {
    try {
      const outputPath = this.getOutputPath(binaryName);
      await fs2.access(outputPath);
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        return await PlatformUtils.isExecutable(outputPath);
      }
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Get the path where a binary would be downloaded
   */
  getDownloadedBinaryPath(binaryName) {
    return this.getOutputPath(binaryName);
  }
  /**
   * Clean up downloaded binaries
   */
  async cleanupDownloads() {
    try {
      await fs2.rm(this.downloadDir, { recursive: true, force: true });
    } catch (error) {
    }
  }
  /**
   * Get download URLs based on platform and binary
   */
  getDownloadUrl(requirement) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const arch2 = PlatformUtils.getCurrentArchitecture();
    const configUrl = getDownloadUrl(requirement.name, "github");
    if (configUrl) {
      const fileName = getBinaryPattern(requirement.name, platform2, arch2);
      return `${configUrl}/${fileName}`;
    }
    if (requirement.downloadUrl) {
      const extension = PlatformUtils.getBinaryExtension();
      const fileName = `${requirement.name}-${platform2}-${arch2}${extension}`;
      if (requirement.downloadUrl.includes("github.com")) {
        return `${requirement.downloadUrl}/${fileName}`;
      } else {
        return `${requirement.downloadUrl}/${fileName}`;
      }
    }
    throw new Error(`No download URL configured for ${requirement.name}`);
  }
  /**
   * Get the output path for a binary
   */
  getOutputPath(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path3.join(this.downloadDir, platform2, `${binaryName}${extension}`);
  }
  /**
   * Ensure download directory exists
   */
  async ensureDownloadDirectory() {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const platformDir = path3.join(this.downloadDir, platform2);
    await fs2.mkdir(platformDir, { recursive: true });
  }
  /**
   * Download a file from URL to local path
   */
  async downloadFile(url, outputPath, binaryName) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith("https:") ? https : http;
      const request = client.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            this.downloadFile(redirectUrl, outputPath, binaryName).then(resolve).catch(reject);
            return;
          }
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }
        const totalSize = parseInt(response.headers["content-length"] || "0", 10);
        let downloadedSize = 0;
        const fileStream = (0, import_fs.createWriteStream)(outputPath);
        response.on("data", (chunk) => {
          downloadedSize += chunk.length;
          if (this.progressCallback && totalSize > 0) {
            this.progressCallback({
              binary: binaryName,
              downloaded: downloadedSize,
              total: totalSize,
              percentage: Math.round(downloadedSize / totalSize * 100)
            });
          }
        });
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", (error) => {
          fs2.unlink(outputPath).catch(() => {
          });
          reject(error);
        });
      });
      request.on("error", (error) => {
        reject(error);
      });
      request.setTimeout(3e4, () => {
        request.destroy();
        reject(new Error("Download timeout"));
      });
    });
  }
};
__name(_BinaryDownloader, "BinaryDownloader");
var BinaryDownloader = _BinaryDownloader;

// src/managers/binaryManager.ts
var path4 = __toESM(require("path"));
var fs3 = __toESM(require("fs/promises"));
var _BinaryManager = class _BinaryManager {
  extensionPath;
  configManager;
  binaryDetector;
  binaryDownloader;
  detectionCache = /* @__PURE__ */ new Map();
  downloadProgressCallback;
  constructor(extensionPath, configManager2) {
    this.extensionPath = extensionPath;
    this.configManager = configManager2;
    this.binaryDetector = new BinaryDetector(extensionPath);
    this.binaryDownloader = new BinaryDownloader(this.binaryDetector.getDownloadDir());
  }
  /**
   * Set download progress callback
   */
  setDownloadProgressCallback(callback) {
    this.downloadProgressCallback = callback;
    this.binaryDownloader.setProgressCallback(callback);
  }
  /**
   * Get the path to the ADB binary (custom, system, or downloaded)
   */
  async getAdbPath() {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    const detection = await this.getOrDetectBinary("adb");
    if (detection.found && detection.path) {
      return detection.path;
    }
    throw new Error("ADB binary not found. Please install ADB or set a custom path in settings.");
  }
  /**
   * Get the path to the scrcpy binary (custom, system, or downloaded)
   */
  async getScrcpyPath() {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    const detection = await this.getOrDetectBinary("scrcpy");
    if (detection.found && detection.path) {
      return detection.path;
    }
    throw new Error("Scrcpy binary not found. Please install scrcpy or set a custom path in settings.");
  }
  /**
   * Get the path to the ADB binary (synchronous version for backward compatibility)
   * @deprecated Use getAdbPath() instead
   */
  getAdbPathSync() {
    const customPath = this.configManager.getCustomAdbPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("adb");
  }
  /**
   * Get the path to the scrcpy binary (synchronous version for backward compatibility)
   * @deprecated Use getScrcpyPath() instead
   */
  getScrcpyPathSync() {
    const customPath = this.configManager.getCustomScrcpyPath();
    if (customPath) {
      return customPath;
    }
    return this.getBundledBinaryPath("scrcpy");
  }
  /**
   * Ensure all required binaries are available, downloading if necessary
   */
  async ensureBinariesAvailable() {
    const errors = [];
    try {
      const detectionStatus = await this.getDetectionStatus();
      const missingBinaries = [];
      for (const requirement of BinaryDetector.getBinaryRequirements()) {
        const detection = detectionStatus.get(requirement.name);
        if (!(detection == null ? void 0 : detection.found)) {
          missingBinaries.push(requirement);
        }
      }
      if (missingBinaries.length === 0) {
        return { success: true, errors: [] };
      }
      const downloadResults = await this.binaryDownloader.downloadBinaries(missingBinaries);
      for (const result of downloadResults) {
        if (!result.success) {
          errors.push(`Failed to download ${result.binary}: ${result.error}`);
        }
      }
      this.detectionCache.clear();
      return { success: errors.length === 0, errors };
    } catch (error) {
      errors.push(`Binary management error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, errors };
    }
  }
  /**
   * Validate that required binaries exist and are executable
   */
  async validateBinaries() {
    const errors = [];
    let adbValid = false;
    let scrcpyValid = false;
    try {
      const ensureResult = await this.ensureBinariesAvailable();
      if (!ensureResult.success) {
        errors.push(...ensureResult.errors);
      }
      try {
        const adbPath = await this.getAdbPath();
        adbValid = await this.validateBinary(adbPath, "adb");
        if (!adbValid) {
          errors.push(`ADB binary not found or not executable: ${adbPath}`);
        }
      } catch (error) {
        errors.push(`Error validating ADB binary: ${error instanceof Error ? error.message : String(error)}`);
      }
      try {
        const scrcpyPath = await this.getScrcpyPath();
        scrcpyValid = await this.validateBinary(scrcpyPath, "scrcpy");
        if (!scrcpyValid) {
          errors.push(`Scrcpy binary not found or not executable: ${scrcpyPath}`);
        }
      } catch (error) {
        errors.push(`Error validating scrcpy binary: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error) {
      errors.push(`Binary validation error: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
      adbValid,
      scrcpyValid,
      errors
    };
  }
  /**
   * Get information about binary paths and their sources
   */
  async getBinaryInfo() {
    const customAdbPath = this.configManager.getCustomAdbPath();
    const customScrcpyPath = this.configManager.getCustomScrcpyPath();
    const adbDetection = await this.getOrDetectBinary("adb");
    const scrcpyDetection = await this.getOrDetectBinary("scrcpy");
    return {
      adb: {
        path: customAdbPath || adbDetection.path || "Not found",
        isCustom: !!customAdbPath,
        bundledPath: this.getBundledBinaryPath("adb"),
        source: customAdbPath ? "custom" : adbDetection.source,
        version: adbDetection.version
      },
      scrcpy: {
        path: customScrcpyPath || scrcpyDetection.path || "Not found",
        isCustom: !!customScrcpyPath,
        bundledPath: this.getBundledBinaryPath("scrcpy"),
        source: customScrcpyPath ? "custom" : scrcpyDetection.source,
        version: scrcpyDetection.version
      }
    };
  }
  /**
   * Get detection status for all binaries (includes bundled fallback)
   */
  async getDetectionStatus() {
    const results = /* @__PURE__ */ new Map();
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = await this.getOrDetectBinary(requirement.name);
      results.set(requirement.name, detection);
    }
    return results;
  }
  /**
   * Force re-detection of binaries (clears cache)
   */
  async refreshDetection() {
    this.detectionCache.clear();
  }
  /**
   * Check if binary downloads are needed (considers bundled binaries)
   */
  async needsDownload() {
    const detectionStatus = await this.getDetectionStatus();
    const missingBinaries = [];
    for (const requirement of BinaryDetector.getBinaryRequirements()) {
      const detection = detectionStatus.get(requirement.name);
      if (!(detection == null ? void 0 : detection.found)) {
        missingBinaries.push(requirement.name);
      }
    }
    return {
      needed: missingBinaries.length > 0,
      binaries: missingBinaries
    };
  }
  /**
   * Check binary integrity and platform compatibility
   */
  async checkBinaryIntegrity() {
    const errors = [];
    let adbIntegrity = false;
    let scrcpyIntegrity = false;
    try {
      if (!PlatformUtils.isSupportedPlatform()) {
        errors.push(`Unsupported platform: ${PlatformUtils.getCurrentPlatform()}`);
        return { adb: false, scrcpy: false, errors };
      }
      const adbPath = await this.getAdbPath();
      adbIntegrity = await this.checkSingleBinaryIntegrity(adbPath, "adb");
      if (!adbIntegrity) {
        errors.push(`ADB binary integrity check failed: ${adbPath}`);
      }
      const scrcpyPath = await this.getScrcpyPath();
      scrcpyIntegrity = await this.checkSingleBinaryIntegrity(scrcpyPath, "scrcpy");
      if (!scrcpyIntegrity) {
        errors.push(`Scrcpy binary integrity check failed: ${scrcpyPath}`);
      }
    } catch (error) {
      errors.push(`Binary integrity check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { adb: adbIntegrity, scrcpy: scrcpyIntegrity, errors };
  }
  /**
   * Get platform-specific binary information
   */
  getPlatformInfo() {
    return {
      platform: PlatformUtils.getCurrentPlatform(),
      architecture: PlatformUtils.getCurrentArchitecture(),
      binaryExtension: PlatformUtils.getBinaryExtension(),
      supportsExecutablePermissions: PlatformUtils.supportsFeature("executable-permissions")
    };
  }
  /**
   * Get or detect a binary (with caching)
   */
  async getOrDetectBinary(binaryName) {
    if (this.detectionCache.has(binaryName)) {
      return this.detectionCache.get(binaryName);
    }
    let detection = await this.binaryDetector.detectSingleBinary(binaryName);
    this.detectionCache.set(binaryName, detection);
    return detection;
  }
  /**
   * Get the path where a binary would be if it were bundled (for compatibility)
   * Note: We no longer bundle binaries - this is kept for interface compatibility
   */
  getBundledBinaryPath(binaryName) {
    const platform2 = PlatformUtils.getCurrentPlatform();
    const extension = PlatformUtils.getBinaryExtension();
    return path4.join(
      this.extensionPath,
      "binaries",
      platform2,
      `${binaryName}${extension}`
    );
  }
  /**
   * Validate that a binary exists and is executable
   */
  async validateBinary(binaryPath, binaryName) {
    try {
      const stats = await fs3.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }
      if (PlatformUtils.supportsFeature("executable-permissions")) {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          try {
            await PlatformUtils.makeExecutable(binaryPath);
          } catch {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
  /**
   * Check integrity of a single binary file
   */
  async checkSingleBinaryIntegrity(binaryPath, binaryName) {
    try {
      const stats = await fs3.stat(binaryPath);
      if (!stats.isFile()) {
        return false;
      }
      if (stats.size === 0) {
        return false;
      }
      const platform2 = PlatformUtils.getCurrentPlatform();
      if (platform2 === "win32") {
        const expectedExtension = PlatformUtils.getBinaryExtension();
        if (expectedExtension && !binaryPath.endsWith(expectedExtension)) {
          return false;
        }
      } else {
        const isExecutable = await PlatformUtils.isExecutable(binaryPath);
        if (!isExecutable) {
          try {
            await PlatformUtils.makeExecutable(binaryPath);
            return await PlatformUtils.isExecutable(binaryPath);
          } catch {
            return false;
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }
};
__name(_BinaryManager, "BinaryManager");
var BinaryManager3 = _BinaryManager;

// src/managers/logger.ts
var vscode4 = __toESM(require("vscode"));
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
  LogLevel2[LogLevel2["ERROR"] = 2] = "ERROR";
  return LogLevel2;
})(LogLevel || {});
var _Logger = class _Logger {
  outputChannel;
  logLevel = 1 /* INFO */;
  constructor() {
    this.outputChannel = vscode4.window.createOutputChannel("DroidBridge Logs");
  }
  /**
   * Set the minimum log level for output
   */
  setLogLevel(level) {
    this.logLevel = level;
  }
  /**
   * Get current log level
   */
  getLogLevel() {
    return this.logLevel;
  }
  /**
   * Format timestamp for consistent logging
   */
  formatTimestamp() {
    const now = /* @__PURE__ */ new Date();
    return now.toISOString().replace("T", " ").replace("Z", "");
  }
  /**
   * Log a debug message
   * Only shown when log level is DEBUG
   */
  debug(message) {
    if (this.logLevel <= 0 /* DEBUG */) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] DEBUG: ${message}`);
    }
  }
  /**
   * Log an informational message
   * Requirement 6.5: Log with timestamps
   */
  info(message) {
    if (this.logLevel <= 1 /* INFO */) {
      const timestamp = this.formatTimestamp();
      this.outputChannel.appendLine(`[${timestamp}] INFO: ${message}`);
    }
  }
  /**
   * Log an error message
   * Requirement 6.5: Log detailed error information with timestamps
   */
  error(message, error) {
    const timestamp = this.formatTimestamp();
    let logMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      logMessage += `
Error Details: ${error.message}`;
      if (error.stack) {
        logMessage += `
Stack Trace:
${error.stack}`;
      }
    }
    this.outputChannel.appendLine(logMessage);
  }
  /**
   * Log process output
   * Requirements 6.2, 6.3: Capture and display stdout/stderr in OutputChannel
   */
  logProcessOutput(command, output, isError = false) {
    const timestamp = this.formatTimestamp();
    const level = isError ? "STDERR" : "STDOUT";
    this.outputChannel.appendLine(`[${timestamp}] PROCESS ${level}: ${command}`);
    if (output.trim()) {
      const lines = output.trim().split("\n");
      lines.forEach((line) => {
        this.outputChannel.appendLine(`  ${line}`);
      });
    }
    this.outputChannel.appendLine("");
  }
  /**
   * Show a progress notification
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgress(message) {
    this.info(`Progress: ${message}`);
    return vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
        title: message,
        cancellable: false
      },
      async () => {
      }
    );
  }
  /**
   * Show a progress notification with cancellation support
   * Requirement 8.1: Show appropriate progress indicators
   */
  showProgressWithCancel(message, cancellable = true) {
    this.info(`Progress (cancellable): ${message}`);
    return vscode4.window.withProgress(
      {
        location: vscode4.ProgressLocation.Notification,
        title: message,
        cancellable
      },
      async (progress, token) => {
        return new Promise((resolve, reject) => {
          if (token.isCancellationRequested) {
            reject(new Error("Operation cancelled by user"));
          }
          resolve();
        });
      }
    );
  }
  /**
   * Show a success notification
   * Requirement 8.2: Show success notifications with descriptive messages
   */
  showSuccess(message) {
    vscode4.window.showInformationMessage(message);
    this.info(`SUCCESS: ${message}`);
  }
  /**
   * Show an error notification
   * Requirement 8.3: Show error notifications with specific error details
   */
  showError(message, error) {
    let errorMessage = message;
    if (error) {
      errorMessage += ` (${error.message})`;
    }
    vscode4.window.showErrorMessage(errorMessage);
    this.error(`USER ERROR: ${message}`, error);
  }
  /**
   * Show a warning notification
   * Additional helper for user feedback
   */
  showWarning(message) {
    vscode4.window.showWarningMessage(message);
    this.info(`WARNING: ${message}`);
  }
  /**
   * Show and focus the output channel
   * Requirement 6.4: Open and focus the DroidBridge Logs OutputChannel
   */
  show() {
    this.outputChannel.show();
  }
  /**
   * Clear all logs from the output channel
   */
  clear() {
    this.outputChannel.clear();
    this.info("Log cleared");
  }
  /**
   * Dispose of the output channel
   */
  dispose() {
    this.outputChannel.dispose();
  }
};
__name(_Logger, "Logger");
var Logger4 = _Logger;

// src/managers/connectionHistory.ts
var _ConnectionHistoryManager = class _ConnectionHistoryManager {
  context;
  history = [];
  constructor(context) {
    this.context = context;
    this.loadHistory();
  }
  /**
   * Load connection history from storage
   */
  loadHistory() {
    const stored = this.context.globalState.get(_ConnectionHistoryManager.STORAGE_KEY, []);
    this.history = stored.map((entry) => ({
      ...entry,
      lastConnected: new Date(entry.lastConnected)
    }));
  }
  /**
   * Save connection history to storage
   */
  async saveHistory() {
    await this.context.globalState.update(_ConnectionHistoryManager.STORAGE_KEY, this.history);
  }
  /**
   * Add or update a connection in history
   */
  async addConnection(ip, port, name) {
    const id = `${ip}:${port}`;
    const existingIndex = this.history.findIndex((entry) => entry.id === id);
    if (existingIndex >= 0) {
      this.history[existingIndex].lastConnected = /* @__PURE__ */ new Date();
      this.history[existingIndex].connectionCount++;
      if (name) {
        this.history[existingIndex].name = name;
      }
      const entry = this.history.splice(existingIndex, 1)[0];
      this.history.unshift(entry);
    } else {
      const newEntry = {
        id,
        ip,
        port,
        name,
        lastConnected: /* @__PURE__ */ new Date(),
        connectionCount: 1
      };
      this.history.unshift(newEntry);
      if (this.history.length > _ConnectionHistoryManager.MAX_HISTORY_ENTRIES) {
        this.history = this.history.slice(0, _ConnectionHistoryManager.MAX_HISTORY_ENTRIES);
      }
    }
    await this.saveHistory();
  }
  /**
   * Remove a connection from history
   */
  async removeConnection(id) {
    this.history = this.history.filter((entry) => entry.id !== id);
    await this.saveHistory();
  }
  /**
   * Clear all connection history
   */
  async clearHistory() {
    this.history = [];
    await this.saveHistory();
  }
  /**
   * Get all connection history entries
   */
  getHistory() {
    return [...this.history];
  }
  /**
   * Get a specific connection by ID
   */
  getConnection(id) {
    return this.history.find((entry) => entry.id === id);
  }
  /**
   * Update the name of a connection
   */
  async updateConnectionName(id, name) {
    const entry = this.history.find((e) => e.id === id);
    if (entry) {
      entry.name = name;
      await this.saveHistory();
    }
  }
  /**
   * Get recent connections (last 5)
   */
  getRecentConnections() {
    return this.history.slice(0, 5);
  }
};
__name(_ConnectionHistoryManager, "ConnectionHistoryManager");
__publicField(_ConnectionHistoryManager, "STORAGE_KEY", "droidbridge.connectionHistory");
__publicField(_ConnectionHistoryManager, "MAX_HISTORY_ENTRIES", 10);
var ConnectionHistoryManager = _ConnectionHistoryManager;

// src/utils/themeManager.ts
var vscode6 = __toESM(require("vscode"));
var ThemeKind = /* @__PURE__ */ ((ThemeKind3) => {
  ThemeKind3[ThemeKind3["Light"] = 1] = "Light";
  ThemeKind3[ThemeKind3["Dark"] = 2] = "Dark";
  ThemeKind3[ThemeKind3["HighContrast"] = 3] = "HighContrast";
  ThemeKind3[ThemeKind3["HighContrastLight"] = 4] = "HighContrastLight";
  return ThemeKind3;
})(ThemeKind || {});
var _ThemeManager = class _ThemeManager {
  currentTheme;
  themeChangeListeners = [];
  disposables = [];
  constructor() {
    this.currentTheme = this.detectCurrentTheme();
    this.setupThemeChangeListener();
  }
  /**
   * Get the singleton instance of ThemeManager
   */
  static getInstance() {
    if (!_ThemeManager.instance) {
      _ThemeManager.instance = new _ThemeManager();
    }
    return _ThemeManager.instance;
  }
  /**
   * Detect the current VSCode theme
   * Implements requirement 10.1, 10.2: Automatic theme detection
   */
  detectCurrentTheme() {
    const colorTheme = vscode6.window.activeColorTheme;
    switch (colorTheme.kind) {
      case vscode6.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode6.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode6.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode6.ColorThemeKind.HighContrastLight:
        return 4 /* HighContrastLight */;
      default:
        return 2 /* Dark */;
    }
  }
  /**
   * Set up listener for theme changes
   * Implements requirement 10.3: Theme change listeners
   */
  setupThemeChangeListener() {
    const disposable = vscode6.window.onDidChangeActiveColorTheme((colorTheme) => {
      const newTheme = this.mapColorThemeKindToThemeKind(colorTheme.kind);
      if (newTheme !== this.currentTheme) {
        const oldTheme = this.currentTheme;
        this.currentTheme = newTheme;
        this.themeChangeListeners.forEach((listener) => {
          try {
            listener(newTheme);
          } catch (error) {
            console.error("Error in theme change listener:", error);
          }
        });
      }
    });
    this.disposables.push(disposable);
  }
  /**
   * Map VSCode ColorThemeKind to our ThemeKind
   */
  mapColorThemeKindToThemeKind(kind) {
    switch (kind) {
      case vscode6.ColorThemeKind.Light:
        return 1 /* Light */;
      case vscode6.ColorThemeKind.Dark:
        return 2 /* Dark */;
      case vscode6.ColorThemeKind.HighContrast:
        return 3 /* HighContrast */;
      case vscode6.ColorThemeKind.HighContrastLight:
        return 4 /* HighContrastLight */;
      default:
        return 2 /* Dark */;
    }
  }
  /**
   * Get the current theme
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  /**
   * Check if the current theme is dark
   */
  isDarkTheme() {
    return this.currentTheme === 2 /* Dark */ || this.currentTheme === 3 /* HighContrast */;
  }
  /**
   * Check if the current theme is light
   */
  isLightTheme() {
    return this.currentTheme === 1 /* Light */ || this.currentTheme === 4 /* HighContrastLight */;
  }
  /**
   * Get the appropriate icon path for the current theme
   * Implements requirement 10.4: Automatic icon switching
   */
  getThemeSpecificIcon(iconName, extensionUri) {
    const themeFolder = this.isDarkTheme() ? "dark" : "light";
    return vscode6.Uri.joinPath(extensionUri, "media", "icons", themeFolder, `${iconName}.svg`);
  }
  /**
   * Get the theme-specific icon URI for webview usage
   */
  getWebviewIconUri(iconName, extensionUri, webview) {
    const iconPath = this.getThemeSpecificIcon(iconName, extensionUri);
    return webview.asWebviewUri(iconPath);
  }
  /**
   * Get CSS class name for current theme
   */
  getThemeCssClass() {
    switch (this.currentTheme) {
      case 1 /* Light */:
        return "vscode-light";
      case 2 /* Dark */:
        return "vscode-dark";
      case 3 /* HighContrast */:
        return "vscode-high-contrast";
      case 4 /* HighContrastLight */:
        return "vscode-high-contrast-light";
      default:
        return "vscode-dark";
    }
  }
  /**
   * Register a listener for theme changes
   * Implements requirement 10.3: Theme change listeners and UI updates
   */
  onThemeChanged(listener) {
    this.themeChangeListeners.push(listener);
    return {
      dispose: /* @__PURE__ */ __name(() => {
        const index = this.themeChangeListeners.indexOf(listener);
        if (index >= 0) {
          this.themeChangeListeners.splice(index, 1);
        }
      }, "dispose")
    };
  }
  /**
   * Get theme-specific CSS variables as a string
   * Implements requirement 10.5: CSS variable usage for consistent theming
   */
  getThemeVariables() {
    return `
      :root {
        --theme-kind: '${this.getThemeCssClass()}';
        --is-dark-theme: ${this.isDarkTheme() ? "true" : "false"};
        --is-light-theme: ${this.isLightTheme() ? "true" : "false"};
      }
    `;
  }
  /**
   * Refresh the current theme detection
   * Useful for manual theme refresh
   */
  refreshTheme() {
    const newTheme = this.detectCurrentTheme();
    if (newTheme !== this.currentTheme) {
      const oldTheme = this.currentTheme;
      this.currentTheme = newTheme;
      this.themeChangeListeners.forEach((listener) => {
        try {
          listener(newTheme);
        } catch (error) {
          console.error("Error in theme change listener during refresh:", error);
        }
      });
    }
  }
  /**
   * Dispose of all resources
   */
  dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
    this.themeChangeListeners = [];
  }
  /**
   * Reset the singleton instance (for testing purposes)
   */
  static resetInstance() {
    if (_ThemeManager.instance) {
      _ThemeManager.instance.dispose();
      _ThemeManager.instance = void 0;
    }
  }
};
__name(_ThemeManager, "ThemeManager");
__publicField(_ThemeManager, "instance");
var ThemeManager = _ThemeManager;

// src/providers/sidebarProvider.ts
var vscode7 = __toESM(require("vscode"));
var _DroidBridgeSidebarProvider = class _DroidBridgeSidebarProvider {
  constructor(_extensionUri, _context, configManager2) {
    this._extensionUri = _extensionUri;
    this._context = _context;
    this.configManager = configManager2;
    this.themeManager = ThemeManager.getInstance();
    this.connectionHistory = new ConnectionHistoryManager(_context);
    this.loadDefaultValues();
    this.setupConfigurationWatcher();
    this.setupThemeChangeListener();
  }
  _view;
  connectionStatus = false;
  scrcpyStatus = false;
  currentIp = "";
  currentPort = "";
  configManager;
  configChangeListener;
  themeManager;
  themeChangeListener;
  connectionHistory;
  qrPairingState = { active: false, message: "No active QR session yet." };
  /**
   * Load default IP and port values from configuration
   */
  loadDefaultValues() {
    const config = this.configManager.getConfigWithDefaults();
    this.currentIp = config.ip;
    this.currentPort = config.port;
  }
  /**
   * Set up configuration change watcher to update defaults
   */
  setupConfigurationWatcher() {
    this.configChangeListener = this.configManager.onConfigurationChanged(() => {
      this.loadDefaultValues();
      this._updateWebviewState();
    });
    this._context.subscriptions.push(this.configChangeListener);
  }
  /**
   * Set up theme change listener to refresh webview on theme changes
   * Implements requirements 10.3: Theme change listeners and UI updates
   */
  setupThemeChangeListener() {
    this.themeChangeListener = this.themeManager.onThemeChanged((theme) => {
      if (this._view) {
        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
        this._view.webview.postMessage({
          type: "themeChanged",
          theme,
          isDark: this.themeManager.isDarkTheme(),
          isLight: this.themeManager.isLightTheme(),
          themeCssClass: this.themeManager.getThemeCssClass()
        });
      }
    });
    this._context.subscriptions.push(this.themeChangeListener);
  }
  /**
   * Resolves the webview view and sets up the content
   */
  resolveWebviewView(webviewView, context, _token) {
    console.log("DroidBridge: Resolving webview view");
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    try {
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
      console.log("DroidBridge: Webview HTML set successfully");
    } catch (error) {
      console.error("DroidBridge: Error setting webview HTML:", error);
      webviewView.webview.html = this._getSimpleHtmlForWebview(webviewView.webview);
    }
    webviewView.webview.onDidReceiveMessage(
      (message) => {
        switch (message.type) {
          case "connectDevice":
            vscode7.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "disconnectDevice":
            vscode7.commands.executeCommand("droidbridge.disconnectDevice");
            break;
          case "launchScrcpy":
            vscode7.commands.executeCommand("droidbridge.launchScrcpy");
            break;
          case "launchScrcpyScreenOff":
            vscode7.commands.executeCommand("droidbridge.launchScrcpyScreenOff");
            break;
          case "stopScrcpy":
            vscode7.commands.executeCommand("droidbridge.stopScrcpy");
            break;
          case "showLogs":
            vscode7.commands.executeCommand("droidbridge.showLogs");
            break;
          case "ipChanged":
            this.currentIp = message.value;
            break;
          case "portChanged":
            this.currentPort = message.value;
            break;
          case "connectFromHistory":
            vscode7.commands.executeCommand("droidbridge.connectDevice", message.ip, message.port);
            break;
          case "removeFromHistory":
            this.connectionHistory.removeConnection(message.id);
            this._updateWebviewState();
            break;
          case "clearHistory":
            this.connectionHistory.clearHistory();
            this._updateWebviewState();
            break;
          case "pairManual":
            if (message.host && message.port && message.code) {
              const hostPort = `${message.host}:${message.port}`;
              vscode7.commands.executeCommand("droidbridge.pairDevice", hostPort, message.code);
            }
            break;
          case "pairFromQr":
            if (message.payload) {
              vscode7.commands.executeCommand("droidbridge.pairFromQr", message.payload);
            }
            break;
          case "generateQrPairing":
            vscode7.commands.executeCommand("droidbridge.generatePairingQr");
            break;
          case "cancelQrPairing":
            vscode7.commands.executeCommand("droidbridge.cancelPairingQr");
            break;
        }
      },
      void 0,
      this._context.subscriptions
    );
  }
  /**
   * Generate the HTML content for the webview
   * Implements requirements 10.4: Theme-specific icon usage
   */
  _getHtmlForWebview(webview) {
    const scriptUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "main.js"));
    const styleResetUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "reset.css"));
    const styleVSCodeUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "vscode.css"));
    const styleMainUri = webview.asWebviewUri(vscode7.Uri.joinPath(this._extensionUri, "media", "main.css"));
    let plugIconUri, deviceIconUri;
    try {
      plugIconUri = this.themeManager.getWebviewIconUri("plug", this._extensionUri, webview);
      deviceIconUri = this.themeManager.getWebviewIconUri("device-mobile", this._extensionUri, webview);
    } catch (error) {
      console.error("DroidBridge: Error getting theme icons:", error);
      plugIconUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMkM2LjkgMiA2IDIuOSA2IDRWNkg0VjhIMTJWNkgxMFY0QzEwIDIuOSA5LjEgMiA4IDJaTTggNEM4LjYgNCA5IDQuNCA5IDVWNkg3VjVDNyA0LjQgNy40IDQgOCA0WiIgZmlsbD0iY3VycmVudENvbG9yIi8+Cjwvc3ZnPgo=";
      deviceIconUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMkMzLjQ0NzcyIDIgMyAyLjQ0NzcyIDMgM1YxM0MzIDEzLjU1MjMgMy40NDc3MiAxNCA0IDE0SDEyQzEyLjU1MjMgMTQgMTMgMTMuNTUyMyAxMyAxM1YzQzEzIDIuNDQ3NzIgMTIuNTUyMyAyIDEyIDJINFpNNSA0SDExVjEwSDVWNFoiIGZpbGw9ImN1cnJlbnRDb2xvciIvPgo8L3N2Zz4K";
    }
    let themeCssClass, themeVariables;
    try {
      themeCssClass = this.themeManager.getThemeCssClass();
      themeVariables = this.themeManager.getThemeVariables();
    } catch (error) {
      console.error("DroidBridge: Error getting theme info:", error);
      themeCssClass = "vscode-dark";
      themeVariables = "";
    }
    const nonce = getNonce();
    const qrStatusText = this.qrPairingState.message || "No active QR session yet.";
    const qrImageHiddenAttr = this.qrPairingState.active && this.qrPairingState.dataUrl ? "" : "hidden";
    const qrImageSrc = this.qrPairingState.dataUrl || "";
    const qrMetaText = this.qrPairingState.host && this.qrPairingState.port ? `Host: ${this.qrPairingState.host}:${this.qrPairingState.port} (${this.qrPairingState.code || "\u2022\u2022\u2022\u2022\u2022\u2022"})` : "";
    const qrPayloadText = this.qrPairingState.payload || "";
    const cancelDisabledAttr = this.qrPairingState.active ? "" : "disabled";
    const generateDisabledAttr = this.qrPairingState.active ? "disabled" : "";
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <style>
          ${themeVariables}
        </style>
        <title>DroidBridge</title>
      </head>
      <body class="${themeCssClass}">
        <div class="container ${themeCssClass}">
          <!-- Connect Section -->
          <div class="section">
            <div class="section-header">
              <img src="${plugIconUri}" alt="Connect" width="16" height="16" class="section-icon" />
              <h3>Connect</h3>
            </div>
            <div class="section-content">
              <div class="status-indicator" id="connection-status">
                <span class="codicon codicon-x status-icon"></span>
                <span class="status-text">Disconnected</span>
              </div>
              
              <div class="input-group">
                <label for="ip-input">IP Address:</label>
                <input type="text" id="ip-input" placeholder="192.168.1.100" value="${this.currentIp}">
              </div>
              
              <div class="input-group">
                <label for="port-input">Port:</label>
                <input type="text" id="port-input" placeholder="5555" value="${this.currentPort}">
              </div>
              
              <div class="button-group">
                <button id="connect-btn" class="primary-button" ${!this.connectionStatus && this.currentIp && this.currentPort ? "" : "disabled"}>
                  <span class="codicon codicon-plug"></span>
                  Connect Device
                </button>
                <button id="disconnect-btn" class="secondary-button" ${this.connectionStatus ? "" : "disabled"}>
                  <span class="codicon codicon-debug-disconnect"></span>
                  Disconnect
                </button>
              </div>
            </div>
          </div>

          <!-- Scrcpy Section -->
          <div class="section">
            <div class="section-header">
              <img src="${deviceIconUri}" alt="Device" width="16" height="16" class="section-icon" />
              <h3>Scrcpy</h3>
            </div>
            <div class="section-content">
              <div class="status-indicator" id="scrcpy-status">
                <span class="codicon codicon-stop status-icon"></span>
                <span class="status-text">Stopped</span>
              </div>
              
              <div class="button-group">
                <button id="launch-scrcpy-btn" class="primary-button" ${!this.scrcpyStatus && this.connectionStatus ? "" : "disabled"}>
                  <span class="codicon codicon-play"></span>
                  Launch Scrcpy
                </button>
                <button id="launch-scrcpy-screen-off-btn" class="secondary-button" ${!this.scrcpyStatus && this.connectionStatus ? "" : "disabled"}>
                  <span class="codicon codicon-play-circle"></span>
                  Launch (Screen Off)
                </button>
                <button id="stop-scrcpy-btn" class="secondary-button" ${this.scrcpyStatus ? "" : "disabled"}>
                  <span class="codicon codicon-stop"></span>
                  Stop Scrcpy
                </button>
              </div>
            </div>
          </div>

          <!-- Pairing Section -->
          <div class="section">
            <div class="section-header">
              <span class="codicon codicon-link section-icon"></span>
              <h3>Wireless Pairing</h3>
            </div>
            <div class="section-content">
              <p class="help-text">
                <strong>Quick Steps:</strong>
                <br />1. On Android: <em>Developer options \u2192 Wireless debugging \u2192 Pair device with pairing code</em>
                <br />2. Enter the <strong>IP address</strong>, <strong>Port</strong>, and <strong>6-digit code</strong> shown on device
                <br />3. Click <strong>Pair (Manual)</strong> - pairing expires in ~60 seconds
                <br />4. After pairing, use <strong>Connect</strong> section with device's ADB port (usually 5555)
              </p>
              <div class="button-group qr-button-group">
                <button id="generate-qr-btn" class="primary-button" ${generateDisabledAttr}>
                  <span class="codicon codicon-broadcast"></span>
                  Generate Host QR
                </button>
                <button id="cancel-qr-btn" class="secondary-button" ${cancelDisabledAttr}>
                  <span class="codicon codicon-close"></span>
                  Cancel QR Session
                </button>
              </div>
              <div class="qr-display" id="qr-display">
                <div class="qr-status" id="qr-status">${qrStatusText}</div>
                <div class="qr-image-wrapper" id="qr-image-wrapper" ${qrImageHiddenAttr}>
                  <img id="qr-image" alt="Wireless pairing QR" src="${qrImageSrc}" />
                </div>
                <div class="qr-meta" id="qr-meta">${qrMetaText}</div>
                <code class="qr-payload" id="qr-payload">${qrPayloadText}</code>
              </div>
              <div class="input-row">
                <div class="input-group small">
                  <label for="pair-host-input">Host:</label>
                  <input type="text" id="pair-host-input" placeholder="192.168.1.50" />
                </div>
                <div class="input-group small">
                  <label for="pair-port-input">Port:</label>
                  <input type="text" id="pair-port-input" placeholder="37123" />
                </div>
                <div class="input-group small">
                  <label for="pair-code-input">Code:</label>
                  <input type="text" id="pair-code-input" placeholder="6 digits" maxlength="6" />
                </div>
              </div>
              <div class="button-group">
                <button id="pair-manual-btn" class="secondary-button">
                  <span class="codicon codicon-link"></span>
                  Pair (Manual)
                </button>
              </div>
              <div class="input-group">
                <label for="pair-qr-input">QR Payload (host:port:code)</label>
                <input type="text" id="pair-qr-input" placeholder="Paste scanned QR payload here" />
              </div>
              <div class="button-group">
                <button id="pair-qr-btn" class="secondary-button">
                  <span class="codicon codicon-diff-added"></span>
                  Pair (QR Payload)
                </button>
              </div>
              <p class="help-text">
                <strong>QR Payload:</strong> Paste scanned QR data here (format: host:port:code).
                <br />
                <strong>Troubleshooting:</strong> If pairing hangs, the code may have expired. Generate a new pairing code on your device.
              </p>
            </div>
          </div>

          <!-- Connection History Section -->
          <div class="section">
            <div class="section-header">
              <span class="codicon codicon-history section-icon"></span>
              <h3>Recent Connections</h3>
            </div>
            <div class="section-content">
              <div id="connection-history">
                ${this.generateHistoryHtml()}
              </div>
            </div>
          </div>

          <!-- Logs Section -->
          <div class="section">
            <div class="section-content">
              <button id="show-logs-btn" class="secondary-button">
                <span class="codicon codicon-output"></span>
                Show Logs
              </button>
            </div>
          </div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
  /**
   * Refresh the webview content
   */
  refresh() {
    if (this._view) {
      this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }
  /**
   * Update the webview state without full refresh
   */
  _updateWebviewState() {
    if (this._view) {
      this._view.webview.postMessage({
        type: "updateState",
        connectionStatus: this.connectionStatus,
        scrcpyStatus: this.scrcpyStatus,
        currentIp: this.currentIp,
        currentPort: this.currentPort,
        connectionHistory: this.connectionHistory.getRecentConnections(),
        qrPairing: this.qrPairingState
      });
    }
  }
  showQrPairing(update) {
    this.qrPairingState = {
      ...this.qrPairingState,
      ...update
    };
    if (update.active) {
      this.qrPairingState.message = update.message || "QR pairing session active. Scan the QR code within the next minute.";
    } else {
      this.qrPairingState.message = update.message || "No active QR session yet.";
    }
    if (this._view) {
      this._view.webview.postMessage({
        type: "qrPairingUpdate",
        state: this.qrPairingState
      });
      this._updateWebviewState();
    }
  }
  revealQrPairing() {
    var _a2, _b2;
    (_b2 = (_a2 = this._view) == null ? void 0 : _a2.show) == null ? void 0 : _b2.call(_a2, true);
    this._updateWebviewState();
  }
  /**
   * Generate simple HTML for webview (fallback)
   */
  _getSimpleHtmlForWebview(webview) {
    const nonce = getNonce();
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DroidBridge</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            padding: 16px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section h3 {
            margin-bottom: 10px;
            font-size: 14px;
            font-weight: 600;
          }
          input {
            width: 100%;
            padding: 6px 8px;
            margin-bottom: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
          }
          button {
            width: 100%;
            padding: 8px 12px;
            margin-bottom: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
          }
          button:hover {
            background-color: var(--vscode-button-hoverBackground);
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .status {
            padding: 8px;
            margin-bottom: 12px;
            border-radius: 4px;
            font-size: 13px;
          }
          .status.connected {
            background-color: var(--vscode-charts-green, #4CAF50);
            color: white;
          }
          .status.disconnected {
            background-color: var(--vscode-charts-red, #F44336);
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="section">
          <h3>\u{1F50C} Connect</h3>
          <div class="status disconnected" id="connection-status">Disconnected</div>
          <input type="text" id="ip-input" placeholder="IP Address (e.g., 192.168.1.100)" value="${this.currentIp}">
          <input type="text" id="port-input" placeholder="Port (e.g., 5555)" value="${this.currentPort}">
          <button id="connect-btn">Connect Device</button>
          <button id="disconnect-btn" disabled>Disconnect</button>
        </div>
        
        <div class="section">
          <h3>\u{1F4F1} Scrcpy</h3>
          <div class="status disconnected" id="scrcpy-status">Stopped</div>
          <button id="launch-scrcpy-btn" disabled>Launch Scrcpy</button>
          <button id="launch-scrcpy-screen-off-btn" disabled>Launch (Screen Off)</button>
          <button id="stop-scrcpy-btn" disabled>Stop Scrcpy</button>
        </div>
        
        <div class="section">
          <button id="show-logs-btn">Show Logs</button>
        </div>

        <script nonce="${nonce}">
          const vscode = acquireVsCodeApi();
          
          // Get elements
          const ipInput = document.getElementById('ip-input');
          const portInput = document.getElementById('port-input');
          const connectBtn = document.getElementById('connect-btn');
          const disconnectBtn = document.getElementById('disconnect-btn');
          const launchScrcpyBtn = document.getElementById('launch-scrcpy-btn');
          const launchScrcpyScreenOffBtn = document.getElementById('launch-scrcpy-screen-off-btn');
          const stopScrcpyBtn = document.getElementById('stop-scrcpy-btn');
          const showLogsBtn = document.getElementById('show-logs-btn');
          const connectionStatus = document.getElementById('connection-status');
          const scrcpyStatus = document.getElementById('scrcpy-status');
          
          // Event listeners
          connectBtn.addEventListener('click', () => {
            const ip = ipInput.value.trim();
            const port = portInput.value.trim();
            if (ip && port) {
              vscode.postMessage({ type: 'connectDevice', ip, port });
            }
          });
          
          disconnectBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'disconnectDevice' });
          });
          
          launchScrcpyBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'launchScrcpy' });
          });
          
          launchScrcpyScreenOffBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'launchScrcpyScreenOff' });
          });
          
          stopScrcpyBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'stopScrcpy' });
          });
          
          showLogsBtn.addEventListener('click', () => {
            vscode.postMessage({ type: 'showLogs' });
          });
          
          // Input change handlers
          ipInput.addEventListener('input', (e) => {
            vscode.postMessage({ type: 'ipChanged', value: e.target.value });
          });
          
          portInput.addEventListener('input', (e) => {
            vscode.postMessage({ type: 'portChanged', value: e.target.value });
          });
          
          // Listen for state updates
          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'updateState') {
              updateUI(message);
            }
          });
          
          function updateUI(state) {
            // Update connection status
            if (state.connectionStatus) {
              connectionStatus.textContent = 'Connected';
              connectionStatus.className = 'status connected';
              connectBtn.disabled = true;
              disconnectBtn.disabled = false;
            } else {
              connectionStatus.textContent = 'Disconnected';
              connectionStatus.className = 'status disconnected';
              connectBtn.disabled = false;
              disconnectBtn.disabled = true;
            }
            
            // Update scrcpy status
            if (state.scrcpyStatus) {
              scrcpyStatus.textContent = 'Running';
              scrcpyStatus.className = 'status connected';
              launchScrcpyBtn.disabled = true;
              launchScrcpyScreenOffBtn.disabled = true;
              stopScrcpyBtn.disabled = false;
            } else {
              scrcpyStatus.textContent = 'Stopped';
              scrcpyStatus.className = 'status disconnected';
              launchScrcpyBtn.disabled = !state.connectionStatus;
              launchScrcpyScreenOffBtn.disabled = !state.connectionStatus;
              stopScrcpyBtn.disabled = true;
            }
            
            // Update input values
            if (state.currentIp !== undefined) {
              ipInput.value = state.currentIp;
            }
            if (state.currentPort !== undefined) {
              portInput.value = state.currentPort;
            }
          }
        </script>
      </body>
      </html>`;
  }
  /**
   * Generate HTML for connection history
   */
  generateHistoryHtml() {
    const history = this.connectionHistory.getRecentConnections();
    if (history.length === 0) {
      return '<div class="history-empty">No recent connections</div>';
    }
    return history.map((entry) => {
      const displayName = entry.name || `${entry.ip}:${entry.port}`;
      const lastConnected = entry.lastConnected.toLocaleDateString();
      return `
        <div class="history-item" data-id="${entry.id}">
          <div class="history-info">
            <div class="history-name">${displayName}</div>
            <div class="history-details">${entry.ip}:${entry.port}</div>
            <div class="history-meta">Last: ${lastConnected} (${entry.connectionCount}x)</div>
          </div>
          <div class="history-actions">
            <button class="history-connect-btn" data-ip="${entry.ip}" data-port="${entry.port}" title="Connect">
              <span class="codicon codicon-plug"></span>
            </button>
            <button class="history-remove-btn" data-id="${entry.id}" title="Remove">
              <span class="codicon codicon-trash"></span>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }
  /**
   * Update the connection status and refresh the view
   */
  updateConnectionStatus(connected, ip, port) {
    this.connectionStatus = connected;
    if (ip) {
      this.currentIp = ip;
    }
    if (port) {
      this.currentPort = port;
    }
    if (connected && ip && port) {
      this.connectionHistory.addConnection(ip, port);
    }
    this._updateWebviewState();
  }
  /**
   * Update the scrcpy status and refresh the view
   */
  updateScrcpyStatus(running) {
    this.scrcpyStatus = running;
    this._updateWebviewState();
  }
  /**
   * Update the IP address and refresh the view
   */
  updateIpAddress(ip) {
    this.currentIp = ip;
    this._updateWebviewState();
  }
  /**
   * Update the port and refresh the view
   */
  updatePort(port) {
    this.currentPort = port;
    this._updateWebviewState();
  }
  /**
   * Get the current connection status
   */
  getConnectionStatus() {
    return this.connectionStatus;
  }
  /**
   * Get the current scrcpy status
   */
  getScrcpyStatus() {
    return this.scrcpyStatus;
  }
  /**
   * Get the current IP address
   */
  getCurrentIp() {
    return this.currentIp;
  }
  /**
   * Get the current port
   */
  getCurrentPort() {
    return this.currentPort;
  }
  /**
   * Reset all status to initial state
   */
  reset() {
    this.connectionStatus = false;
    this.scrcpyStatus = false;
    this.loadDefaultValues();
    this.qrPairingState = { active: false, message: "No active QR session yet." };
    this._updateWebviewState();
  }
  /**
   * Synchronize sidebar state with actual process states
   * This method should be called periodically or when state changes are detected
   */
  synchronizeState(connectionState, scrcpyState) {
    let stateChanged = false;
    if (this.connectionStatus !== connectionState.connected) {
      this.connectionStatus = connectionState.connected;
      stateChanged = true;
    }
    if (connectionState.connected && connectionState.deviceIp && connectionState.devicePort) {
      if (this.currentIp !== connectionState.deviceIp || this.currentPort !== connectionState.devicePort) {
        this.currentIp = connectionState.deviceIp;
        this.currentPort = connectionState.devicePort;
        stateChanged = true;
      }
    }
    if (this.scrcpyStatus !== scrcpyState.running) {
      this.scrcpyStatus = scrcpyState.running;
      stateChanged = true;
    }
    if (stateChanged) {
      this._updateWebviewState();
    }
  }
  /**
   * Force refresh the sidebar state from configuration and process managers
   */
  forceRefresh() {
    this.loadDefaultValues();
    this.refresh();
  }
  /**
   * Get current sidebar state for external synchronization
   */
  getCurrentState() {
    return {
      connectionStatus: this.connectionStatus,
      scrcpyStatus: this.scrcpyStatus,
      currentIp: this.currentIp,
      currentPort: this.currentPort,
      qrPairing: this.qrPairingState
    };
  }
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.configChangeListener) {
      this.configChangeListener.dispose();
    }
    if (this.themeChangeListener) {
      this.themeChangeListener.dispose();
    }
  }
};
__name(_DroidBridgeSidebarProvider, "DroidBridgeSidebarProvider");
// Must match the view id in package.json (contributes.views["droidbridge"][0].id)
__publicField(_DroidBridgeSidebarProvider, "viewType", "droidbridge-sidebar");
var DroidBridgeSidebarProvider = _DroidBridgeSidebarProvider;
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
__name(getNonce, "getNonce");

// src/extension.ts
var vscode8 = __toESM(require("vscode"));
var extensionState;
var logger;
var commandManager;
var processManager;
var configManager;
var binaryManager;
var sidebarProvider;
var themeManager;
function activate(context) {
  logger = new Logger4();
  logger.info("DroidBridge extension is activating...");
  try {
    initializeManagers(context);
    initializeExtensionState();
    registerVSCodeComponents(context);
    setupConfigurationWatchers(context);
    validateBinariesAsync();
    extensionState.initialized = true;
    logger.info("DroidBridge extension activated successfully");
  } catch (error) {
    logger.error("Failed to activate DroidBridge extension", error);
    vscode8.window.showErrorMessage("Failed to activate DroidBridge extension. Check the logs for details.");
    throw error;
  }
}
__name(activate, "activate");
function initializeManagers(context) {
  logger.info("Initializing manager classes...");
  configManager = new ConfigManager2();
  logger.debug("ConfigManager initialized");
  themeManager = ThemeManager.getInstance();
  logger.debug("ThemeManager initialized");
  binaryManager = new BinaryManager3(context.extensionPath, configManager);
  logger.debug("BinaryManager initialized");
  processManager = new ProcessManager2(binaryManager, logger);
  logger.debug("ProcessManager initialized");
  sidebarProvider = new DroidBridgeSidebarProvider(
    vscode8.Uri.file(context.extensionPath),
    context,
    configManager
  );
  logger.debug("DroidBridgeSidebarProvider initialized");
  logger.info(`Sidebar provider class loaded with viewType=${DroidBridgeSidebarProvider.viewType}`);
  commandManager = new CommandManager(processManager, configManager, logger, binaryManager, sidebarProvider);
  logger.debug("CommandManager initialized");
  commandManager.setSidebarProvider(sidebarProvider);
  logger.debug("Manager cross-references established");
}
__name(initializeManagers, "initializeManagers");
function initializeExtensionState() {
  extensionState = {
    connection: {
      connected: false
    },
    scrcpy: {
      running: false
    },
    initialized: false,
    binariesValidated: false
  };
  logger.debug("Extension state initialized");
}
__name(initializeExtensionState, "initializeExtensionState");
function registerVSCodeComponents(context) {
  logger.info("Registering VSCode components...");
  const sidebarDisposable = vscode8.window.registerWebviewViewProvider(
    DroidBridgeSidebarProvider.viewType,
    // Keep in sync with package.json
    sidebarProvider
  );
  logger.debug(`Registered webview view provider for id: ${DroidBridgeSidebarProvider.viewType}`);
  logger.info("Sidebar provider registration complete");
  context.subscriptions.push(sidebarDisposable);
  logger.debug("Sidebar webview provider registered");
  commandManager.registerCommands(context);
  logger.debug("All commands registered");
  logger.info("All VSCode components registered successfully");
}
__name(registerVSCodeComponents, "registerVSCodeComponents");
function setupConfigurationWatchers(context) {
  logger.info("Setting up configuration watchers...");
  const configDisposable = configManager.onConfigurationChanged(() => {
    logger.info("Configuration changed, refreshing extension state");
    sidebarProvider.refresh();
    validateBinariesAsync();
  });
  context.subscriptions.push(configDisposable);
  logger.debug("Configuration watchers set up");
}
__name(setupConfigurationWatchers, "setupConfigurationWatchers");
function validateBinariesAsync() {
  binaryManager.setDownloadProgressCallback((progress) => {
    logger.info(`Downloading ${progress.binary}: ${progress.percentage}% (${progress.downloaded}/${progress.total} bytes)`);
  });
  binaryManager.validateBinaries().then((result) => {
    extensionState.binariesValidated = result.adbValid && result.scrcpyValid;
    if (extensionState.binariesValidated) {
      logger.info("All binaries validated successfully");
      binaryManager.getBinaryInfo().then((info) => {
        logger.info(`ADB: ${info.adb.path} (${info.adb.source}${info.adb.version ? `, v${info.adb.version}` : ""})`);
        logger.info(`Scrcpy: ${info.scrcpy.path} (${info.scrcpy.source}${info.scrcpy.version ? `, v${info.scrcpy.version}` : ""})`);
      });
    } else {
      logger.error("Binary validation failed", new Error(result.errors.join(", ")));
      binaryManager.needsDownload().then((downloadInfo) => {
        if (downloadInfo.needed) {
          vscode8.window.showWarningMessage(
            `DroidBridge needs to download missing binaries: ${downloadInfo.binaries.join(", ")}. This will happen automatically when needed.`,
            "Show Logs"
          ).then((selection) => {
            if (selection === "Show Logs") {
              logger.show();
            }
          });
        } else {
          vscode8.window.showWarningMessage(
            "Some DroidBridge binaries are not available. Check the logs for details.",
            "Show Logs"
          ).then((selection) => {
            if (selection === "Show Logs") {
              logger.show();
            }
          });
        }
      });
    }
  }).catch((error) => {
    logger.error("Failed to validate binaries", error);
    extensionState.binariesValidated = false;
  });
}
__name(validateBinariesAsync, "validateBinariesAsync");
async function deactivate() {
  if (logger) {
    logger.info("DroidBridge extension is deactivating...");
  }
  const cleanupTasks = [];
  try {
    if (commandManager) {
      logger.debug("Disposing command manager...");
      commandManager.dispose();
    }
    if (sidebarProvider) {
      logger.debug("Disposing sidebar provider...");
      sidebarProvider.dispose();
    }
    if (processManager) {
      logger.debug("Cleaning up process manager...");
      cleanupTasks.push(processManager.cleanup());
    }
    await Promise.all(cleanupTasks);
    if (themeManager) {
      logger.debug("Disposing theme manager...");
      themeManager.dispose();
    }
    if (extensionState) {
      extensionState.initialized = false;
      extensionState.binariesValidated = false;
      extensionState.connection.connected = false;
      extensionState.scrcpy.running = false;
    }
    if (logger) {
      logger.info("DroidBridge extension deactivated successfully");
      logger.dispose();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error during extension deactivation:", errorMessage);
    if (logger) {
      try {
        logger.error("Error during extension deactivation", error instanceof Error ? error : void 0);
      } catch (logError) {
        console.error("Failed to log deactivation error:", logError);
      }
    }
  } finally {
    extensionState = void 0;
    logger = void 0;
    commandManager = void 0;
    processManager = void 0;
    configManager = void 0;
    binaryManager = void 0;
    sidebarProvider = void 0;
    themeManager = void 0;
  }
}
__name(deactivate, "deactivate");
function getExtensionState() {
  return extensionState;
}
__name(getExtensionState, "getExtensionState");
function getLogger() {
  return logger;
}
__name(getLogger, "getLogger");
function isExtensionInitialized() {
  return (extensionState == null ? void 0 : extensionState.initialized) === true;
}
__name(isExtensionInitialized, "isExtensionInitialized");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate,
  getExtensionState,
  getLogger,
  isExtensionInitialized
});
//# sourceMappingURL=extension.js.map
