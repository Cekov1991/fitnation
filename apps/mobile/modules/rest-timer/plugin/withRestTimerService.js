// Config plugin for the Android rest-timer foreground service (spec 0013 R6).
// `android/` is generated (CNG), so the manifest entries must come from here.
// Registered in app.json `plugins`.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins')

const SERVICE_NAME = 'expo.modules.resttimer.RestTimerService'
const PERMISSIONS = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
  'android.permission.POST_NOTIFICATIONS',
  // The service holds a partial wake lock for the rest so its countdown keeps
  // running while the phone is locked.
  'android.permission.WAKE_LOCK',
]
// Android 14+ reviews `specialUse` services against this justification; the
// same text goes in the Play Console foreground-service declaration.
const SPECIAL_USE_SUBTYPE = 'workout rest-timer countdown'

/**
 * Pure manifest mutation, exported for tests. Idempotent: re-running prebuild
 * must not duplicate the service or the permissions.
 * @param {import('expo/config-plugins').AndroidConfig.Manifest.AndroidManifest} manifest
 */
function addRestTimerService(manifest) {
  AndroidConfig.Permissions.ensurePermissions(manifest, PERMISSIONS)

  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest)
  const others = (app.service ?? []).filter((s) => s.$?.['android:name'] !== SERVICE_NAME)
  app.service = [
    ...others,
    {
      $: {
        'android:name': SERVICE_NAME,
        'android:foregroundServiceType': 'specialUse',
        'android:exported': 'false',
      },
      property: [
        {
          $: {
            'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
            'android:value': SPECIAL_USE_SUBTYPE,
          },
        },
      ],
    },
  ]
  return manifest
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withRestTimerService = (config) =>
  withAndroidManifest(config, (config) => {
    config.modResults = addRestTimerService(config.modResults)
    return config
  })

module.exports = withRestTimerService
module.exports.addRestTimerService = addRestTimerService
module.exports.SERVICE_NAME = SERVICE_NAME
module.exports.PERMISSIONS = PERMISSIONS
module.exports.SPECIAL_USE_SUBTYPE = SPECIAL_USE_SUBTYPE
