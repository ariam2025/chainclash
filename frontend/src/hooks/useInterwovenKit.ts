/**
 * useInterwovenKit — central hook
 *
 * Both hook imports are static (ES module compatible).
 * We read MockKitContext with useContext — this is always safe because
 * reading a context with no provider just returns null (doesn't throw).
 * So we can import from both without either crashing.
 *
 * MOCK_MODE=true  → MockInterwovenKitProvider is mounted (see providers.tsx), useContext returns data
 * MOCK_MODE=false → Real InterwovenKitProvider is mounted, we call the real hook
 */
import { useContext } from 'react'
import { useInterwovenKit as _useRealKit } from '@initia/interwovenkit-react'
import { DISCONNECTED_MOCK_KIT, MockKitContext } from '../lib/MockInterwovenKit'
import { MOCK_MODE } from '../lib/constants'

export function useInterwovenKit() {
  // Always safe — returns null if MockInterwovenKitProvider isn't mounted
  const mockValue = useContext(MockKitContext)

  if (MOCK_MODE) {
    return mockValue ?? DISCONNECTED_MOCK_KIT
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return _useRealKit()
}
