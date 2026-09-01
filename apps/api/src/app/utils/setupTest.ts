// Mocking mongoose to prevent actual DB connections
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(true),
    connection: {
      on: jest.fn(),
      once: jest.fn(),
      close: jest.fn(),
      startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      }),
    },
    startSession: jest.fn().mockResolvedValue({
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
    }),
  };
});

// Mock ioredis to prevent open handles
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn().mockResolvedValue("OK"),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  }));
});

// Mock bullmq entirely
jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({}),
    on: jest.fn(),
    emit: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

// Mock bullmq ioredis config
jest.mock("../config/ioredis.config", () => ({
  bullMqRedis: {
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue("OK"),
    disconnect: jest.fn().mockResolvedValue("OK"),
  },
  redisConfig: {},
}));
