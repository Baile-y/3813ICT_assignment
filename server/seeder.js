const { MongoClient, ObjectId } = require('mongodb');

const mongoURI = 'mongodb://localhost:27017';
const dbName = 'mydb';

// Sample user data to seed
const users = [
  {
    _id: new ObjectId(),  // Generate ObjectId for user
    username: 'super',
    password: '123',
    roles: ['super-admin'],
    createdAt: new Date()
  },
  {
    _id: new ObjectId(),  // Generate ObjectId for user
    username: 'group',
    password: '123', 
    roles: ['group-admin'],
    createdAt: new Date()
  },
  {
    _id: new ObjectId(),  // Generate ObjectId for user
    username: 'user',
    password: '123',
    roles: ['user'],
    createdAt: new Date()
  }
];

// Sample group and channel data
const groups = [
];

// Sample message data
const messages = [
];

// Function to seed data
const seedDatabase = async () => {
  try {
    const client = await MongoClient.connect(mongoURI);
    console.log('Connected to MongoDB...');

    const db = client.db(dbName);

    // Collections
    const userCollection = db.collection('users');
    const groupCollection = db.collection('groups');
    const messageCollection = db.collection('messages');

    // Clear existing users, groups, and messages
    await userCollection.deleteMany({});
    await groupCollection.deleteMany({});
    await messageCollection.deleteMany({});

    // Insert new users
    const userResult = await userCollection.insertMany(users);
    console.log(`Inserted ${userResult.insertedCount} users`);

    // // Insert new groups
    // const groupResult = await groupCollection.insertMany(groups);
    // console.log(`Inserted ${groupResult.insertedCount} groups`);

    // // Insert new messages
    // const messageResult = await messageCollection.insertMany(messages);
    // console.log(`Inserted ${messageResult.insertedCount} messages`);

    // Close connection
    await client.close();
    console.log('Database seeding completed and connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedDatabase();
