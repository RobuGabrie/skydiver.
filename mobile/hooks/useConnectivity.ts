import { useState, useEffect } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { useBle } from '../lib/BleContext'
import { ConnectionMode } from '../lib/types'

export function useConnectivity() {
  const [wifiConnected, setWifiConnected] = useState(true)
  const { connectedId, rssi } = useBle()

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setWifiConnected(!!(state.isConnected && state.type === 'wifi'))
    })
    return unsubscribe
  }, [])

  const bleConnected = connectedId !== null
  const mode: ConnectionMode = bleConnected ? 'ble' : wifiConnected ? 'wifi' : 'offline'

  return { mode, isConnected: wifiConnected, bleConnected, deviceRssi: rssi }
}
