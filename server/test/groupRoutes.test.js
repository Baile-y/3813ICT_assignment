const { MongoClient, ObjectId } = require('mongodb');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { app } = require('../server'); // Assuming 'app' is exported from your server
const expect = chai.expect;

chai.use(chaiHttp);

let db;
let groupId;
let userId;
let validJoinRequestUserId; // Add a userId for the join request

// Test suite for group routes
describe('Group Routes', () => {

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

        // Insert another user for the join request
        const joinRequestUser = await db.collection('users').insertOne({
            username: 'join_user',
            password: '123',
            roles: ['user'],
        });
        validJoinRequestUserId = joinRequestUser.insertedId;

        // Insert a test group with a join request
        const group = await db.collection('groups').insertOne({
            name: 'Test Group',
            adminId: userId,
            channels: [],
            members: [{ userId, role: 'super-admin' }],
            joinRequests: [{ userId: validJoinRequestUserId }] // Add a valid join request
        });

        groupId = group.insertedId; // Store the groupId for later use
    });

    afterEach(async () => {
        // Clean up after each test
        await db.collection('groups').deleteMany({});
        await db.collection('users').deleteMany({});
    });

    after(async () => {
        await db.dropDatabase(); // Drop the test database after all tests are done
    });

    // Test for fetching all groups
    it('should fetch all groups', (done) => {
        chai.request(app)
            .get('/api/groups')
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array').that.is.not.empty;
                done();
            });
    });

    // Test for creating a new group
    it('should create a new group', (done) => {
        chai.request(app)
            .post('/api/groups/create')
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .send({ name: 'New Group', adminId: userId, members: [{ userId, role: 'super-admin' }] })
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('group');
                expect(res.body.group).to.have.property('name', 'New Group');
                done();
            });
    });

    // Test for deleting a group
    it('should delete a group', (done) => {
        chai.request(app)
            .delete(`/api/groups/${groupId}`)
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.true;
                done();
            });
    });

    // Test for sending a join request to a group
    it('should send a join request to a group', (done) => {
      chai.request(app)
          .post(`/api/groups/${groupId}/join-request`)
          .set('user-roles', JSON.stringify(['user']))
          .set('user-id', userId.toString()) // Ensure userId is correct
          .send({ userId: userId.toString(), name: 'Join User' }) // Ensure name is passed
          .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body.success).to.be.true;
              done();
          });
  });
  
    // Test for approving a join request
    it('should approve a join request', (done) => {
        chai.request(app)
            .post(`/api/groups/${groupId}/approve-request`)
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .send({ userId: validJoinRequestUserId.toString() }) // Approve the join request
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success', true);
                done();
            });
    });

    // Test for denying a join request
    it('should deny a join request', (done) => {
        chai.request(app)
            .post(`/api/groups/${groupId}/deny-request`)
            .set('user-roles', JSON.stringify(['super-admin']))
            .set('user-id', userId.toString())
            .send({ userId: validJoinRequestUserId.toString() }) // Deny the join request
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body).to.have.property('success', true);
                done();
            });
    });

    // Test for leaving a group
    it('should allow a user to leave a group', (done) => {
        chai.request(app)
            .post(`/api/groups/${groupId}/leave`)
            .set('user-roles', JSON.stringify(['user']))
            .set('user-id', validJoinRequestUserId.toString())
            .send({ userId: validJoinRequestUserId.toString() }) // Use the join request user
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.success).to.be.true;
                done();
            });
    });
});
