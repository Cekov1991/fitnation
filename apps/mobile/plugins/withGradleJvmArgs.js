// Config plugin that gives the Gradle daemon more memory for release builds.
// With R8 on (expo-build-properties `enableMinifyInReleaseBuilds`), the
// template's 512 MB metaspace runs out during `lintVitalAnalyzeRelease`
// ("OutOfMemoryError: Metaspace"). `android/` is generated (CNG), so the
// property must come from here. Registered in app.json `plugins`.
const { withGradleProperties } = require('expo/config-plugins')

const JVM_ARGS_KEY = 'org.gradle.jvmargs'
const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m'

/** @typedef {import('expo/config-plugins').AndroidConfig.Properties.PropertiesItem} PropertiesItem */

/**
 * Pure gradle.properties mutation, exported for tests. Replaces the template's
 * value in place, or appends it when the template has none.
 * @param {PropertiesItem[]} properties
 * @returns {PropertiesItem[]}
 */
function setJvmArgs(properties) {
  const index = properties.findIndex((p) => p.type === 'property' && p.key === JVM_ARGS_KEY)
  /** @type {PropertiesItem} */
  const item = { type: 'property', key: JVM_ARGS_KEY, value: JVM_ARGS }
  if (index === -1) return [...properties, item]
  return properties.map((p, i) => (i === index ? item : p))
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withGradleJvmArgs = (config) =>
  withGradleProperties(config, (config) => {
    config.modResults = setJvmArgs(config.modResults)
    return config
  })

module.exports = withGradleJvmArgs
module.exports.setJvmArgs = setJvmArgs
module.exports.JVM_ARGS = JVM_ARGS
