import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    TextInput,
    Platform,
    Modal,
    Dimensions,
    KeyboardAvoidingView,
    Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useIsFocused } from '@react-navigation/native';
import api from '../utils/api';

const { height } = Dimensions.get('window');

const COLORS = {
    PRIMARY: '#007AFF', // Blue theme
    BACKGROUND: '#F5F5F5',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    RED: '#C00',
    BLUE_DARK: '#0056b3',
    GREEN: '#28A745',
    BORDER: '#EEE',
};

// Removed MOCK_PROMO_CODES as we fetch from DB now

export default function BookingSummaryScreen() {
    const params = useLocalSearchParams();
    const isFocused = useIsFocused();
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoInput, setPromoInput] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<any>(null);

    // Dynamic states
    const [boardingPoints, setBoardingPoints] = useState<string[]>([]);
    const [selectedBoardingPoint, setSelectedBoardingPoint] = useState('');
    const [passengerName, setPassengerName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [showBoardingModal, setShowBoardingModal] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
    const [couponsLoading, setCouponsLoading] = useState(false);

    // Timer logic
    useEffect(() => {
        if (!isFocused) return;

        if (timeLeft <= 0) {
            alert('Time expired. Returning to bus list.');
            router.back();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isFocused]);

    // Fetch Boarding Points
    useEffect(() => {
        const fetchRouteDetails = async () => {
            console.log('Fetching route details for:', params.routeId);
            try {
                const response = await api.get('/routes');
                if (response.data.success) {
                    console.log('Routes found in DB:', response.data.data.length);
                    // Find matching route - try both String and ID comparison
                    const currentRoute = response.data.data.find((r: any) =>
                        String(r._id) === String(params.routeId)
                    );

                    if (currentRoute) {
                        console.log('Match found:', currentRoute.origin?.name, 'to', currentRoute.destination?.name);
                        console.log('Boarding points available:', currentRoute.boardingPoints);
                        if (currentRoute.boardingPoints && currentRoute.boardingPoints.length > 0) {
                            setBoardingPoints(currentRoute.boardingPoints);
                            setSelectedBoardingPoint(currentRoute.boardingPoints[0]);
                        } else {
                            console.log('Route has no boarding points defined.');
                            // Fallback if none defined
                            setBoardingPoints(['Counter/Boarding Point']);
                            setSelectedBoardingPoint('Counter/Boarding Point');
                        }
                    } else {
                        console.log('Route ID', params.routeId, 'not found in list. Available IDs:', response.data.data.map((r: any) => r._id));
                    }
                }
            } catch (err) {
                console.error('Failed to fetch route details:', err);
            }
        };
        if (params.routeId) fetchRouteDetails();
    }, [params.routeId]);

    // Fetch Available Coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            setCouponsLoading(true);
            try {
                const response = await api.get('/coupons');
                if (response.data.success) {
                    setAvailableCoupons(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch coupons:', err);
            } finally {
                setCouponsLoading(false);
            }
        };
        if (showPromoModal) fetchCoupons();
    }, [showPromoModal]);

    // Track selection changes for logs
    useEffect(() => {
        if (selectedBoardingPoint) {
            console.log('--- BOARDING POINT UPDATED: ---', selectedBoardingPoint);
        }
    }, [selectedBoardingPoint]);

    // Derived values
    const totalPrice = parseInt(String(params.totalPrice)) || 0;
    const passengerCount = Number(params.passengerCount) || 1;
    const convenienceFee = 0;

    let discount = 0;
    if (appliedPromo) {
        if (appliedPromo.discountType === 'Percentage') {
            discount = (totalPrice * appliedPromo.discountValue) / 100;
        } else {
            // Cash discount is typically flat, but user requested "per seat" logic earlier.
            // However, the prompt says "at side there should be dropdown selecting either percentage or cash".
            // Typically "Cash" refers to a fixed flat amount (e.g. Rs 50 off total) or "per seat".
            // Let's stick to flat cash unless it's intended to be per-seat.
            // Actually, the previous logic was "discountPerSeat * passengerCount".
            // Let's keep it as flat for now as "Rs. 50" usually means total.
            // Re-reading user request: "selecting either it is percentage or cash for the discount add the logic respectively"
            // If it's cash, it's usually flat. I'll make it flat for cash and % for percentage.
            discount = appliedPromo.discountValue;
        }
    }

    const grandTotal = totalPrice + convenienceFee - discount;

    const handleApplyPromo = (promo: any) => {
        setAppliedPromo(promo);
        setShowPromoModal(false);
    };

    const handleSelectPromo = async (promo: any) => {
        try {
            const response = await api.post('/coupons/validate', { code: promo.code });
            if (response.data.success) {
                handleApplyPromo(promo);
            }
        } catch (err: any) {
            Alert.alert('Invalid Promo', err.response?.data?.message || 'Promo code already redeemed');
        }
    };

    const handlePromoInputApply = async () => {
        if (!promoInput.trim()) return;
        try {
            const response = await api.post('/coupons/validate', { code: promoInput });
            if (response.data.success) {
                handleApplyPromo(response.data.data);
            } else {
                Alert.alert('Invalid Promo', response.data.message || 'Coupon not valid');
            }
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Invalid Promo Code');
        }
    };

    const handlePayNow = async () => {
        if (!passengerName.trim()) {
            Alert.alert('Missing Information', 'add name');
            return;
        }
        if (!phoneNumber.trim()) {
            Alert.alert('Missing Information', 'add phone number');
            return;
        }
        if (!emailAddress.trim()) {
            Alert.alert('Missing Information', 'add gmail');
            return;
        }
        if (!selectedBoardingPoint) {
            Alert.alert('Missing Information', 'Please select a Boarding Point');
            return;
        }
        if (!acceptedTerms) {
            Alert.alert('Terms Required', 'Please accept the Terms & Conditions');
            return;
        }

        try {
            // Create booking record first (Pending status)
            const bookingData = {
                route: params.routeId,
                bus: params.busId,
                seats: (params.selectedSeats as string).split(',').map(s => s.trim()),
                bookingDate: params.date,
                totalPrice: grandTotal,
                contactName: passengerName,
                contactPhone: phoneNumber,
                contactEmail: emailAddress,
                boardingPoint: selectedBoardingPoint,
                promoCode: appliedPromo ? appliedPromo.code : '',
                status: 'Pending'
            };

            const response = await api.post('/bookings', bookingData);
            console.log('Booking Creation Response:', response.data);

            if (response.data.success) {
                console.log('Navigating to payment with bookingId:', response.data.data._id);
                router.push({
                    pathname: '/payment',
                    params: {
                        ...params,
                        bookingId: response.data.data._id,
                        grandTotal: grandTotal,
                        contactName: passengerName,
                        contactPhone: phoneNumber,
                        contactEmail: emailAddress,
                        boardingPoint: selectedBoardingPoint,
                        promoCode: appliedPromo ? appliedPromo.code : '',
                    }
                });
            }
        } catch (error: any) {
            console.error('Booking Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to create booking');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <SafeAreaView />
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerTitle}>Passenger Details</Text>
                        <Text style={styles.headerSub}>
                            {params.date}, {params.departure}, {params.passengerCount} passenger(s)
                        </Text>
                    </View>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timerText}>{timeLeft} sec</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Trip Detail Card */}
                <View style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: COLORS.PRIMARY }]}>TRIP DETAIL</Text>
                    <View style={styles.divider} />

                    <Text style={styles.busName}>{params.company || 'Bus'}</Text>
                    <Text style={styles.busTypeSub}>{params.type}</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Route</Text>
                        <Text style={styles.detailValue}>{params.origin} - {params.destination}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Date</Text>
                        <Text style={styles.detailValue}>{params.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Departure Time</Text>
                        <Text style={styles.detailValue}>{params.departure}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Seat(s)</Text>
                        <Text style={styles.detailValue}>{params.passengerCount} ({params.selectedSeats})</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Normal Seat</Text>
                        <Text style={styles.detailValue}>{params.passengerCount} x Rs. {(totalPrice / (Number(params.passengerCount) || 1)).toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sub Total</Text>
                        <Text style={[styles.detailValue, { fontWeight: '700' }]}>NPR {totalPrice.toLocaleString()}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Convenience fee ⓘ</Text>
                        <Text style={styles.detailValue}>NPR {convenienceFee}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: COLORS.GREEN, fontWeight: '600' }]}>Discount</Text>
                        <Text style={[styles.detailValue, { color: COLORS.GREEN, fontWeight: '600' }]}>NPR {discount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { fontSize: 16, fontWeight: '700' }]}>Total Amount</Text>
                        <Text style={[styles.detailValue, { fontSize: 16, fontWeight: '800' }]}>NPR {grandTotal.toLocaleString()}</Text>
                    </View>
                </View>

                {/* Promo Code - Clicking this opens the modal */}
                <TouchableOpacity style={styles.promoCard} onPress={() => setShowPromoModal(true)}>
                    <MaterialCommunityIcons name="ticket-percent" size={24} color={COLORS.PRIMARY} />
                    <Text style={styles.promoText}>{appliedPromo ? `Applied: ${appliedPromo.code}` : "Apply promo code"}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.TEXT_MAIN} />
                </TouchableOpacity>

                {/* Address Detail */}
                <View style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: COLORS.PRIMARY }]}>ADDRESS DETAIL</Text>
                    <View style={styles.divider} />
                    <Text style={styles.inputLabel}>Select the nearby boarding point *</Text>
                    <TouchableOpacity
                        style={styles.boardingPicker}
                        onPress={() => {
                            console.log('Opening boarding modal. Current points:', boardingPoints.length);
                            setShowBoardingModal(true);
                        }}
                    >
                        <Text style={[styles.pickerPlaceholder, selectedBoardingPoint ? { color: COLORS.TEXT_MAIN } : {}]}>
                            {selectedBoardingPoint || 'Boarding Point *'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color={COLORS.TEXT_SUB} />
                    </TouchableOpacity>
                </View>

                {/* Contact Detail */}
                <View style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: COLORS.PRIMARY }]}>CONTACT DETAIL</Text>
                    <View style={styles.divider} />
                    <Text style={styles.inputDescription}>Your ticket and bus details will be sent here</Text>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="account" size={20} color={COLORS.TEXT_SUB} />
                        <TextInput
                            style={styles.input}
                            placeholder="Full Name"
                            placeholderTextColor={COLORS.TEXT_SUB}
                            value={passengerName}
                            onChangeText={setPassengerName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="cellphone" size={20} color={COLORS.TEXT_SUB} />
                        <TextInput
                            style={styles.input}
                            placeholder="Phone Number"
                            placeholderTextColor={COLORS.TEXT_SUB}
                            keyboardType="phone-pad"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email" size={20} color={COLORS.TEXT_SUB} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor={COLORS.TEXT_SUB}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={emailAddress}
                            onChangeText={setEmailAddress}
                        />
                    </View>
                </View>

                {/* Terms and Conditions - Fixed interaction */}
                <View style={styles.termsRow}>
                    <TouchableOpacity
                        onPress={() => setAcceptedTerms(!acceptedTerms)}
                        style={styles.checkboxTouch}
                    >
                        <MaterialCommunityIcons
                            name={acceptedTerms ? "checkbox-marked" : "checkbox-blank-outline"}
                            size={24}
                            color={acceptedTerms ? COLORS.PRIMARY : COLORS.TEXT_SUB}
                        />
                    </TouchableOpacity>
                    <Text style={styles.termsText}>
                        Accept our <Text style={[styles.termsLink, { color: COLORS.PRIMARY }]}>Terms & Conditions.</Text>
                    </Text>
                </View>

                {/* Pay Now Button */}
                <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: COLORS.PRIMARY }]}
                    onPress={handlePayNow}
                >
                    <Text style={styles.payButtonText}>Pay now</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Promo Code Modal */}
            <Modal
                visible={showPromoModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPromoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBlur}
                        onPress={() => setShowPromoModal(false)}
                    />
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContent}
                    >
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>APPLY PROMO CODE</Text>

                        <View style={styles.promoInputRow}>
                            <TextInput
                                style={styles.promoModalInput}
                                placeholder="Enter promo code"
                                value={promoInput}
                                onChangeText={setPromoInput}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.applyButton, { backgroundColor: COLORS.PRIMARY }]}
                                onPress={handlePromoInputApply}
                            >
                                <Text style={styles.applyButtonText}>APPLY</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.subModalTitle}>Available promo codes</Text>

                        <ScrollView style={styles.modalScroll}>
                            {couponsLoading ? (
                                <Text style={styles.loadingText}>Loading coupons...</Text>
                            ) : availableCoupons.length > 0 ? (
                                availableCoupons.map((promo) => (
                                    <View key={promo._id} style={styles.promoItemCard}>
                                        <View style={styles.promoItemInfo}>
                                            <View style={styles.promoItemHeader}>
                                                <Text style={styles.promoItemCode}>{promo.code}</Text>
                                                <Text style={[styles.promoItemBadge, { backgroundColor: COLORS.PRIMARY + '20', color: COLORS.PRIMARY }]}>
                                                    {promo.discountType === 'Percentage' ? `${promo.discountValue}%` : `Rs. ${promo.discountValue}`}
                                                </Text>
                                            </View>
                                            <Text style={styles.promoItemTitle}>{promo.title}</Text>
                                            <Text style={styles.promoItemDesc}>{promo.description}</Text>
                                            <Text style={styles.promoItemExpiry}>
                                                Expires: {new Date(promo.expiryDate).toLocaleDateString()}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.miniApplyButton, { backgroundColor: COLORS.PRIMARY }]}
                                            onPress={() => handleSelectPromo(promo)}
                                        >
                                            <Text style={styles.miniApplyText}>Apply</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noDataText}>No coupons available right now</Text>
                            )}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
            {/* Boarding Point Modal */}
            <Modal
                visible={showBoardingModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowBoardingModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalBlur}
                        onPress={() => setShowBoardingModal(false)}
                    />
                    <View style={[styles.modalContent, { height: height * 0.6 }]}>
                        <View style={styles.dragIndicator} />
                        <Text style={styles.modalTitle}>SELECT BOARDING POINT</Text>

                        {boardingPoints.length > 0 ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {boardingPoints.map((point, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.boardingPointItem,
                                            selectedBoardingPoint === point && styles.boardingPointItemSelected
                                        ]}
                                        onPress={() => {
                                            console.log('USER ACTION: Boarding Point Selected ->', point);
                                            setSelectedBoardingPoint(point);
                                            // Delay closing slightly so user sees the change
                                            setTimeout(() => {
                                                setShowBoardingModal(false);
                                            }, 150);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={selectedBoardingPoint === point ? "radiobox-marked" : "radiobox-blank"}
                                            size={24}
                                            color={selectedBoardingPoint === point ? COLORS.PRIMARY : COLORS.TEXT_SUB}
                                        />
                                        <Text style={[
                                            styles.boardingPointText,
                                            selectedBoardingPoint === point && styles.boardingPointTextSelected
                                        ]}>
                                            {point}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                <View style={{ height: 40 }} />
                            </ScrollView>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="map-marker-off" size={48} color={COLORS.TEXT_SUB} />
                                <Text style={styles.emptyText}>No boarding points found for this route.</Text>
                                <Text style={styles.emptySubText}>Please contact support or proceed with default.</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView >
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
        paddingHorizontal: 10,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backButton: {
        padding: 5,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    timerContainer: {
        paddingHorizontal: 12,
    },
    timerText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 15,
        paddingBottom: 40,
    },
    sectionCard: {
        backgroundColor: COLORS.CARD_BG,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.BORDER,
        marginVertical: 12,
    },
    busName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
    },
    busTypeSub: {
        fontSize: 13,
        color: COLORS.TEXT_SUB,
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
    },
    detailValue: {
        fontSize: 14,
        color: COLORS.TEXT_MAIN,
        fontWeight: '500',
    },
    promoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.CARD_BG,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    promoText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.TEXT_MAIN,
        marginLeft: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.TEXT_MAIN,
        marginBottom: 10,
    },
    boardingPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#FCFCFC',
    },
    pickerPlaceholder: {
        color: COLORS.TEXT_SUB,
        fontSize: 15,
    },
    inputDescription: {
        fontSize: 13,
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        borderRadius: 8,
        paddingHorizontal: 12,
        marginBottom: 12,
        backgroundColor: '#FCFCFC',
    },
    input: {
        flex: 1,
        height: 45,
        marginLeft: 10,
        color: COLORS.TEXT_MAIN,
        fontSize: 15,
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkboxTouch: {
        padding: 5,
    },
    termsText: {
        fontSize: 14,
        color: COLORS.TEXT_MAIN,
        marginLeft: 4,
    },
    termsLink: {
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    payButton: {
        borderRadius: 12,
        paddingVertical: 18,
        alignItems: 'center',
    },
    payButtonDisabled: {
        backgroundColor: '#CCC',
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBlur: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        minHeight: height * 0.5,
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 24,
    },
    promoInputRow: {
        flexDirection: 'row',
        marginBottom: 30,
    },
    promoModalInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 15,
        height: 50,
        fontSize: 16,
    },
    applyButton: {
        marginLeft: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontWeight: '800',
    },
    subModalTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 15,
    },
    promoItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        marginBottom: 12,
    },
    promoItemInfo: {
        flex: 1,
    },
    promoItemCode: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    promoItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    promoItemBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: '800',
    },
    promoItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 4,
    },
    promoItemDesc: {
        fontSize: 12,
        color: COLORS.TEXT_SUB,
        marginBottom: 10,
        lineHeight: 18,
    },
    promoItemExpiry: {
        fontSize: 10,
        color: '#999',
        fontWeight: '600',
    },
    miniApplyButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 10,
    },
    miniApplyText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
    },
    boardingPointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    boardingPointItemSelected: {
        backgroundColor: '#F0F7FF',
    },
    boardingPointText: {
        fontSize: 16,
        color: COLORS.TEXT_MAIN,
        marginLeft: 15,
    },
    boardingPointTextSelected: {
        color: COLORS.PRIMARY,
        fontWeight: '700',
    },
    modalScroll: {
        maxHeight: 300,
        marginTop: 10,
    },
    loadingText: {
        textAlign: 'center',
        color: COLORS.TEXT_SUB,
        padding: 20,
    },
    noDataText: {
        textAlign: 'center',
        color: COLORS.TEXT_SUB,
        padding: 20,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginTop: 15,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        marginTop: 5,
        textAlign: 'center',
    },
});
