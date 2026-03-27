// shared-constants.js

const SEAT_STATUS = {
    AVAILABLE: 'available',
    SELECTED: 'selected',
    OCCUPIED: 'occupied',
};

const SAMPLE_BUS = {
    id: 'BUS001',
    number: 'NA-1234',
    name: 'Super Deluxe Express',
    type: 'AC Sleeper',
    from: 'Kathmandu',
    to: 'Pokhara',
    departureTime: '2026-02-01T08:00:00Z',
    price: 1500,
    seats: [
        { id: '1A', row: 1, col: 1, status: SEAT_STATUS.AVAILABLE },
        { id: '1B', row: 1, col: 2, status: SEAT_STATUS.AVAILABLE },
        { id: '1C', row: 1, col: 4, status: SEAT_STATUS.OCCUPIED },
        { id: '1D', row: 1, col: 5, status: SEAT_STATUS.AVAILABLE },
        { id: '2A', row: 2, col: 1, status: SEAT_STATUS.AVAILABLE },
        { id: '2B', row: 2, col: 2, status: SEAT_STATUS.OCCUPIED },
        { id: '2C', row: 2, col: 4, status: SEAT_STATUS.AVAILABLE },
        { id: '2D', row: 2, col: 5, status: SEAT_STATUS.AVAILABLE },
        { id: '3A', row: 3, col: 1, status: SEAT_STATUS.AVAILABLE },
        { id: '3B', row: 3, col: 2, status: SEAT_STATUS.AVAILABLE },
        { id: '3C', row: 3, col: 4, status: SEAT_STATUS.AVAILABLE },
        { id: '3D', row: 3, col: 5, status: SEAT_STATUS.OCCUPIED },
        // Col 3 is aisle
    ],
};

const BUS_LIST = [
    SAMPLE_BUS,
    {
        id: 'BUS002',
        number: 'BA-5678',
        name: 'Mountain Cruiser',
        type: 'Luxury Coach',
        from: 'Kathmandu',
        to: 'Chitwan',
        departureTime: '2026-02-01T09:30:00Z',
        price: 1200,
        seats: [], // Simplified for list view
    },
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SEAT_STATUS, SAMPLE_BUS, BUS_LIST };
} else {
    // For web/mobile frontends if they can't use commonjs
    window.SHARED_CONSTANTS = { SEAT_STATUS, SAMPLE_BUS, BUS_LIST };
}
