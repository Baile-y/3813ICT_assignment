const { MongoClient, ObjectId } = require('mongodb'); // MongoDB ObjectId
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server'); // Assuming 'app' is exported from your server
const expect = chai.expect;

chai.use(chaiHttp);

let db;
let groupId;
let channelId;
let userId;

// Test suite for channel routes
describe('Channel Routes', () => {

    before(async () => {
        const client = await MongoClient.connect('mongodb://localhost:27017');
        db = client.db('mydb'); // Use 'mydb' database
        app.locals.db = db;
    });

    beforeEach(async () => {
        // Insert a test user
        const user = await db.collection('users').insertOne({
            username: 'super',
            password: '123',
            roles: ['super-admin'],
            avatar: 'uploads/profile-images/default.jpg',
        });

        userId = user.insertedId;

        // Insert a test group with a channel
        const group = await db.collection('groups').insertOne({
            name: 'Test Group',
            adminId: userId,
            channels: [{ _id: new ObjectId(), name: 'Test Channel' }],
            members: [{ userId, role: 'super-admin' }],
            joinRequests: []
        });

        groupId = group.insertedId; // Store the groupId for later use
        const insertedGroup = await db.collection('groups').findOne({ _id: groupId });
        channelId = insertedGroup.channels[0]._id; // Access the first channel's ID

        // Insert a message into the channel
        await db.collection('messages').insertOne({
            channelId,
            userId,
            sender: 'super',
            content: 'This is a test message',
            avatar: 'uploads/profile-images/default.jpg',
            timestamp: new Date(),
        });
    });

    afterEach(async () => {
        // Clean up after each test
        await db.collection('groups').deleteMany({});
        await db.collection('messages').deleteMany({});
        await db.collection('users').deleteMany({});
    });

    after(async () => {
        await db.dropDatabase(); // Drop the test database after all tests are done
    });

    // Test for fetching all channels
    it('should fetch all channels in a group', (done) => {
        chai.request(app)
            .get(`/api/channels/${groupId}`)
            .set('user-roles', JSON.stringify(['super-admin'])) // Authorizing as 'super-admin'
            .set('user-id', userId.toString()) // Set the user ID from beforeEach
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('channels');
                expect(res.body.channels).to.be.an('array').that.is.not.empty;
                done();
            });
    });

    // Test for creating a new channel
    it('should create a new channel', (done) => {
        chai.request(app)
            .post(`/api/channels/${groupId}/channels`)
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .send({ name: 'New Channel' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('channel');
                expect(res.body.channel).to.have.property('name', 'New Channel');
                done();
            });
    });

    // Test for deleting a channel
    it('should delete a channel from the group', (done) => {
        chai.request(app)
            .delete(`/api/channels/${groupId}/channels/${channelId}`)
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.true;
                done();
            });
    });

    // Test for sending a message with an image
    it('should send a message with an image', (done) => {
        chai.request(app)
            .post('/api/channels/message')
            .field('channelId', channelId.toString())
            .field('userId', userId.toString())
            .field('sender', 'super')
            .field('content', 'This is a test message')
            .attach('image', './uploads/profile-images/default_profile.jpg')
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('message');
                expect(res.body.message).to.have.property('content', 'This is a test message');
                done();
            });
    });
});
