import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleSignOutAndReset = async () => {
    try {
      await AsyncStorage.multiRemove([
        'sbni_token',
        'justpaisa_token',
        'sbni_user',
        'sbni_role',
        'sbni_lender_profile',
        'sbni_lender_loc_prompted',
      ]);
    } catch {
      // Ignore
    }
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={36} color="#dc2626" />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              An unexpected error occurred while loading this view. You can retry reloading or sign out to reset your session.
            </Text>

            {this.state.error ? (
              <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 8 }}>
                <Text style={styles.errorText}>
                  {this.state.error.message || String(this.state.error)}
                </Text>
              </ScrollView>
            ) : null}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={this.handleReset}
                activeOpacity={0.85}
              >
                <RefreshCw size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Reload Screen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={this.handleSignOutAndReset}
                activeOpacity={0.85}
              >
                <LogOut size={16} color="#dc2626" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Sign Out & Reset Session</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  errorBox: {
    maxHeight: 90,
    width: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  errorText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#dc2626',
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  secondaryBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
