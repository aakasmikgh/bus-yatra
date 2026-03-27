import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import api from '../utils/api';

const AMENITY_ICONS: { [key: string]: string } = {
    'WiFi': 'wifi',
    'Charging': 'battery-charging',
    'Water': 'cup-water',
    'AC': 'snowflake',
    'TV': 'television',
    'Restroom': 'toilet'
};

export default function BusListScreen() {
    const { from, to, date, day } = useLocalSearchParams();
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState<'low' | 'high' | null>(null);
    const [showSortModal, setShowSortModal] = useState(false);

    useEffect(() => {
        fetchRoutes();
    }, [from, to, day]);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const response = await api.get('/routes/search', {
                params: { from, to, day, date }
            });
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch routes:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getSortedRoutes = () => {
        if (!sortBy) return routes;

        return [...routes].sort((a, b) => {
            if (sortBy === 'low') return a.fare - b.fare;
            if (sortBy === 'high') return b.fare - a.fare;
            return 0;
        });
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRoutes();
    };

    const renderBusItem = ({ item, index }: { item: any, index: number }) => {
        const busAmenities = item.bus?.amenities || [];
        const displayedAmenities = busAmenities.slice(0, 4);
        const overflowCount = busAmenities.length > 4 ? busAmenities.length - 4 : 0;

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 100)}
                style={styles.busCard}
            >
                <View style={styles.busHeader}>
                    <View>
                        <Text style={styles.companyName}>{item.bus?.name || 'Unknown Bus'}</Text>
                        <Text style={styles.busType}>{item.bus?.type || 'Standard'}</Text>
                    </View>
                    {item.distance && (
                        <View style={styles.distanceBadge}>
                            <Text style={styles.distanceText}>{item.distance} KM</Text>
                        </View>
                    )}
                </View>

                <View style={styles.journeyContainer}>
                    <View style={styles.timePoint}>
                        <Text style={styles.time}>{item.departureTime}</Text>
                        <Text style={styles.location}>{item.origin?.name}</Text>
                    </View>

                    <View style={styles.durationContainer}>
                        <View style={styles.line} />
                        <MaterialCommunityIcons name="bus" size={20} color="#007AFF" />
                        <View style={styles.line} />
                    </View>

                    <View style={styles.timePoint}>
                        <Text style={styles.time}>{item.arrivalTime}</Text>
                        <Text style={styles.location}>{item.destination?.name}</Text>
                    </View>
                </View>

                {/* Feature Badges */}
                <View style={styles.featuresContainer}>
                    {displayedAmenities.map((amenity: string, idx: number) => (
                        <View key={idx} style={styles.featureBadge}>
                            <MaterialCommunityIcons
                                name={(AMENITY_ICONS[amenity] || 'check-circle-outline') as any}
                                size={12}
                                color="#007AFF"
                            />
                            <Text style={styles.featureText}>{amenity}</Text>
                        </View>
                    ))}
                    {overflowCount > 0 && (
                        <View style={[styles.featureBadge, styles.overflowBadge]}>
                            <Text style={styles.overflowText}>+{overflowCount}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <View>
                        <Text style={styles.price}>NPR {item.fare}</Text>
                        <Text style={styles.seatsLeft}>{item.bus?.number}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => router.push({
                            pathname: '/seat-selection',
                            params: {
                                routeId: item._id,
                                busId: item.bus?._id,
                                company: item.bus?.name,
                                type: item.bus?.type,
                                price: item.fare,
                                departure: item.departureTime,
                                origin: item.origin?.name,
                                destination: item.destination?.name,
                                seats: item.bus?.seats,
                                date: date,
                                amenities: JSON.stringify(item.bus?.amenities || []),
                                images: JSON.stringify(item.bus?.images || []),
                                boardingPoints: JSON.stringify(item.boardingPoints || []),
                            }
                        })}
                    >
                        <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Sticky Header */}
            <View style={styles.stickyHeader}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.routeText}>{from} → {to}</Text>
                    <Text style={styles.dateText}>{date} ({day})</Text>
                </View>
                <TouchableOpacity
                    style={[styles.sortButton, sortBy && styles.sortButtonActive]}
                    onPress={() => setShowSortModal(true)}
                >
                    <MaterialCommunityIcons
                        name={sortBy === 'low' ? "sort-ascending" : sortBy === 'high' ? "sort-descending" : "sort-variant"}
                        size={24}
                        color={sortBy ? "#007AFF" : "#333"}
                    />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Finding best buses for you...</Text>
                </View>
            ) : (
                <FlatList
                    data={getSortedRoutes()}
                    renderItem={renderBusItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    ListHeaderComponent={() => (
                        <Text style={styles.resultsCount}>{routes.length} Buses Available</Text>
                    )}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="bus-alert" size={80} color="#DDD" />
                            <Text style={styles.emptyTitle}>No Buses Found</Text>
                            <Text style={styles.emptySubtitle}>
                                There are no buses available for this route on {day}. Try a different date or route.
                            </Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => router.back()}
                            >
                                <Text style={styles.retryButtonText}>Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSortModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowSortModal(false)}
                >
                    <View style={styles.sortModalContainer}>
                        <View style={styles.sortModalHeader}>
                            <Text style={styles.sortModalTitle}>Sort By Price</Text>
                            <TouchableOpacity onPress={() => setShowSortModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.sortOption, sortBy === 'low' && styles.sortOptionSelected]}
                            onPress={() => { setSortBy('low'); setShowSortModal(false); }}
                        >
                            <MaterialCommunityIcons
                                name="sort-ascending"
                                size={22}
                                color={sortBy === 'low' ? "#007AFF" : "#666"}
                            />
                            <Text style={[styles.sortOptionText, sortBy === 'low' && styles.sortOptionTextSelected]}>
                                Price: Low to High
                            </Text>
                            {sortBy === 'low' && (
                                <MaterialCommunityIcons name="check" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.sortOption, sortBy === 'high' && styles.sortOptionSelected]}
                            onPress={() => { setSortBy('high'); setShowSortModal(false); }}
                        >
                            <MaterialCommunityIcons
                                name="sort-descending"
                                size={22}
                                color={sortBy === 'high' ? "#007AFF" : "#666"}
                            />
                            <Text style={[styles.sortOptionText, sortBy === 'high' && styles.sortOptionTextSelected]}>
                                Price: High to Low
                            </Text>
                            {sortBy === 'high' && (
                                <MaterialCommunityIcons name="check" size={20} color="#007AFF" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.clearSortButton}
                            onPress={() => { setSortBy(null); setShowSortModal(false); }}
                        >
                            <Text style={styles.clearSortText}>Clear Sorting</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    stickyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 10,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 4,
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    routeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    dateText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    listContent: {
        padding: 16,
        flexGrow: 1,
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontWeight: '600',
    },
    busCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    busHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    companyName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#333',
    },
    busType: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#333',
        marginLeft: 4,
    },
    journeyContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    timePoint: {
        alignItems: 'center',
        width: 100,
    },
    time: {
        fontSize: 15,
        fontWeight: '700',
        color: '#333',
    },
    location: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        textAlign: 'center',
    },
    durationContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#DDD',
        borderStyle: 'dashed',
        borderRadius: 1,
    },
    distanceBadge: {
        backgroundColor: '#F0F7FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    distanceText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#007AFF',
    },
    featuresContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 10,
        borderRadius: 12,
        marginBottom: 15,
        gap: 12,
    },
    featureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    featureText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
    overflowBadge: {
        backgroundColor: '#E5F1FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    overflowText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#007AFF',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    price: {
        fontSize: 18,
        fontWeight: '800',
        color: '#007AFF',
    },
    seatsLeft: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginTop: 2,
    },
    bookButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    retryButton: {
        marginTop: 30,
        backgroundColor: '#007AFF',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    sortButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: '#E5F1FF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sortModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    sortModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    sortModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
        gap: 12,
    },
    sortOptionSelected: {
        backgroundColor: '#E5F1FF',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    sortOptionText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    sortOptionTextSelected: {
        color: '#007AFF',
    },
    clearSortButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    clearSortText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FF3B30',
    },
});
