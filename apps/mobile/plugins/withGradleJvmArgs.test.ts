import { describe, expect, it } from 'vitest'
import { JVM_ARGS, setJvmArgs } from './withGradleJvmArgs'

type Properties = Parameters<typeof setJvmArgs>[0]

const template: Properties = [
  { type: 'comment', value: 'Specifies the JVM arguments used for the daemon process.' },
  { type: 'property', key: 'org.gradle.jvmargs', value: '-Xmx2048m -XX:MaxMetaspaceSize=512m' },
  { type: 'property', key: 'org.gradle.parallel', value: 'true' },
]

describe('setJvmArgs', () => {
  it("replaces the template's daemon memory in place", () => {
    expect(setJvmArgs(template)).toEqual([
      template[0],
      { type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS },
      template[2],
    ])
  })

  it('appends the setting when the template has none, and is idempotent', () => {
    const once = setJvmArgs([template[2]])
    expect(once).toEqual([template[2], { type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS }])
    expect(setJvmArgs(once)).toEqual(once)
  })
})
