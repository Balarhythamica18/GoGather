import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const eventSchema = new mongoose.Schema({
    title: String,
    status: String,
    date: String,
    month: String,
}, { strict: false });
const Event = mongoose.model('Event', eventSchema);

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const events = await Event.find().sort({ updatedAt: -1 }).limit(3);
    events.forEach(e => {
        console.log(`\nID: ${e._id}\nTitle: ${e.title}\nStatus: ${e.status}\nDate: ${e.date} Month: ${e.month}\nUpdated at: ${e.updatedAt}\n---`);
    });
    mongoose.disconnect();
}
check();
