import React, { useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import api from '../utils/api';

const { width } = Dimensions.get('window');

const COLORS = {
    PRIMARY: '#007AFF',
    GREEN: '#28A745',
    BACKGROUND: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
};

export default function BookingSuccessScreen() {
    const params = useLocalSearchParams();

    useEffect(() => {
        // No need to save booking here as it was already created in BookingSummary
        // and confirmed in PaymentScreen.
    }, []);
    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Success Icon */}
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="check-circle" size={120} color={COLORS.GREEN} />
                    </View>

                    {/* Success Text */}
                    <Text style={styles.title}>Ticket is booked!</Text>
                    <Text style={styles.message}>
                        Your trip is confirmed. We have sent the ticket details to your email and phone number.
                    </Text>

                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.detailsButton}
                        onPress={() => router.replace('/(tabs)/my-trips')}
                    >
                        <Text style={styles.detailsButtonText}>View My Tickets</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.replace('/(tabs)')}
                    >
                        <Text style={styles.homeButtonText}>Go to Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        marginBottom: 30,
        // Simple scale animation could be added here if needed
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.TEXT_SUB,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    detailsButton: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 15,
        paddingVertical: 18,
        alignItems: 'center',
        marginBottom: 12,
    },
    detailsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    homeButton: {
        backgroundColor: '#fff',
        borderRadius: 15,
        paddingVertical: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    homeButtonText: {
        color: COLORS.TEXT_SUB,
        fontSize: 16,
        fontWeight: '700',
    },
});
