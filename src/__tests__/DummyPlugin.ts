class DummyPlugin {
  constructor() {
    // nothing to do
  } 

  async handle(spreadStat: { pattern: number }) {
    if (spreadStat.pattern === 1) {
      return { someconfig: 1 };
    }
    if (spreadStat.pattern === 2) {
      throw new Error();
    }
    return undefined;
  }
}

module.exports = DummyPlugin;
