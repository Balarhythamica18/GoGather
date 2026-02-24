import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import User from '../models/User.js';

dotenv.config();

const diagnose = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const events = await Event.find({});
        console.log(`Total events in DB: ${events.length}`);

        const users = await User.find({});
        console.log(`Total users in DB: ${users.length}`);

        events.forEach(e => {
            console.log(`- Event: ${e.title}`);
            console.log(`  Organizer Ref: ${e.organizer}`);
            console.log(`  Contact Email: ${e.organizerDetails?.contactEmail}`);
            console.log(`  Status: ${e.status}`);
            console.log('---');
        });

        users.forEach(u => {
            console.log(`- User: ${u.name} (${u.email}) ID: ${u._id}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

diagnose();
