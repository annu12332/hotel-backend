const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    roomTitle: { type: String, required: true },
    guestName: { type: String, required: true },
    email: { type: String, required: true }, 
    phone: { type: String, required: true }, 
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    
    // আলাদা ফিল্ডস (যদি প্রয়োজন হয়)
    specialRequest: { type: String, default: "" }, 
    status: { type: String, default: 'Pending' } 
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);