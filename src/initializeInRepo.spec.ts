import { initializeInRepo } from './initializeInRepo'

describe('initializeInRepo', () => {
  it('should initialize in solid repo', async () => {
    // const statInstance = await initializeInRepo('.') // TODO use solid repo in fixtures, not current dir, but we need to find a fix for https://github.com/nodegit/nodegit/issues/1679
    const statInstance = await initializeInRepo('fixtures/solid')
    expect(statInstance.output).toMatchSnapshot()
  })
})
