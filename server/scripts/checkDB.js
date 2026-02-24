import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    const events = await mongoose.connection.db.collection('events').find({}).toArray();
    console.log("Total Events:", events.length);
    if (events.length > 0) {
        console.log("First Event:", JSON.stringify(events[0], null, 2));
    }

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log("Total Users:", users.length);
    if (users.length > 0) {
        console.log("Users:", users.map(u => ({ id: u._id, name: u.name, email: u.email })));
    }

    process.exit(0);
};

run().catch(err => {
    console.error(err);
    process.exit(1);
});
