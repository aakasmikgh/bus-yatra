import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator, SafeAreaView, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function CheckoutScreen() {
    const { url, bookingId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);

    const handleUrl = (navUrl: string) => {
        console.log('WebView Navigation State:', navUrl);

        // Final fallback: If we are on the stripe-success or stripe-cancel endpoints,
        // we use the backend's provided result
        if (navUrl.includes('stripe-success')) {
            // We wait just a moment for the HTML to render or detection string
            console.log('Success Page Reached! Transitioning natively...');
            router.replace('/(tabs)/my-trips');
            return false;
        } else if (navUrl.includes('stripe-cancel')) {
            console.log('Cancel Page Reached');
            router.back();
            return false;
        }
        return true;
    };

    const onNavigationStateChange = (navState: any) => {
        handleUrl(navState.url);
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <MaterialCommunityIcons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <View style={styles.webviewContainer}>
                <WebView
                    source={{ uri: url as string }}
                    onNavigationStateChange={onNavigationStateChange}
                    onShouldStartLoadWithRequest={(request) => handleUrl(request.url)}
                    onLoadStart={() => setLoading(true)}
                    onLoadEnd={() => setLoading(false)}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    )}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    webviewContainer: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});
