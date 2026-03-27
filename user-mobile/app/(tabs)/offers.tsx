import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../utils/api';

const COLORS = {
    PRIMARY: '#007AFF',
    BACKGROUND: '#F8F9FA',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    PURPLE: '#5856D6',
};

interface Coupon {
    _id: string;
    code: string;
    title: string;
    description: string;
    discountType: 'Percentage' | 'Cash';
    discountValue: number;
    expiryDate: string;
}

export default function OffersScreen() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCoupons = async () => {
        try {
            const response = await api.get('/coupons');
            if (response.data.success) {
                setCoupons(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchCoupons();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Special Offers</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />
                }
            >
                {/* Featured Offer */}
                <View style={[styles.promoBanner, { backgroundColor: COLORS.PURPLE }]}>
                    <View style={styles.promoTextWrapper}>
                        <Text style={styles.promoTitle}>20% OFF!</Text>
                        <Text style={styles.promoDesc}>On your first booking with code:</Text>
                        <View style={styles.codeBadge}>
                            <Text style={styles.codeText}>BUSYATRA20</Text>
                        </View>
                    </View>
                    <MaterialCommunityIcons name="ticket-percent" size={80} color="rgba(255,255,255,0.3)" style={styles.promoIcon} />
                </View>

                <Text style={styles.sectionTitle}>Available Coupons</Text>

                {loading && !refreshing ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    </View>
                ) : coupons.length > 0 ? (
                    coupons.map((coupon) => (
                        <TouchableOpacity key={coupon._id} style={styles.offerCard}>
                            <View style={styles.offerIcon}>
                                <MaterialCommunityIcons
                                    name={coupon.discountType === 'Percentage' ? "percent" : "cash"}
                                    size={24}
                                    color={COLORS.PRIMARY}
                                />
                            </View>
                            <View style={styles.offerInfo}>
                                <View style={styles.offerHeaderRow}>
                                    <Text style={styles.offerTitle}>{coupon.title}</Text>
                                    <View style={styles.miniCodeBadge}>
                                        <Text style={styles.miniCodeText}>{coupon.code}</Text>
                                    </View>
                                </View>
                                <Text style={styles.offerSubtitle}>
                                    {coupon.discountType === 'Percentage' ? `${coupon.discountValue}%` : `Rs. ${coupon.discountValue}`} OFF - {coupon.description}
                                </Text>
                                <Text style={styles.expiryText}>
                                    Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="ticket-outline" size={60} color="#DDD" />
                        <Text style={styles.emptyText}>No coupons available right now</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BACKGROUND,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    promoBanner: {
        padding: 24,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        overflow: 'hidden',
    },
    promoTextWrapper: {
        flex: 1,
        zIndex: 1,
    },
    promoTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 4,
    },
    promoDesc: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        marginBottom: 15,
    },
    codeBadge: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    codeText: {
        color: COLORS.PURPLE,
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1,
    },
    promoIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
    },
    offerCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    offerIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    offerInfo: {
        flex: 1,
        marginLeft: 15,
    },
    offerHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    offerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
    },
    miniCodeBadge: {
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    miniCodeText: {
        fontSize: 11,
        color: COLORS.PRIMARY,
        fontWeight: '800',
    },
    offerSubtitle: {
        fontSize: 13,
        color: COLORS.TEXT_SUB,
        marginTop: 2,
    },
    expiryText: {
        fontSize: 11,
        color: '#999',
        marginTop: 6,
        fontStyle: 'italic',
    },
    loaderContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        opacity: 0.6,
    },
    emptyText: {
        marginTop: 10,
        color: COLORS.TEXT_SUB,
        fontSize: 16,
    },
});
