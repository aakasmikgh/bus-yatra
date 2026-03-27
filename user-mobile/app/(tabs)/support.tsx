import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, SafeAreaView, TouchableOpacity, Modal, Platform, Linking, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../utils/api';

const COLORS = {
    PRIMARY: '#007AFF',
    BACKGROUND: '#F8F9FA',
    CARD_BG: '#FFFFFF',
    TEXT_MAIN: '#333',
    TEXT_SUB: '#666',
    BORDER: '#EEE',
    GREEN: '#28A745',
};

const SUPPORT_OPTIONS = [
    { id: '1', title: 'Help Center', icon: 'help-circle-outline', desc: 'Find answers to common questions' },
    { id: '2', title: 'Chat with Us', icon: 'chat-processing-outline', desc: 'Get instant support from our team' },
    { id: '3', title: 'Terms & Conditions', icon: 'file-document-outline', desc: 'Read our legal guidelines' },
    { id: '4', title: 'Privacy Policy', icon: 'shield-lock-outline', desc: 'How we protect your data' },
];

export default function SupportScreen() {
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [expandedMainFaq, setExpandedMainFaq] = useState<number | null>(null);

    const MAIN_FAQS = [
        {
            q: "How do I find my bus at the bus park?",
            a: "Your ticket contains the Bus Number and the Operator's Contact. We recommend arriving 30 minutes early. If you can't find the bus, use the 'Call Operator' button in your booking details for the exact location of the counter or platform."
        },
        {
            q: "Do I need to print my ticket or is the SMS enough?",
            a: "A physical printout is not required. You can board by showing your mTicket (SMS) or the digital ticket in the 'My Bookings' section of the app. The conductor will verify your PNR number or name."
        },
        {
            q: "What happens if the bus is cancelled by the operator?",
            a: "If the operator cancels the trip, you are entitled to a 100% refund. The amount will be credited back to your Bus Yatra Wallet or original payment method (eSewa/Stripe) within 3-5 business days."
        },
        {
            q: "Can I change my seat or travel date after booking?",
            a: "Direct seat changes are not possible once a ticket is issued. However, you can cancel and rebook. Please check our 'Cancellation Policy' for applicable fees, as some operators allow date changes if requested at least 24 hours in advance."
        },
        {
            q: "I paid via eSewa but didn't get my ticket. What should I do?",
            a: "Don't panic! Sometimes network issues delay the sync. First, check 'My Bookings'. If it's not there, please do not pay again. Contact our 24/7 support with your eSewa Transaction ID, and we will manually confirm your seat or issue a refund."
        }
    ];

    const SUPPORT_NUMBER = '+977 9763373393';

    const handleCall = () => {
        Linking.openURL(`tel:${SUPPORT_NUMBER}`);
    };

    const handleOptionPress = (id: string) => {
        if (id === '1') {
            setShowHelpModal(true);
        } else if (id === '2') {
            setShowChatModal(true);
        } else if (id === '3') {
            setShowTermsModal(true);
        } else if (id === '4') {
            setShowPrivacyModal(true);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Support</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Contact Banner */}
                    <View style={styles.contactBanner}>
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerTitle}>Need help?</Text>
                            <Text style={styles.bannerSub}>We're available 24/7 to assist you.</Text>
                        </View>
                        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
                            <MaterialCommunityIcons name="phone" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>Help & Support</Text>

                    {SUPPORT_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.optionCard}
                            onPress={() => handleOptionPress(option.id)}
                        >
                            <View style={styles.optionIcon}>
                                <MaterialCommunityIcons name={option.icon as any} size={28} color={COLORS.PRIMARY} />
                            </View>
                            <View style={styles.optionInfo}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionDesc}>{option.desc}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#CCC" />
                        </TouchableOpacity>
                    ))}

                    {/* FAQ Section */}
                    <View style={styles.faqCard}>
                        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                        <View style={styles.divider} />
                        {MAIN_FAQS.map((faq, index) => (
                            <View key={index} style={{ marginBottom: index === MAIN_FAQS.length - 1 ? 0 : 10 }}>
                                <TouchableOpacity
                                    style={styles.faqItem}
                                    onPress={() => setExpandedMainFaq(expandedMainFaq === index ? null : index)}
                                >
                                    <Text style={[styles.faqQuestion, { flex: 1, paddingRight: 10 }]}>{faq.q}</Text>
                                    <MaterialCommunityIcons
                                        name={expandedMainFaq === index ? "minus" : "plus"}
                                        size={20}
                                        color={COLORS.TEXT_SUB}
                                    />
                                </TouchableOpacity>
                                {expandedMainFaq === index && (
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={[styles.topicAnswer, { paddingLeft: 0 }]}>{faq.a}</Text>
                                    </View>
                                )}
                                {index !== MAIN_FAQS.length - 1 && <View style={[styles.divider, { marginTop: 10, marginBottom: 0, height: 1 }]} />}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>

            <HelpCenterModal visible={showHelpModal} onClose={() => setShowHelpModal(false)} />
            <ChatModal visible={showChatModal} onClose={() => setShowChatModal(false)} />
            <TermsModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} />
            <PrivacyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        </View>
    );
}

function HelpCenterModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const toggleCategory = (category: string) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const HELP_DATA = [
        {
            id: '1',
            title: 'Booking & Payments',
            icon: 'credit-card-outline',
            topics: [
                { q: 'How to book a ticket?', a: '1. Select your route and date.\n2. Choose your preferred seats.\n3. Complete the payment and receive your ticket.' },
                { q: 'Payment Methods', a: 'We accept eSewa, Stripe, and Cash.' },
                { q: 'Payment Failure', a: 'If money is deducted but the ticket isn\'t issued, please contact support with your transaction details. Refunds are processed automatically.' },
                { q: 'Ticket Confirmation', a: 'You will receive your ticket via SMS, Email, and it will be available in the "My Bookings" section of the app.' },
            ]
        },
        {
            id: '2',
            title: 'Cancellations & Refunds',
            icon: 'undo-variant',
            topics: [
                { q: 'How to cancel?', a: 'Go to "My Bookings", select the ticket you wish to cancel, and tap the "Cancel Ticket" button.' },
                { q: 'Refund Policy', a: 'Refunds are subject to a 10-20% deduction depending on the cancellation time before departure.' },
                { q: 'Refund Time', a: 'Refunds typically take 3-5 business days to reflect in your eSewa or Bank account.' },
            ]
        },
        {
            id: '3',
            title: 'Bus & Travel Info',
            icon: 'bus-clock',
            topics: [
                { q: 'Boarding Point', a: 'Your boarding point is mentioned on the ticket. Use the "Contact Driver" feature in the app to find the exact location.' },
                { q: 'Luggage Policy', a: 'Standard luggage is free. Heavy bags or roof-loaded items may incur additional charges at the counter.' },
                { q: 'Child Policy', a: 'Children above 5 years old require a full ticket. Children below 5 can travel for free on a lap.' },
            ]
        },
        {
            id: '4',
            title: 'Account & Security',
            icon: 'shield-check-outline',
            topics: [
                { q: 'Changing Profile Details', a: 'Go to Personal Information to update your name and contact details.' },
                { q: 'Forget PIN/Password', a: 'Use the "Forgot Password" option on the Login screen to reset your account access via email/OTP.' },
            ]
        }
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackground} onPress={onClose} activeOpacity={1} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Help Center</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={styles.modalScroll}
                        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
                    >
                        {HELP_DATA.map((cat) => (
                            <View key={cat.id} style={styles.helpCategory}>
                                <TouchableOpacity
                                    style={styles.categoryHeader}
                                    onPress={() => toggleCategory(cat.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.categoryTitleRow}>
                                        <MaterialCommunityIcons name={cat.icon as any} size={24} color={COLORS.PRIMARY} />
                                        <Text style={styles.categoryTitle}>{cat.title}</Text>
                                    </View>
                                    <MaterialCommunityIcons
                                        name={expandedCategory === cat.id ? "chevron-up" : "chevron-down"}
                                        size={24}
                                        color={COLORS.TEXT_SUB}
                                    />
                                </TouchableOpacity>

                                {expandedCategory === cat.id && (
                                    <View style={styles.topicsList}>
                                        {cat.topics.map((topic, idx) => (
                                            <View key={idx} style={styles.topicItem}>
                                                <Text style={styles.topicQuestion}>{topic.q}</Text>
                                                <Text style={styles.topicAnswer}>{topic.a}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                <View style={styles.divider} />
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function TermsModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const TERMS_DATA = [
        {
            title: '1. Acceptance of Terms',
            content: 'By using Bus Yatra, you agree to follow these rules. If you don\'t agree, please stop using the app.'
        },
        {
            title: '2. Booking & Cancellation',
            content: 'Bookings are subject to seat availability. Cancellation fees apply as per our refund policy (10-20% deduction).'
        },
        {
            title: '3. User Conduct',
            content: 'You agree to provide accurate information and not misbehave during the journey. The bus operator reserves the right to refuse service.'
        },
        {
            title: '4. Limitation of Liability',
            content: 'Bus Yatra is an aggregator. We are not responsible for delays, accidents, or lost luggage, though we will assist in resolving disputes.'
        }
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackground} onPress={onClose} activeOpacity={1} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Terms & Conditions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 40 }}>
                        {TERMS_DATA.map((item, index) => (
                            <View key={index} style={{ marginBottom: 20 }}>
                                <Text style={styles.topicQuestion}>{item.title}</Text>
                                <Text style={styles.topicAnswer}>{item.content}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

function ChatModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = React.useRef<ScrollView>(null);

    const handleSend = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMsg = inputText.trim();
        setInputText('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const response = await api.post('/chat', { message: userMsg });
            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'bot', content: response.data.data }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, I'm having trouble connecting right now." }]);
            }
        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, { role: 'bot', content: "Something went wrong. Please try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (visible && messages.length > 0) {
            setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages, visible]);

    // Clear history when modal is closed
    useEffect(() => {
        if (!visible) {
            setMessages([]);
        }
    }, [visible]);

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.botAvatar}>
                                <MaterialCommunityIcons name="robot" size={20} color="#fff" />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.modalTitle}>BusYatra AI</Text>
                                <Text style={styles.botStatus}>{isTyping ? 'Typing...' : 'Online'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={false}
                        style={styles.chatScroll}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {messages.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="chat-outline" size={60} color="#eee" />
                                <Text style={styles.emptyText}>Hi! How can I help you regarding your bus travel today?</Text>
                            </View>
                        )}
                        {messages.map((msg, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.messageBubble,
                                    msg.role === 'user' ? styles.userBubble : styles.botBubble
                                ]}
                            >
                                <Text style={[
                                    styles.messageText,
                                    msg.role === 'user' ? styles.userText : styles.botText
                                ]}>
                                    {msg.content}
                                </Text>
                            </View>
                        ))}
                        {isTyping && (
                            <View style={[styles.messageBubble, styles.botBubble, { width: 60 }]}>
                                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                            </View>
                        )}
                    </ScrollView>

                    <View style={styles.chatInputContainer}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Type a message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && { opacity: 0.5 }]}
                            onPress={handleSend}
                            disabled={!inputText.trim() || isTyping}
                        >
                            <MaterialCommunityIcons name="send" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

function PrivacyModal({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const PRIVACY_DATA = [
        {
            title: '1. Information We Collect',
            content: 'We collect your name, email, phone number, and booking history to provide our services.'
        },
        {
            title: '2. How We Use Data',
            content: 'Your data is used to process tickets, send confirmations, and improve app performance.'
        },
        {
            title: '3. Data Sharing',
            content: 'We only share your information with the specific bus operator you chose for your journey.'
        },
        {
            title: '4. Data Security',
            content: 'We use industry-standard encryption to protect your personal and payment information.'
        }
    ];

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackground} onPress={onClose} activeOpacity={1} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHandle} />
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Privacy Policy</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialCommunityIcons name="close" size={24} color={COLORS.TEXT_MAIN} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll} contentContainerStyle={{ paddingBottom: 40 }}>
                        {PRIVACY_DATA.map((item, index) => (
                            <View key={index} style={{ marginBottom: 20 }}>
                                <Text style={styles.topicQuestion}>{item.title}</Text>
                                <Text style={styles.topicAnswer}>{item.content}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
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
    },
    contactBanner: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    bannerInfo: {
        flex: 1,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 8,
    },
    bannerSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        lineHeight: 20,
    },
    callButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
    },
    optionCard: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionInfo: {
        flex: 1,
        marginLeft: 15,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
    },
    optionDesc: {
        fontSize: 12,
        color: COLORS.TEXT_SUB,
        marginTop: 2,
    },
    faqCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    faqTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 15,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 15,
    },
    faqItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    faqQuestion: {
        fontSize: 14,
        color: COLORS.TEXT_MAIN,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBackground: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        height: '85%',
        width: '100%',
    },
    modalHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#DDD',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.TEXT_MAIN,
    },
    modalScroll: {
        flex: 1,
    },
    helpCategory: {
        marginBottom: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    categoryTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginLeft: 15,
    },
    topicsList: {
        paddingLeft: 40,
        paddingBottom: 15,
    },
    topicItem: {
        marginBottom: 15,
    },
    topicQuestion: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.TEXT_MAIN,
        marginBottom: 5,
    },
    topicAnswer: {
        fontSize: 14,
        color: COLORS.TEXT_SUB,
        lineHeight: 20,
    },
    // Chat Styles
    botAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    botStatus: {
        fontSize: 12,
        color: COLORS.GREEN,
        fontWeight: '600',
    },
    chatScroll: {
        flex: 1,
        paddingHorizontal: 10,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 16,
        marginTop: 20,
        paddingHorizontal: 40,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: COLORS.PRIMARY,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#fff',
    },
    botText: {
        color: COLORS.TEXT_MAIN,
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 10,
        maxHeight: 100,
        fontSize: 15,
        color: COLORS.TEXT_MAIN,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
});
