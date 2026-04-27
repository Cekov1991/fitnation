import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import * as Updates from 'expo-updates'

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = async () => {
    try {
      await Updates.reloadAsync()
    } catch {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0A0A0A',
          paddingHorizontal: 32,
        }}
      >
        <AlertTriangle size={56} color="#EF4444" />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: '700',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Something went wrong
        </Text>
        <Text
          style={{
            color: '#9CA3AF',
            fontSize: 14,
            marginTop: 8,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </Text>
        <TouchableOpacity
          onPress={this.handleReload}
          style={{
            marginTop: 32,
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 14,
            backgroundColor: '#2563EB',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Reload App</Text>
        </TouchableOpacity>
      </View>
    )
  }
}
