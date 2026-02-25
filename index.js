const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); 
require('dotenv').config();

const Room = require('./models/Room'); 
const Booking = require('./models/Booking');
const Gallery = require('./models/Gallery');
const Offer = require('./models/Offers'); 

const app = express();

app.use(cors({ origin: "*" })); 
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ DB Error:", err.message));

// --- ROOM API ROUTES --- (আপনার আগের কোড ঠিক আছে)
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/rooms', async (req, res) => {
    try {
        const newRoom = new Room(req.body);
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ success: false, message: "Room creation failed" });
    }
});

app.put('/api/rooms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedRoom = await Room.findByIdAndUpdate(id, { $set: req.body }, { new: true });
        res.status(200).json(updatedRoom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.delete('/api/rooms/:id', async (req, res) => {
    try {
        await Room.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Room deleted" });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// --- BOOKING API ROUTES --- (আপনার আগের কোড ঠিক আছে)
app.post('/api/bookings', async (req, res) => {
    try {
        const newBooking = new Booking(req.body);
        await newBooking.save();

        if (process.env.TELEGRAM_BOT_TOKEN) {
            const msg = `🔔 *New Booking Request!* \n🏨 Room: ${req.body.roomTitle} \n👤 Guest: ${req.body.guestName}`;
            axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            }).catch(e => console.log("Telegram Notification Failed"));
        }
        res.status(201).json({ success: true, data: newBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// --- GALLERY API ROUTES --- (আপনার আগের কোড ঠিক আছে)
app.get('/api/gallery', async (req, res) => {
    try {
        const photos = await Gallery.find().sort({ createdAt: -1 });
        res.json(photos);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/gallery', async (req, res) => {
    try {
        const newPhoto = new Gallery(req.body);
        await newPhoto.save();
        res.status(201).json(newPhoto);
    } catch (err) { res.status(400).json({ message: err.message }); }
});


// সব অফার পাওয়ার জন্য
app.get('/api/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.status(200).json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// নতুন অফার তৈরি করার জন্য
app.post('/api/offers', async (req, res) => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// অফার ডিলিট করার জন্য
app.delete('/api/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Offer deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const bookings = await Booking.find();
        const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
        res.status(200).json({
            totalRooms,
            totalBookings: bookings.length,
            totalRevenue
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// সার্ভার স্টার্ট
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));