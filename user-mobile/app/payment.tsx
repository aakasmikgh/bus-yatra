import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Platform,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import api from '../utils/api';

const COLORS = {
    PRIMARY: '#007AFF', // Blue theme
    BACKGROUND: '#F5F5F5',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    BORDER: '#EEE',
    GREEN: '#28A745',
};

const PAYMENT_METHODS = [
    { id: 'cash', name: 'Cash', icon: 'cash', description: 'Pay manually at the counter' },
    { id: 'khalti', name: 'Khalti', icon: 'wallet', description: 'Faster, Safer, Easier' },
    { id: 'stripe', name: 'Stripe', icon: 'credit-card-outline', description: 'Visa/MasterCard/Apple Pay' },
];

export default function PaymentScreen() {
    const params = useLocalSearchParams();
    console.log('Payment Screen Params:', params);
    const [selectedMethod, setSelectedMethod] = useState('cash');
    const [loading, setLoading] = useState(false);

    // 1. Listen for the "Return" from the browser via deep link
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { path, queryParams } = Linking.parse(event.url);
            console.log('--- Deep Link Received ---', { path, queryParams, url: event.url });

            // Handle both Expo Go (null path, but queryParams exist) and standalone
            const status = queryParams?.status || (event.url.includes('status=success') ? 'success' : event.url.includes('status=failure') ? 'failure' : null);

            if (status === 'success' || path === 'my-trips') {
                console.log("Payment Verified via Deep Link!");
                router.replace('/(tabs)/my-trips');
            } else if (status === 'failure' || status === 'User-cancelled') {
                setLoading(false);
                Alert.alert("Payment Cancelled", "The payment process was not completed.");
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if the app was opened from a deep link initially
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => subscription.remove();
    }, []);

    const grandTotal = params.grandTotal || '0';
    const bookingId = params.bookingId;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView />
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Select Payment Method</Text>
                    <View style={{ width: 40 }} />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Amount Section */}
                <View style={styles.amountCard}>
                    <Text style={styles.amountLabel}>Total Payable Amount</Text>
                    <Text style={styles.amountValue}>NPR {Number(grandTotal).toLocaleString()}</Text>
                </View>

                {/* Methods List */}
                <Text style={styles.sectionTitle}>All Payment Options</Text>

                {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                        key={method.id}
                        style={[
                            styles.methodItem,
                            selectedMethod === method.id && styles.methodItemSelected
                        ]}
                        onPress={() => setSelectedMethod(method.id)}
                    >
                        <View style={styles.methodIconContainer}>
                            <MaterialCommunityIcons
                                name={method.icon as any}
                                size={28}
                                color={selectedMethod === method.id ? COLORS.PRIMARY : COLORS.TEXT_SUB}
                            />
                        </View>
                        <View style={styles.methodInfo}>
                            <Text style={styles.methodName}>{method.name}</Text>
                            <Text style={styles.methodDesc}>{method.description}</Text>
                        </View>
                        {selectedMethod === method.id && (
                            <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.PRIMARY} />
                        )}
                    </TouchableOpacity>
                ))}

                {/* Info Text */}
                <View style={styles.infoBox}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.TEXT_SUB} />
                    <Text style={styles.infoText}>
                        Your payment is secured and encrypted. Please select your preferred method to proceed.
                    </Text>
                </View>

            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.payButton, loading && { opacity: 0.7 }]}
                    onPress={async () => {
                        console.log('Current Selected Method:', selectedMethod);
                        if (selectedMethod === 'khalti') {
                            try {
                                setLoading(true);

                                // Get dynamic base URL for Expo compatibility
                                const appRedirectUrl = Linking.createURL('/');
                                console.log('Generated App Redirect URL:', appRedirectUrl);

                                const response = await api.post('/payment/initialize-khalti', {
                                    bookingId: bookingId,
                                    amount: grandTotal,
                                    appRedirectUrl: appRedirectUrl
                                });

                                if (response.data.success) {
                                    const { paymentUrl } = response.data.data;
                                    console.log('Opening Khalti in External Browser:', paymentUrl);

                                    // Open the system browser (Chrome/Safari)
                                    const supported = await Linking.canOpenURL(paymentUrl);
                                    if (supported) {
                                        await Linking.openURL(paymentUrl);
                                        // We stay in loading state while user is in browser
                                    } else {
                                        setLoading(false);
                                        Alert.alert("Error", "Unable to open the browser.");
                                    }
                                }
                            } catch (error: any) {
                                console.error('Payment Error:', error);
                                Alert.alert('Error', error.response?.data?.error || 'Failed to initialize payment');
                            } finally {
                                setLoading(false);
                            }
                        } else if (selectedMethod === 'stripe') {
                            try {
                                setLoading(true);
                                const response = await api.post('/payment/initialize-stripe', {
                                    bookingId: bookingId,
                                    amount: grandTotal
                                });

                                if (response.data.success) {
                                    const { paymentUrl } = response.data.data;
                                    console.log('Redirecting to Stripe Checkout:', paymentUrl);

                                    // Navigate to a dedicated checkout screen with the URL
                                    router.push({
                                        pathname: '/checkout',
                                        params: {
                                            url: paymentUrl,
                                            bookingId: bookingId
                                        }
                                    });
                                }
                            } catch (error: any) {
                                console.error('Stripe Error:', error);
                                Alert.alert('Error', error.response?.data?.error || 'Failed to initialize Stripe');
                            } finally {
                                setLoading(false);
                            }
                        } else {
                            try {
                                setLoading(true);
                                // Update booking status to Confirmed for Cash
                                console.log(`Attempting to confirm booking ${bookingId} for Cash`);

                                if (!bookingId) {
                                    throw new Error('Booking ID is missing. Please go back and try again.');
                                }

                                await api.put(`/bookings/${bookingId}/status`, {
                                    status: 'Confirmed',
                                    paymentMethod: 'Cash'
                                });

                                router.push({
                                    pathname: '/booking-success',
                                    params: { ...params }
                                });
                            } catch (error: any) {
                                console.error('Cash Confirmation Error:', error);
                                Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to confirm booking');
                            } finally {
                                setLoading(false);
                            }
                        }
                    }}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.payButtonText}>
                            {selectedMethod === 'cash' ? 'Confirm Booking' : 'Pay Now'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    header: {
        backgroundColor: COLORS.PRIMARY,
        paddingBottom: 15,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
    },
    amountCard: {
        backgroundColor: COLORS.PRIMARY,
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    amountLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginBottom: 8,
    },
    amountValue: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '800',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
        marginLeft: 5,
    },
    methodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.CARD_BG,
        padding: 18,
        borderRadius: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    methodItemSelected: {
        borderColor: COLORS.PRIMARY,
        backgroundColor: '#F0F7FF',
    },
    methodIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    methodInfo: {
        flex: 1,
        marginLeft: 15,
    },
    methodName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
    },
    methodDesc: {
        fontSize: 12,
        color: COLORS.TEXT_SUB,
        marginTop: 2,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E9E9E9',
        padding: 15,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.TEXT_SUB,
        marginLeft: 10,
        lineHeight: 18,
    },
    footer: {
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        backgroundColor: COLORS.CARD_BG,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER,
    },
    payButton: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 15,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
