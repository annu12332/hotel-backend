const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios'); 
require('dotenv').config();

// Models
const Room = require('./models/Room'); 
const RoomBooking = require('./models/RoomBooking'); // আপনার চাহিদা অনুযায়ী নাম পরিবর্তন
const Gallery = require('./models/Gallery');
const Offer = require('./models/Offers'); 
const Blog = require('./models/Blog'); 
const Package = require('./models/Package'); 

const app = express();

// Middleware
app.use(cors({ origin: "*" })); 
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.log("❌ DB Error:", err.message));

// --- ROOM API ROUTES ---
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

// --- ROOM BOOKING API ROUTES ---
app.post('/api/bookings', async (req, res) => {
    try {
        // RoomBooking মডেল ব্যবহার করা হচ্ছে যা আপনার ফ্রন্টএন্ডের সাথে মিলবে
        const newBooking = new RoomBooking(req.body);
        await newBooking.save();

        if (process.env.TELEGRAM_BOT_TOKEN) {
            const msg = `🔔 *New Room Booking!* \n🏨 Room: ${req.body.roomTitle} \n👤 Guest: ${req.body.guestName} \n📞 Phone: ${req.body.phone}`;
            axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            }).catch(e => console.log("Telegram Notification Failed"));
        }
        res.status(201).json({ success: true, data: newBooking, message: "Booking Successful!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/package-bookings', async (req, res) => {
    try {
        // প্যাকেজ বুকিংয়ের জন্যও RoomBooking মডেল ব্যবহার করা হয়েছে লজিক ঠিক রাখতে
        const packageBooking = new RoomBooking({
            ...req.body
        });
        
        await packageBooking.save();

        if (process.env.TELEGRAM_BOT_TOKEN) {
            const msg = `🎁 *New Package Booking!* \n📦 Package: ${req.body.roomTitle} \n👤 Guest: ${req.body.guestName}`;
            axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: msg,
                parse_mode: 'Markdown'
            }).catch(e => console.log("Telegram Failed"));
        }
        
        res.status(201).json({ success: true, message: "Package Booked Successfully!", data: packageBooking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/bookings', async (req, res) => {
    try {
        const bookings = await RoomBooking.find().sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updatedBooking = await RoomBooking.findByIdAndUpdate(
            id, 
            { $set: { status: status } }, 
            { new: true }
        );
        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/bookings/:id', async (req, res) => {
    try {
        await RoomBooking.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Booking removed successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- SINGLE ROOM BY ID ---
app.get('/api/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ success: false, message: "Invalid Room ID or Server Error" });
    }
});

// --- GALLERY API ROUTES ---
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

// --- OFFERS API ROUTES ---
app.get('/api/offers', async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.status(200).json(offers);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/offers', async (req, res) => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete('/api/offers/:id', async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Offer deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- BLOG API ROUTES ---
app.get('/api/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.status(200).json(blogs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });
        res.json(blog);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/blogs', async (req, res) => {
    try {
        const newBlog = new Blog(req.body);
        await newBlog.save();
        res.status(201).json(newBlog);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/blogs/:id', async (req, res) => {
    try {
        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.status(200).json(updatedBlog);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/blogs/:id', async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Blog deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- PACKAGE API ROUTES ---
app.get('/api/packages', async (req, res) => {
    try {
        const packages = await Package.find().sort({ createdAt: -1 });
        res.json(packages);
    } catch (err) { res.status(500).json([]); }
});

app.get('/api/packages/:id', async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        res.json(pkg);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/packages', async (req, res) => {
    try {
        const newPkg = new Package(req.body);
        await newPkg.save();
        res.status(201).json(newPkg);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put('/api/packages/:id', async (req, res) => {
    try {
        const updatedPkg = await Package.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(updatedPkg);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/packages/:id', async (req, res) => {
    try {
        await Package.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Package deleted" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- ADMIN STATS ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const totalPackages = await Package.countDocuments();
        const bookings = await RoomBooking.find();
        
        res.status(200).json({
            totalRooms,
            totalPackages,
            totalBookings: bookings.length,
            pendingBookings: bookings.filter(b => b.status === 'Pending').length
        });
    } catch (error) { res.status(500).json({ success: false }); }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));