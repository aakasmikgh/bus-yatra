import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    ActivityIndicator,
    Modal,
    Image,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import api from '../utils/api';

const { width } = Dimensions.get('window');
// Calculate seat size based on 5 spots (4 seats + 1 aisle)
const SEAT_SIZE = (width - 80) / 5;

const SEAT_TYPES = {
    AVAILABLE: 'available',
    SELECTED: 'selected',
    BOOKED: 'booked',
};

const AMENITY_ICONS: { [key: string]: string } = {
    'WiFi': 'wifi',
    'Charging': 'battery-charging',
    'Water': 'cup-water',
    'AC': 'snowflake',
    'TV': 'television',
    'Restroom': 'toilet'
};

const COLORS = {
    PRIMARY: '#007AFF', // Reverting to original blue
    AVAILABLE: '#007AFF', // Blue
    SELECTED: '#FF9500', // Orange
    BOOKED: '#D1D1D1', // Grey
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    BACKGROUND: '#F5F5F5',
};

export default function SeatSelectionScreen() {
    const params = useLocalSearchParams();
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [bookedSeats, setBookedSeats] = useState<string[]>([]);
    const [recommendedSeats, setRecommendedSeats] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBusDetails, setShowBusDetails] = useState(false);

    // Parse data from params
    const amenities = JSON.parse(String(params.amenities || '[]'));
    const images = JSON.parse(String(params.images || '[]'));
    const boardingPoints = JSON.parse(String(params.boardingPoints || '[]'));

    const totalSeats = parseInt(String(params.seats)) || 30;

    useEffect(() => {
        fetchAvailability();
    }, [params.routeId, params.date]);

    const fetchAvailability = async () => {
        setLoading(true);
        const travelDate = params.date || new Date().toISOString().split('T')[0];
        try {
            const response = await api.get('/bookings/booked-seats', {
                params: {
                    routeId: params.routeId,
                    date: travelDate
                }
            });
            if (response.data.success) {
                setBookedSeats(response.data.data);
            }

            // Fetch KNN Recommendations
            try {
                const recRes = await api.get('/bookings/recommend-seats', {
                    params: { routeId: params.routeId, date: travelDate }
                });
                if (recRes.data.success) {
                    setRecommendedSeats(recRes.data.data);
                }
            } catch (recErr) {
                console.log('KNN recommendation fetch failed (silent)', recErr);
            }

        } catch (err) {
            console.error('Failed to fetch availability:', err);
        } finally {
            setLoading(false);
        }
    };

    // Precise layout generator with remainder at the FRONT
    const generateLayout = () => {
        const layout = [];
        let seatCounter = 1;
        const total = totalSeats;

        // Back row is 5 seats
        const hasBackRow = total > 5;
        const mainCount = hasBackRow ? total - 5 : total;

        const fullRows = Math.floor(mainCount / 4);
        const frontRemainder = mainCount % 4;

        // 1. Partial row at the TOP (Front)
        if (frontRemainder > 0) {
            const row: any = { isLastRow: false, left: [], right: [] };

            // Prioritize RIGHT side (Behind Driver) as requested
            const rightLimit = Math.min(frontRemainder, 2);
            const leftLimit = frontRemainder - rightLimit;

            for (let j = 0; j < leftLimit; j++) {
                const id = `A${seatCounter}`;
                row.left.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                seatCounter++;
            }
            for (let j = 0; j < rightLimit; j++) {
                const id = `B${seatCounter}`;
                row.right.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                seatCounter++;
            }
            layout.push(row);
        }

        // 2. Full regular rows
        for (let i = 0; i < fullRows; i++) {
            const row: any = { isLastRow: false, left: [], right: [] };
            // Left Column
            for (let j = 0; j < 2; j++) {
                const id = `A${seatCounter}`;
                row.left.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                seatCounter++;
            }
            // Right Column
            for (let j = 0; j < 2; j++) {
                const id = `B${seatCounter}`;
                row.right.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                seatCounter++;
            }
            layout.push(row);
        }

        // 3. Back row (Special 5-seat row)
        if (hasBackRow) {
            const backRow: any = { isLastRow: true, left: [], middle: null, right: [] };
            // First 2 seats (Left)
            for (let i = 0; i < 2; i++) {
                if (seatCounter <= total) {
                    const id = `L${seatCounter}`;
                    backRow.left.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                    seatCounter++;
                }
            }
            // Middle seat
            if (seatCounter <= total) {
                const id = `M${seatCounter}`;
                backRow.middle = { id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE };
                seatCounter++;
            }
            // Last 2 seats (Right)
            for (let i = 0; i < 2; i++) {
                if (seatCounter <= total) {
                    const id = `R${seatCounter}`;
                    backRow.right.push({ id, type: bookedSeats.includes(id) ? SEAT_TYPES.BOOKED : SEAT_TYPES.AVAILABLE });
                    seatCounter++;
                }
            }
            layout.push(backRow);
        }

        return layout;
    };

    const layout = generateLayout();

    const toggleSeat = (id: string, type: string) => {
        if (type === SEAT_TYPES.BOOKED) return;

        setSelectedSeats(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        );
    };

    const getSeatStyles = (id: string, type: string) => {
        if (type === SEAT_TYPES.BOOKED) return { color: COLORS.BOOKED, icon: 'car-seat' };
        if (selectedSeats.includes(id)) return { color: COLORS.SELECTED, icon: 'car-seat' };
        if (recommendedSeats.includes(id)) return { color: '#FFD700', icon: 'star' };
        return { color: COLORS.AVAILABLE, icon: 'car-seat' };
    };

    const basePrice = parseInt(String(params.price).replace(/[^0-9]/g, '')) || 0;
    const totalPrice = selectedSeats.length * basePrice;

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Checking availability...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeTop} />

            {/* Red Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Seat Layout Details</Text>
                <TouchableOpacity style={styles.infoButton} onPress={() => setShowBusDetails(true)}>
                    <MaterialCommunityIcons name="information" size={28} color="#fff" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Bus Info Card */}
                <View style={styles.infoCard}>
                    <Text style={[styles.busName, { color: '#007AFF' }]}>
                        {params.company}
                    </Text>
                    <Text style={styles.busTypeSub}>{params.type}</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoText}>{params.date}</Text>
                        <Text style={styles.infoText}>{params.origin} - {params.destination}</Text>
                    </View>
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <MaterialCommunityIcons name="car-seat" size={24} color={COLORS.BOOKED} />
                        <Text style={styles.legendLabel}>Booked</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <MaterialCommunityIcons name="car-seat" size={24} color={COLORS.AVAILABLE} />
                        <Text style={styles.legendLabel}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                        <Text style={styles.legendLabel}>Recommended</Text>
                    </View>
                </View>

                {recommendedSeats.length > 0 && (
                    <View style={{backgroundColor: '#FFFBE6', padding: 12, marginHorizontal: 20, borderRadius: 8, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: '#FFE58F'}}>
                        <MaterialCommunityIcons name="star-face" size={26} color="#FAAD14" />
                        <Text style={{marginLeft: 10, color: '#D48806', fontWeight: 'bold', fontSize: 13, flex: 1}}>
                            ✨ Based on your profile, we highly recommend seats: {recommendedSeats.join(', ')}
                        </Text>
                    </View>
                )}

                <View style={styles.busInnerContainer}>
                    {/* Driver Section */}
                    <View style={styles.driverContainer}>
                        <View style={styles.driverLabelContainer}>
                            <MaterialCommunityIcons name="car-seat" size={30} color={COLORS.BOOKED} />
                            <Text style={styles.driverText}>DRIVER</Text>
                        </View>
                    </View>

                    <View style={styles.dashedLine} />

                    {/* Seats */}
                    <View style={styles.layoutContainer}>
                        {layout.map((row, idx) => (
                            <View key={idx} style={styles.row}>
                                <View style={styles.leftGroup}>
                                    {row.left?.map((seat: any) => (
                                        <TouchableOpacity
                                            key={seat.id}
                                            style={styles.seatWrapper}
                                            onPress={() => toggleSeat(seat.id, seat.type)}
                                        >
                                            <MaterialCommunityIcons
                                                name={getSeatStyles(seat.id, seat.type).icon as any}
                                                size={30}
                                                color={getSeatStyles(seat.id, seat.type).color}
                                            />
                                            <Text style={styles.seatIdText}>{seat.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {row.isLastRow ? (
                                    <TouchableOpacity
                                        style={styles.seatWrapper}
                                        onPress={() => row.middle && toggleSeat(row.middle.id, row.middle.type)}
                                    >
                                        <MaterialCommunityIcons
                                            name={row.middle ? getSeatStyles(row.middle.id, row.middle.type).icon as any : 'car-seat'}
                                            size={30}
                                            color={row.middle ? getSeatStyles(row.middle.id, row.middle.type).color : COLORS.BOOKED}
                                        />
                                        <Text style={styles.seatIdText}>{row.middle?.id}</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.aisle} />
                                )}

                                <View style={styles.rightGroup}>
                                    {row.right?.map((seat: any) => (
                                        <TouchableOpacity
                                            key={seat.id}
                                            style={styles.seatWrapper}
                                            onPress={() => toggleSeat(seat.id, seat.type)}
                                        >
                                            <MaterialCommunityIcons
                                                name={getSeatStyles(seat.id, seat.type).icon as any}
                                                size={30}
                                                color={getSeatStyles(seat.id, seat.type).color}
                                            />
                                            <Text style={styles.seatIdText}>{seat.id}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Summary Bar */}
            <View style={styles.bottomBar}>
                <View style={styles.summaryInfo}>
                    <Text style={styles.summaryLabel}>Selected Seat</Text>
                    <Text style={styles.summarySeats}>
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                    </Text>
                </View>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>NPR {totalPrice.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={() => router.push({
                        pathname: '/booking-summary',
                        params: {
                            ...params,
                            selectedSeats: selectedSeats.join(', '),
                            passengerCount: selectedSeats.length,
                            totalPrice: totalPrice,
                        }
                    })}
                >
                    <Text style={styles.proceedButtonText}>Proceed</Text>
                </TouchableOpacity>
            </View>
            {/* Bus Details Modal */}
            <Modal
                visible={showBusDetails}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBusDetails(false)}
            >
                <View style={styles.modalOverlay}>
                    <Pressable style={styles.modalBackdrop} onPress={() => setShowBusDetails(false)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHandle} />
                            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowBusDetails(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            {/* Photos Section */}
                            <Text style={styles.modalSectionTitle}>Photos & Videos</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
                                {images.length > 0 ? images.map((img: string, i: number) => (
                                    <Image key={i} source={{ uri: img }} style={styles.busPhoto} />
                                )) : (
                                    <View style={styles.noPhotoBox}>
                                        <MaterialCommunityIcons name="image-off" size={40} color="#DDD" />
                                        <Text style={styles.noPhotoText}>No photos available</Text>
                                    </View>
                                )}
                            </ScrollView>

                            {/* Boarding Points */}
                            <Text style={styles.modalSectionTitle}>Boarding Points</Text>
                            <View style={styles.pointsList}>
                                {boardingPoints.map((point: string, i: number) => (
                                    <View key={i} style={styles.pointItem}>
                                        <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                                        <Text style={styles.pointName}>{point}</Text>
                                    </View>
                                ))}
                                {boardingPoints.length === 0 && <Text style={styles.emptyText}>Not available</Text>}
                            </View>

                            {/* Amenities */}
                            <Text style={styles.modalSectionTitle}>Amenities</Text>
                            <View style={styles.amenitiesGrid}>
                                {amenities.map((amenity: string, i: number) => (
                                    <View key={i} style={styles.amenityItem}>
                                        <MaterialCommunityIcons
                                            name={(AMENITY_ICONS[amenity] || 'check-circle-outline') as any}
                                            size={24}
                                            color={COLORS.PRIMARY}
                                        />
                                        <Text style={styles.amenityText}>{amenity}</Text>
                                    </View>
                                ))}
                                {amenities.length === 0 && <Text style={styles.emptyText}>No amenities listed</Text>}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <SafeAreaView style={styles.safeBottom} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeTop: {
        backgroundColor: COLORS.PRIMARY,
    },
    safeBottom: {
        backgroundColor: '#F0F0F0',
    },
    header: {
        backgroundColor: COLORS.PRIMARY,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 15,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        color: '#fff',
        fontSize: 18,
        marginLeft: -5,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    infoButton: {
        padding: 5,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    infoCard: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    busName: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.PRIMARY,
        marginBottom: 4,
    },
    busTypeSub: {
        fontSize: 13,
        color: COLORS.TEXT_SUB,
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.TEXT_MAIN,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.TEXT_MAIN,
        marginLeft: 8,
    },
    busInnerContainer: {
        paddingHorizontal: 20,
    },
    driverContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 20,
    },
    driverLabelContainer: {
        alignItems: 'center',
    },
    driverText: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
        marginTop: 2,
    },
    dashedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: '#DDD',
        borderStyle: 'dashed',
        marginBottom: 30,
    },
    layoutContainer: {
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    seatWrapper: {
        alignItems: 'center',
        width: SEAT_SIZE,
    },
    leftGroup: {
        flexDirection: 'row',
    },
    rightGroup: {
        flexDirection: 'row',
    },
    lastRow: {
        justifyContent: 'center',
    },
    aisle: {
        flex: 1,
    },
    seatIdText: {
        fontSize: 11,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
        marginTop: 2,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F0F0F0',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 35 : 15, // Extra padding for iOS home indicator
        borderTopWidth: 1,
        borderTopColor: '#DDD',
    },
    summaryInfo: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    summarySeats: {
        fontSize: 13,
        color: COLORS.TEXT_SUB,
    },
    priceContainer: {
        marginHorizontal: 15,
    },
    priceText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    proceedButton: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 8,
    },
    proceedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        height: '85%',
        paddingBottom: 20,
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        borderRadius: 3,
    },
    closeModalButton: {
        position: 'absolute',
        right: 20,
        top: 15,
    },
    modalScroll: {
        padding: 20,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
        marginTop: 20,
        marginBottom: 15,
    },
    photoList: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    busPhoto: {
        width: 250,
        height: 150,
        borderRadius: 12,
        marginRight: 15,
        backgroundColor: '#F5F5F5',
    },
    noPhotoBox: {
        width: width - 40,
        height: 150,
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EEE',
        borderStyle: 'dashed',
    },
    noPhotoText: {
        marginTop: 10,
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
    },
    pointsList: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 15,
    },
    pointItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    pointName: {
        fontSize: 15,
        color: COLORS.TEXT_MAIN,
        marginLeft: 10,
        fontWeight: '600',
    },
    amenitiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -7,
    },
    amenityItem: {
        width: (width - 70) / 3, // 3 columns with padding
        margin: 7,
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        paddingVertical: 15,
        borderRadius: 12,
    },
    amenityText: {
        fontSize: 11,
        color: COLORS.TEXT_SUB,
        marginTop: 8,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
        fontSize: 13,
    },
});
