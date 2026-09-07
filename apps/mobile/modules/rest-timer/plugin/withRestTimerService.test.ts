import { describe, expect, it } from 'vitest'
import {
  PERMISSIONS,
  SERVICE_NAME,
  SPECIAL_USE_SUBTYPE,
  addRestTimerService,
} from './withRestTimerService'

type Manifest = Parameters<typeof addRestTimerService>[0]

function bareManifest(): Manifest {
  return {
    manifest: {
      $: { 'xmlns:android': 'http://schemas.android.com/apk/res/android' },
      'uses-permission': [{ $: { 'android:name': 'android.permission.INTERNET' } }],
      application: [
        {
          $: { 'android:name': '.MainApplication' },
          service: [{ $: { 'android:name': 'some.other.Service' } }],
        },
      ],
    },
  } as unknown as Manifest
}

function names(list: Array<{ $: Record<string, string> }> | undefined) {
  return (list ?? []).map((e) => e.$['android:name'])
}

describe('addRestTimerService', () => {
  it('adds the foreground-service permissions without touching existing ones', () => {
    const m = addRestTimerService(bareManifest())
    expect(names(m.manifest['uses-permission'])).toEqual(['android.permission.INTERNET', ...PERMISSIONS])
  })

  it('declares the specialUse service with its justification, next to existing services', () => {
    const m = addRestTimerService(bareManifest())
    const services = m.manifest.application![0].service!
    expect(names(services)).toEqual(['some.other.Service', SERVICE_NAME])
    const svc = services[1] as any
    expect(svc.$).toEqual({
      'android:name': SERVICE_NAME,
      'android:foregroundServiceType': 'specialUse',
      'android:exported': 'false',
    })
    expect(svc.property).toEqual([
      {
        $: {
          'android:name': 'android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE',
          'android:value': SPECIAL_USE_SUBTYPE,
        },
      },
    ])
  })

  it('is idempotent — prebuild may run it over an already-modified manifest', () => {
    const m = addRestTimerService(addRestTimerService(bareManifest()))
    expect(names(m.manifest['uses-permission']).filter((n) => PERMISSIONS.includes(n))).toEqual(PERMISSIONS)
    expect(names(m.manifest.application![0].service).filter((n) => n === SERVICE_NAME)).toHaveLength(1)
  })

  it('uses the same channel-agnostic justification the Play Console declaration needs', () => {
    expect(SPECIAL_USE_SUBTYPE).toBe('workout rest-timer countdown')
    expect(PERMISSIONS).toEqual([
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_SPECIAL_USE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.WAKE_LOCK',
    ])
  })
})
