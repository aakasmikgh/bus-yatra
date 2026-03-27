import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function EsewaWebviewScreen() {
    const params = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const webViewRef = useRef<WebView>(null);

    // The backend redirector URL
    const paymentUrl = params.paymentUrl as string;
    const successUrl = params.success_url as string;
    const failureUrl = params.failure_url as string;

    useEffect(() => {
        if (!paymentUrl) {
            Alert.alert('Error', 'Payment configuration missing.');
            router.back();
        }
    }, [paymentUrl]);

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
        const { url } = navState;
        console.log('--- WebView Navigated ---');
        console.log('Current URL:', url);

        // IGNORE the initial redirector URL
        // It contains the success/failure URLs in its query string
        if (url.includes('/api/payment/render-form')) {
            console.log('Ignoring redirector preparation page...');
            return;
        }

        // Check for ACTUAL redirect to success/failure pages
        // eSewa redirects to our backend verify endpoint on success
        if (url.startsWith(successUrl)) {
            console.log('SUCCESS detected! Navigating to My Trips...');
            Alert.alert('Payment Successful', 'Your booking has been confirmed.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/my-trips') }
            ]);
        } else if (url.startsWith(failureUrl)) {
            console.log('FAILURE detected! Returning to payment screen...');
            Alert.alert('Payment Cancelled', 'The payment process was not completed.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        }
    };

    if (!paymentUrl) return null;

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                        <MaterialCommunityIcons name="close" size={26} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>eSewa Secure Payment</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: paymentUrl }}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    scalesPageToFit={true}
                    style={styles.webview}
                />

                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#60bb46" />
                        <Text style={styles.loadingText}>Initializing Secure Payment...</Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 50,
    },
    closeButton: {
        padding: 5,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    webview: {
        flex: 1,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    }
});
