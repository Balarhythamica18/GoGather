import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();


async function run() {
    await mongoose.connect(process.env.MONGODB_URI);

    const Event = mongoose.model('Event', new mongoose.Schema({ status: String, title: String, organizer: mongoose.Schema.Types.ObjectId, organizerDetails: Object }, { strict: false }));
    const event = await Event.findOne({ status: 'approved', title: { $ne: 'My event testing updated' } }); // Pick a fresh one

    if (!event) {
        console.log("No approved event found to test with");
        process.exit(0);
    }

    const token = jwt.sign({ id: event.organizer, role: 'organizer', email: event.organizerDetails?.contactEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log("Original Event title:", event.title, "status:", event.status);

    try {
        const res = await axios.put(`http://localhost:5000/api/events/${event._id}`, {
            status: "approved"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Response status:", res.status);
        console.log("Updated Event status in response:", res.data.status);

        // Check DB again to see if status was changed internally
        const checkDb = await Event.findById(event._id);
        console.log("DB Event status after update:", checkDb.status);

    } catch (e) {
        console.error("Error updating:", e.response ? e.response.data : e.message);
    }

    mongoose.disconnect();
}
run();
